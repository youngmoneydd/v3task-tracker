import { TaskClientView } from "@/components/tasks/task-client-view";
import { listTasks } from "@/features/tasks/service";
import { translate } from "@/lib/i18n/messages";
import { getServerLang } from "@/lib/i18n/server";

export default async function UpcomingPage() {
  const tasks = await listTasks();
  const lang = await getServerLang();
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{translate(lang, "navUpcoming")}</h2>
      <TaskClientView tasks={tasks} mode="upcoming" />
    </div>
  );
}
