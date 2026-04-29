import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Введите корректный email"),
  password: z.string().min(8, "Пароль должен быть не менее 8 символов"),
  name: z.string().min(2, "Имя должно быть не менее 2 символов").optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Название задачи обязательно"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["inbox", "todo", "in_progress", "done"]).default("inbox"),
  startDate: z.string().optional(),
  dueTime: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().min(1),
  progress: z.number().int().min(0).max(100).optional(),
  completedPomodoros: z.number().int().min(0).optional(),
});
