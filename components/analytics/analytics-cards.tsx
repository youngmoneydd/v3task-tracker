"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { translate, type AppLang } from "@/lib/i18n/messages";

export function AnalyticsCards({
  lang,
  completedToday,
  completedWeek,
  completedMonth,
  overdue,
  sessions,
}: {
  lang: AppLang;
  completedToday: number;
  completedWeek: number;
  completedMonth: number;
  overdue: number;
  sessions: number;
}) {
  const data = [
    { name: translate(lang, "today"), value: completedToday },
    { name: translate(lang, "week"), value: completedWeek },
    { name: translate(lang, "month"), value: completedMonth },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card title={translate(lang, "completedToday")} value={completedToday} />
        <Card title={translate(lang, "completedWeek")} value={completedWeek} />
        <Card title={translate(lang, "completedMonth")} value={completedMonth} />
        <Card title={translate(lang, "overdue")} value={overdue} />
        <Card title={translate(lang, "focusSessions")} value={sessions} />
      </div>
      <div className="h-56 rounded-xl border p-3 dark:border-slate-700">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <Tooltip />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border p-3 dark:border-slate-700">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
