import { endOfMonth, endOfWeek, endOfToday, startOfMonth, startOfToday, startOfWeek } from "date-fns";

import { AnalyticsCards } from "@/components/analytics/analytics-cards";
import { prisma } from "@/db/client";
import { getCurrentUserContext } from "@/features/tasks/service";

export default async function AnalyticsPage() {
  const ctx = await getCurrentUserContext();
  if (!ctx) return null;

  const baseWhere = { userId: ctx.userId, workspaceId: ctx.workspaceId };
  const [completedToday, completedWeek, completedMonth, overdue, sessions] = await Promise.all([
    prisma.task.count({ where: { ...baseWhere, completedAt: { gte: startOfToday(), lte: endOfToday() } } }),
    prisma.task.count({ where: { ...baseWhere, completedAt: { gte: startOfWeek(new Date()), lte: endOfWeek(new Date()) } } }),
    prisma.task.count({ where: { ...baseWhere, completedAt: { gte: startOfMonth(new Date()), lte: endOfMonth(new Date()) } } }),
    prisma.task.count({ where: { ...baseWhere, dueDate: { lt: startOfToday() }, status: { not: "done" } } }),
    prisma.pomodoroSession.count({
      where: { ...baseWhere, startedAt: { gte: startOfWeek(new Date()), lte: endOfWeek(new Date()) }, status: "completed" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Analytics</h2>
      <AnalyticsCards
        completedToday={completedToday}
        completedWeek={completedWeek}
        completedMonth={completedMonth}
        overdue={overdue}
        sessions={sessions}
      />
    </div>
  );
}
