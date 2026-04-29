import { getServerSession } from "next-auth";

import { SettingsPanel } from "@/components/settings/settings-panel";
import { prisma } from "@/db/client";
import { authOptions } from "@/lib/auth-options";
import { translate } from "@/lib/i18n/messages";
import { getServerLang } from "@/lib/i18n/server";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const lang = await getServerLang();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, pomodoroMinutes: true, shortBreakMin: true, longBreakMin: true },
      })
    : null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{translate(lang, "settingsProfile")}</h2>
      <SettingsPanel
        email={user?.email ?? session?.user?.email}
        defaults={{
          pomodoroMinutes: user?.pomodoroMinutes ?? 25,
          shortBreakMin: user?.shortBreakMin ?? 5,
          longBreakMin: user?.longBreakMin ?? 15,
        }}
      />
    </div>
  );
}
