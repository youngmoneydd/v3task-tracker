"use server";

import { hash } from "bcryptjs";
import { WorkspaceRole, WorkspaceType } from "@prisma/client";

import { prisma } from "@/db/client";
import { registerSchema } from "@/lib/validators";

export async function registerUser(input: { email: string; password: string; name?: string }) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Невалидные данные" };
  }

  try {
    const email = parsed.data.email.toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return { ok: false as const, error: "Пользователь с таким email уже существует" };
    }

    const passwordHash = await hash(parsed.data.password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: parsed.data.name,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${user.name ?? "My"} Workspace`,
          type: WorkspaceType.personal,
          ownerId: user.id,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: WorkspaceRole.owner,
        },
      });

      await tx.project.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          name: "Inbox",
        },
      });
    });

    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("P1001")) {
      return { ok: false as const, error: "Нет подключения к базе данных. Проверьте PostgreSQL и DATABASE_URL." };
    }
    return { ok: false as const, error: "Не удалось создать аккаунт. Попробуйте еще раз." };
  }
}
