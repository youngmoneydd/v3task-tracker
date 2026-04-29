import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Settings / Profile</h2>
      <div className="rounded-xl border p-4 dark:border-slate-700">
        <p className="text-sm text-slate-500">Current user</p>
        <p className="font-medium">{session?.user?.email}</p>
      </div>
      <div className="rounded-xl border p-4 dark:border-slate-700">
        <p className="text-sm text-slate-500">Productivity preferences</p>
        <p className="text-sm">Pomodoro: 25m, Short break: 5m</p>
      </div>
    </div>
  );
}
