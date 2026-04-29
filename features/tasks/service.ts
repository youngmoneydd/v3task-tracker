import { TaskPriority, TaskStatus } from "@prisma/client";
import { getServerSession } from "next-auth";

import { prisma } from "@/db/client";
import { authOptions } from "@/lib/auth-options";
import { createTaskSchema, updateTaskSchema } from "@/lib/validators";

export async function getCurrentUserContext() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
  });

  if (!membership) return null;
  return { userId, workspaceId: membership.workspaceId };
}

export async function listTasks() {
  const ctx = await getCurrentUserContext();
  if (!ctx) return [];

  return prisma.task.findMany({
    where: { userId: ctx.userId, workspaceId: ctx.workspaceId },
    include: {
      taskTags: { include: { tag: true } },
      subtasks: true,
      project: true,
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}

export async function createTask(input: unknown) {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const task = await prisma.task.create({
    data: {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueTime: data.dueTime,
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
    },
  });

  for (const tagName of data.tags) {
    const tag = await prisma.tag.upsert({
      where: { workspaceId_name: { workspaceId: ctx.workspaceId, name: tagName } },
      update: {},
      create: { workspaceId: ctx.workspaceId, userId: ctx.userId, name: tagName },
    });
    await prisma.taskTag.upsert({
      where: { taskId_tagId: { taskId: task.id, tagId: tag.id } },
      update: {},
      create: { taskId: task.id, tagId: tag.id },
    });
  }

  return { ok: true as const };
}

export async function updateTask(input: unknown) {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const data = parsed.data;
  const task = await prisma.task.findFirst({ where: { id: data.id, userId: ctx.userId, workspaceId: ctx.workspaceId } });
  if (!task) return { ok: false as const, error: "Task not found" };

  await prisma.task.update({
    where: { id: task.id },
    data: {
      title: data.title ?? task.title,
      description: data.description ?? task.description,
      status: (data.status as TaskStatus | undefined) ?? task.status,
      priority: (data.priority as TaskPriority | undefined) ?? task.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : task.dueDate,
      dueTime: data.dueTime ?? task.dueTime,
      startDate: data.startDate ? new Date(data.startDate) : task.startDate,
      progress: data.progress ?? task.progress,
      completedPomodoros: data.completedPomodoros ?? task.completedPomodoros,
      completedAt: data.status === "done" ? new Date() : null,
    },
  });

  return { ok: true as const };
}

export async function deleteTask(taskId: string) {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  await prisma.task.deleteMany({ where: { id: taskId, userId: ctx.userId, workspaceId: ctx.workspaceId } });
  return { ok: true as const };
}

export async function createPomodoro(taskId: string | null, durationSec = 1500) {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false as const };
  await prisma.pomodoroSession.create({
    data: {
      taskId,
      durationSec,
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
      status: "completed",
      endedAt: new Date(),
    },
  });
  if (taskId) {
    await prisma.task.updateMany({
      where: { id: taskId, userId: ctx.userId, workspaceId: ctx.workspaceId },
      data: { completedPomodoros: { increment: 1 } },
    });
  }
  return { ok: true as const };
}
