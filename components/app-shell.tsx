"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAppLang } from "@/lib/use-app-lang";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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
    <div className="min-h-screen bg-stone-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-3 p-2 md:grid-cols-[260px_1fr] md:p-3">
        <aside className="rounded-2xl border border-stone-200 bg-stone-50 p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <h1 className="mb-4 text-lg font-semibold">TaskFlow</h1>
          <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${pathname === item.href ? "bg-white text-slate-900 shadow-sm ring-1 ring-stone-300 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700" : "text-slate-600 hover:bg-stone-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{t("language")}:</span>
              <button
                className={`rounded-md border px-2 py-1 transition ${lang === "ru" ? "border-stone-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" : "dark:border-slate-700"}`}
                onClick={() => {
                  setLang("ru");
                  router.refresh();
                }}
              >
                RU
              </button>
              <button
                className={`rounded-md border px-2 py-1 transition ${lang === "en" ? "border-stone-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" : "dark:border-slate-700"}`}
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
        <main className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
