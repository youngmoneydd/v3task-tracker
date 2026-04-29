"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export function AnalyticsCards({
  completedToday,
  completedWeek,
  completedMonth,
  overdue,
  sessions,
}: {
  completedToday: number;
  completedWeek: number;
  completedMonth: number;
  overdue: number;
  sessions: number;
}) {
  const data = [
    { name: "Today", value: completedToday },
    { name: "Week", value: completedWeek },
    { name: "Month", value: completedMonth },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card title="Completed today" value={completedToday} />
        <Card title="Completed week" value={completedWeek} />
        <Card title="Completed month" value={completedMonth} />
        <Card title="Overdue" value={overdue} />
        <Card title="Focus sessions" value={sessions} />
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
