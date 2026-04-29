"use server";

import { compare, hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { prisma } from "@/db/client";
import { authOptions } from "@/lib/auth-options";
import { changePasswordSchema, updateProductivitySchema } from "@/lib/validators";

export async function updateProductivitySettings(input: unknown) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: "Требуется авторизация" };

  const parsed = updateProductivitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Невалидные данные" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
  });

  revalidatePath("/settings");
  return { ok: true as const };
}

export async function changePassword(input: unknown) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: "Требуется авторизация" };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Невалидные данные" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return { ok: false as const, error: "Пользователь не найден" };

  const isCurrentValid = await compare(parsed.data.currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    return { ok: false as const, error: "Старый пароль неверный" };
  }

  const newHash = await hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return { ok: true as const };
}
