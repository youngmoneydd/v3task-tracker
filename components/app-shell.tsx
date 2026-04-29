"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

const navItems = [
  { href: "/inbox", label: "Inbox" },
  { href: "/today", label: "Today" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/calendar", label: "Calendar" },
  { href: "/kanban", label: "Kanban" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-3 md:grid-cols-[230px_1fr] md:p-4">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="mb-4 text-lg font-semibold">TaskFlow</h1>
          <nav className="grid grid-cols-3 gap-2 md:grid-cols-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm ${pathname === item.href ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex gap-2">
            <button className="rounded-lg border px-3 py-1 text-xs" onClick={() => setTheme("light")}>
              Light
            </button>
            <button className="rounded-lg border px-3 py-1 text-xs" onClick={() => setTheme("dark")}>
              Dark
            </button>
            <button className="rounded-lg border px-3 py-1 text-xs" onClick={() => signOut({ callbackUrl: "/login" })}>
              Logout
            </button>
          </div>
        </aside>
        <main className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
