import { TaskClientView } from "@/components/tasks/task-client-view";
import { listTasks } from "@/features/tasks/service";

export default async function UpcomingPage() {
  const tasks = await listTasks();
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Upcoming</h2>
      <TaskClientView tasks={tasks} mode="upcoming" />
    </div>
  );
}
