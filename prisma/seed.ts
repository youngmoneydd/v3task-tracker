import { PrismaClient, TaskPriority, TaskStatus, WorkspaceRole, WorkspaceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@tasktracker.local";
  const passwordHash = await bcrypt.hash("demo12345", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Demo User",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: `personal-${user.id}` },
    update: {},
    create: {
      id: `personal-${user.id}`,
      name: "Personal Workspace",
      type: WorkspaceType.personal,
      ownerId: user.id,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: WorkspaceRole.owner,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: `default-${workspace.id}` },
    update: {},
    create: {
      id: `default-${workspace.id}`,
      name: "Default",
      workspaceId: workspace.id,
      userId: user.id,
      color: "#334155",
    },
  });

  const existingTasks = await prisma.task.count({ where: { workspaceId: workspace.id } });
  if (existingTasks === 0) {
    await prisma.task.createMany({
      data: [
        {
          workspaceId: workspace.id,
          userId: user.id,
          projectId: project.id,
          title: "Plan week priorities",
          status: TaskStatus.todo,
          priority: TaskPriority.high,
        },
        {
          workspaceId: workspace.id,
          userId: user.id,
          projectId: project.id,
          title: "Ship inbox redesign",
          status: TaskStatus.in_progress,
          priority: TaskPriority.urgent,
        },
        {
          workspaceId: workspace.id,
          userId: user.id,
          projectId: project.id,
          title: "Review recurring tasks UX",
          status: TaskStatus.done,
          priority: TaskPriority.medium,
          completedAt: new Date(),
        },
      ],
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
