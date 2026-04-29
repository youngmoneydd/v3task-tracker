import { TaskClientView } from "@/components/tasks/task-client-view";
import { listTasks } from "@/features/tasks/service";
import { translate } from "@/lib/i18n/messages";
import { getServerLang } from "@/lib/i18n/server";

export default async function MatrixPage() {
  const tasks = await listTasks();
  const lang = await getServerLang();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{translate(lang, "navMatrix")}</h2>
      <TaskClientView tasks={tasks} mode="matrix" />
    </div>
  );
}
