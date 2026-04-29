import { prisma } from "@/db/client";
import { getCurrentUserContext } from "@/features/tasks/service";
import { TaskClientView } from "@/components/tasks/task-client-view";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const ctx = await getCurrentUserContext();
  if (!ctx) return null;

  const tasks = await prisma.task.findMany({
    where: { projectId, userId: ctx.userId, workspaceId: ctx.workspaceId },
    include: { taskTags: { include: { tag: true } }, subtasks: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Project</h2>
      <TaskClientView tasks={tasks} mode="list" />
    </div>
  );
}
