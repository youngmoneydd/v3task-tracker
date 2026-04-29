"use server";

import { revalidatePath } from "next/cache";

import { createPomodoro, createTask, deleteTask, updateTask } from "@/features/tasks/service";

export async function createTaskAction(input: unknown) {
  const result = await createTask(input);
  revalidatePath("/inbox");
  revalidatePath("/today");
  revalidatePath("/upcoming");
  revalidatePath("/kanban");
  revalidatePath("/matrix");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  return result;
}

export async function updateTaskAction(input: unknown) {
  const result = await updateTask(input);
  revalidatePath("/inbox");
  revalidatePath("/today");
  revalidatePath("/upcoming");
  revalidatePath("/kanban");
  revalidatePath("/matrix");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  return result;
}

export async function deleteTaskAction(taskId: string) {
  const result = await deleteTask(taskId);
  revalidatePath("/inbox");
  revalidatePath("/today");
  revalidatePath("/upcoming");
  revalidatePath("/kanban");
  revalidatePath("/matrix");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  return result;
}

export async function completePomodoroAction(taskId: string | null, durationSec = 1500) {
  const result = await createPomodoro(taskId, durationSec);
  revalidatePath("/analytics");
  revalidatePath("/inbox");
  return result;
}
