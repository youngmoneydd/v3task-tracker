import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { translate } from "@/lib/i18n/messages";
import { getServerLang } from "@/lib/i18n/server";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const lang = await getServerLang();
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{translate(lang, "settingsProfile")}</h2>
      <div className="rounded-xl border p-4 dark:border-slate-700">
        <p className="text-sm text-slate-500">{translate(lang, "currentUser")}</p>
        <p className="font-medium">{session?.user?.email}</p>
      </div>
      <div className="rounded-xl border p-4 dark:border-slate-700">
        <p className="text-sm text-slate-500">{translate(lang, "productivityPreferences")}</p>
        <p className="text-sm">{translate(lang, "pomodoroConfig")}</p>
      </div>
    </div>
  );
}
