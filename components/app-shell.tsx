"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

import { useAppLang } from "@/lib/use-app-lang";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { lang, setLang, t } = useAppLang();

  const navItems = [
    { href: "/inbox", label: t("navInbox") },
    { href: "/today", label: t("navToday") },
    { href: "/upcoming", label: t("navUpcoming") },
    { href: "/calendar", label: t("navCalendar") },
    { href: "/kanban", label: t("navKanban") },
    { href: "/matrix", label: t("navMatrix") },
    { href: "/analytics", label: t("navAnalytics") },
    { href: "/settings", label: t("navSettings") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-violet-50 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-3 md:grid-cols-[250px_1fr] md:p-4">
        <aside className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="mb-4 text-lg font-semibold">TaskFlow</h1>
          <nav className="grid grid-cols-3 gap-2 md:grid-cols-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${pathname === item.href ? "bg-violet-600 text-white shadow-sm dark:bg-violet-500 dark:text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 space-y-2">
            <div className="flex gap-2">
              <button className="rounded-lg border px-3 py-1 text-xs transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => setTheme("light")}>
                {t("light")}
              </button>
              <button className="rounded-lg border px-3 py-1 text-xs transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => setTheme("dark")}>
                {t("dark")}
              </button>
              <button className="rounded-lg border px-3 py-1 text-xs transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => signOut({ callbackUrl: "/login" })}>
                {t("logout")}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{t("language")}:</span>
              <button
                className={`rounded-md border px-2 py-1 transition ${lang === "ru" ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" : "dark:border-slate-700"}`}
                onClick={() => {
                  setLang("ru");
                  router.refresh();
                }}
              >
                RU
              </button>
              <button
                className={`rounded-md border px-2 py-1 transition ${lang === "en" ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" : "dark:border-slate-700"}`}
                onClick={() => {
                  setLang("en");
                  router.refresh();
                }}
              >
                EN
              </button>
            </div>
          </div>
        </aside>
        <main className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
