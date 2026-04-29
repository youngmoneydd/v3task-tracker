"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Task, Tag, TaskStatus, TaskPriority, Project } from "@prisma/client";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { format, isToday, isBefore, startOfDay } from "date-fns";

import { completePomodoroAction, createTaskAction, deleteTaskAction, updateTaskAction } from "@/features/tasks/actions";
import type { MessageKey } from "@/lib/i18n/messages";
import { useAppLang } from "@/lib/use-app-lang";

type TaskWithMeta = Task & {
  taskTags: { tag: Tag }[];
  subtasks: Task[];
  project?: Project | null;
};

type ViewMode = "list" | "today" | "upcoming" | "calendar" | "kanban" | "matrix";
type SmartFilter = "all" | "today" | "overdue" | "no-date" | "high";
type Translator = (key: MessageKey) => string;

export function TaskClientView({ tasks, mode }: { tasks: TaskWithMeta[]; mode: ViewMode }) {
  const { t } = useAppLang();
  const [title, setTitle] = useState("");
  const [estimateHours, setEstimateHours] = useState("1");
  const [selectedTask, setSelectedTask] = useState<TaskWithMeta | null>(null);
  const [smartFilter, setSmartFilter] = useState<SmartFilter>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPending, startTransition] = useTransition();

  const overdueCount = useMemo(
    () => tasks.filter((task) => task.dueDate && isBefore(task.dueDate, startOfDay(new Date())) && task.status !== "done").length,
    [tasks],
  );

  const todayTasks = useMemo(() => tasks.filter((task) => task.dueDate && isToday(task.dueDate)), [tasks]);

  const groupedByDate = useMemo(() => {
    return tasks.reduce<Record<string, TaskWithMeta[]>>((acc, task) => {
      const key = task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : t("noDate");
      acc[key] = [...(acc[key] ?? []), task];
      return acc;
    }, {});
  }, [tasks, t]);

  const byStatus = useMemo(
    () =>
      ({
        inbox: tasks.filter((task) => task.status === "inbox"),
        todo: tasks.filter((task) => task.status === "todo"),
        in_progress: tasks.filter((task) => task.status === "in_progress"),
        done: tasks.filter((task) => task.status === "done"),
      }) satisfies Record<TaskStatus, TaskWithMeta[]>,
    [tasks],
  );

  const filtered = useMemo(() => {
    let result = tasks;
    if (mode === "today") result = todayTasks;
    if (mode === "upcoming") result = tasks.filter((task) => task.dueDate && !isToday(task.dueDate));
    if (smartFilter === "today") result = result.filter((task) => task.dueDate && isToday(task.dueDate));
    if (smartFilter === "overdue") result = result.filter((task) => task.dueDate && isBefore(task.dueDate, startOfDay(new Date())) && task.status !== "done");
    if (smartFilter === "no-date") result = result.filter((task) => !task.dueDate);
    if (smartFilter === "high") result = result.filter((task) => task.priority === "high" || task.priority === "urgent");
    if (projectFilter !== "all") result = result.filter((task) => task.projectId === projectFilter);
    if (tagFilter !== "all") result = result.filter((task) => task.taskTags.some((tt) => tt.tag.name === tagFilter));
    return result;
  }, [mode, tasks, todayTasks, smartFilter, projectFilter, tagFilter]);

  const matrix = useMemo(() => {
    const isImportant = (task: TaskWithMeta) => task.priority === "high" || task.priority === "urgent";
    const isUrgent = (task: TaskWithMeta) =>
      Boolean(task.dueDate && (isToday(task.dueDate) || isBefore(task.dueDate, startOfDay(new Date()))));

    return {
      doNow: filtered.filter((task) => isImportant(task) && isUrgent(task)),
      schedule: filtered.filter((task) => isImportant(task) && !isUrgent(task)),
      delegate: filtered.filter((task) => !isImportant(task) && isUrgent(task)),
      eliminate: filtered.filter((task) => !isImportant(task) && !isUrgent(task)),
    };
  }, [filtered]);

  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((task) => {
      if (task.projectId && task.project?.name) map.set(task.projectId, task.project.name);
    });
    return Array.from(map.entries());
  }, [tasks]);

  const tagOptions = useMemo(() => Array.from(new Set(tasks.flatMap((task) => task.taskTags.map((tt) => tt.tag.name)))), [tasks]);

  const createNewTask = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      await createTaskAction({
        title,
        status: mode === "list" ? "inbox" : "todo",
        estimateHours: Number(estimateHours) || 1,
      });
      setTitle("");
      setEstimateHours("1");
    });
  };

  const moveTask = (id: string, status: TaskStatus) => {
    startTransition(async () => {
      await updateTaskAction({ id, status });
    });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const destinationStatus = result.destination.droppableId as TaskStatus;
    moveTask(taskId, destinationStatus);
  };

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          startTransition(async () => {
            await completePomodoroAction(focusTaskId, 25 * 60);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isTimerRunning, focusTaskId, startTransition]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-xl border px-4 py-2 text-sm transition focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          placeholder={t("quickAdd")}
        />
        <input
          value={estimateHours}
          onChange={(event) => setEstimateHours(event.target.value)}
          type="number"
          min={0.25}
          step={0.25}
          className="w-full rounded-xl border px-4 py-2 text-sm transition focus:border-violet-500 focus:outline-none sm:w-36 dark:border-slate-700 dark:bg-slate-800"
          placeholder="часы"
        />
        <button onClick={createNewTask} disabled={isPending} className="rounded-xl bg-violet-600 px-4 py-2 text-white transition hover:bg-violet-500 disabled:opacity-70 dark:bg-violet-500">
          {t("add")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <KpiCard title={t("allTasks")} value={tasks.length} />
        <KpiCard title={t("today")} value={todayTasks.length} />
        <KpiCard title={t("overdue")} value={overdueCount} />
        <KpiCard title={t("done")} value={tasks.filter((task) => task.status === "done").length} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["all", t("all")],
          ["today", t("today")],
          ["overdue", t("overdue")],
          ["no-date", t("noDate")],
          ["high", t("highPriority")],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSmartFilter(id as SmartFilter)}
            className={`rounded-lg border px-3 py-1 text-xs transition ${smartFilter === id ? "border-violet-500 bg-violet-600 text-white dark:bg-violet-500" : "dark:border-slate-700"}`}
          >
            {label}
          </button>
        ))}
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border px-2 py-1 text-xs transition focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800">
          <option value="all">{t("allProjects")}</option>
          {projectOptions.map(([id, name]) => (
            <option value={id} key={id}>
              {name}
            </option>
          ))}
        </select>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="rounded-lg border px-2 py-1 text-xs transition focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800">
          <option value="all">{t("allTags")}</option>
          {tagOptions.map((name) => (
            <option value={name} key={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <PomodoroWidget
        isRunning={isTimerRunning}
        secondsLeft={secondsLeft}
        onStart={(taskId) => {
          setFocusTaskId(taskId);
          setSecondsLeft(25 * 60);
          setIsTimerRunning(true);
        }}
        onStop={() => setIsTimerRunning(false)}
        focusTaskId={focusTaskId}
        t={t}
      />

      {mode === "calendar" && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Object.entries(groupedByDate).map(([date, dateTasks]) => (
            <div key={date} className="rounded-xl border p-3 shadow-sm dark:border-slate-700">
              <h3 className="mb-2 text-sm font-semibold">{date}</h3>
              <TaskRows tasks={dateTasks} onDelete={deleteTaskAction} onToggle={moveTask} t={t} />
            </div>
          ))}
        </div>
      )}

      {mode === "kanban" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            {Object.entries(byStatus).map(([status, statusTasks]) => (
              <Droppable key={status} droppableId={status}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="rounded-xl border p-3 shadow-sm dark:border-slate-700">
                    <h3 className="mb-3 text-sm font-semibold">{statusLabel(status as TaskStatus, t)}</h3>
                    <div className="space-y-2">
                      {statusTasks.map((task, idx) => (
                        <Draggable draggableId={task.id} index={idx} key={task.id}>
                          {(draggable) => (
                            <div
                              ref={draggable.innerRef}
                              {...draggable.draggableProps}
                              {...draggable.dragHandleProps}
                              className="rounded-lg border border-slate-200 p-2 text-sm transition hover:border-violet-300 hover:shadow-sm dark:border-slate-700 dark:hover:border-violet-500"
                            >
                              {task.title}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      {mode === "matrix" && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <MatrixQuadrant title={t("quadrantDo")} tasks={matrix.doNow} onDelete={deleteTaskAction} onToggle={moveTask} t={t} />
          <MatrixQuadrant title={t("quadrantSchedule")} tasks={matrix.schedule} onDelete={deleteTaskAction} onToggle={moveTask} t={t} />
          <MatrixQuadrant title={t("quadrantDelegate")} tasks={matrix.delegate} onDelete={deleteTaskAction} onToggle={moveTask} t={t} />
          <MatrixQuadrant title={t("quadrantEliminate")} tasks={matrix.eliminate} onDelete={deleteTaskAction} onToggle={moveTask} t={t} />
        </div>
      )}

      {(mode === "list" || mode === "today" || mode === "upcoming") && (
        <TaskRows
          tasks={filtered}
          onDelete={deleteTaskAction}
          onToggle={moveTask}
          onPomodoro={completePomodoroAction}
          onEdit={(task) => setSelectedTask(task)}
          onFocus={(taskId) => {
            setFocusTaskId(taskId);
            setSecondsLeft(25 * 60);
            setIsTimerRunning(true);
          }}
          t={t}
        />
      )}

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={(payload) =>
            startTransition(async () => {
              await updateTaskAction({ id: selectedTask.id, ...payload });
              setSelectedTask(null);
            })
          }
        />
      )}
    </div>
  );
}

function TaskRows({
  tasks,
  onDelete,
  onToggle,
  onPomodoro,
  onEdit,
  onFocus,
  t,
}: {
  tasks: TaskWithMeta[];
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onToggle: (id: string, status: TaskStatus) => void;
  onPomodoro?: (taskId: string | null, durationSec?: number) => Promise<{ ok: boolean }>;
  onEdit?: (task: TaskWithMeta) => void;
  onFocus?: (taskId: string) => void;
  t: Translator;
}) {
  const [, startTransition] = useTransition();
  if (!tasks.length) {
    return <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500 dark:border-slate-700">{t("noTasksYet")}</div>;
  }
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="rounded-xl border border-slate-200 p-3 shadow-sm transition hover:border-violet-300 dark:border-slate-700 dark:hover:border-violet-500">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-xs text-slate-500">{priorityLabel(task.priority, t)} · {statusLabel(task.status, t)}</p>
              <p className="text-xs text-slate-400">~{task.estimateHours.toFixed(1)} ч</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded border px-2 py-1 text-xs transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => onToggle(task.id, task.status === "done" ? "todo" : "done")}>
                {task.status === "done" ? t("uncomplete") : t("complete")}
              </button>
              <button className="rounded border px-2 py-1 text-xs transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => startTransition(async () => { await onDelete(task.id); })}>
                {t("delete")}
              </button>
              {onEdit && (
                <button className="rounded border px-2 py-1 text-xs transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => onEdit(task)}>
                  {t("edit")}
                </button>
              )}
              {onFocus && (
                <button className="rounded border px-2 py-1 text-xs transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => onFocus(task.id)}>
                  {t("focus")}
                </button>
              )}
              {onPomodoro && (
                <button className="rounded border px-2 py-1 text-xs transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => startTransition(async () => { await onPomodoro(task.id, 1500); })}>
                  {t("addPomodoro")}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 shadow-sm dark:border-slate-700">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function PomodoroWidget({
  isRunning,
  secondsLeft,
  onStart,
  onStop,
  focusTaskId,
  t,
}: {
  isRunning: boolean;
  secondsLeft: number;
  onStart: (taskId: string | null) => void;
  onStop: () => void;
  focusTaskId: string | null;
  t: Translator;
}) {
  const min = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const sec = String(secondsLeft % 60).padStart(2, "0");
  return (
    <div className="rounded-xl border border-slate-200 p-3 shadow-sm dark:border-slate-700">
      <p className="text-sm font-semibold">{t("focusMode")}</p>
      <p className="text-3xl font-bold">{min}:{sec}</p>
      <p className="text-xs text-slate-500">{t("taskLabel")}: {focusTaskId ?? t("notSelected")}</p>
      <div className="mt-2 flex gap-2">
        <button className="rounded border px-3 py-1 text-xs transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => onStart(focusTaskId)} disabled={isRunning}>
          {t("start")}
        </button>
        <button className="rounded border px-3 py-1 text-xs transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={onStop} disabled={!isRunning}>
          {t("stop")}
        </button>
      </div>
    </div>
  );
}

function TaskDrawer({
  task,
  onClose,
  onSave,
}: {
  task: TaskWithMeta;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    progress: number;
    estimateHours: number;
  }) => void;
}) {
  const { t } = useAppLang();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [progress, setProgress] = useState(task.progress);
  const [hours, setHours] = useState(String(task.estimateHours ?? 1));
  const [dueDate, setDueDate] = useState(task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : "");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-4 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("editTask")}</h3>
          <button className="rounded border px-2 py-1 text-xs transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={onClose}>
            {t("close")}
          </button>
        </div>
        <div className="space-y-3">
          <input className="w-full rounded border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="w-full rounded border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="rounded border px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
              <option value="inbox">{t("statusInbox")}</option>
              <option value="todo">{t("statusTodo")}</option>
              <option value="in_progress">{t("statusInProgress")}</option>
              <option value="done">{t("statusDone")}</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="rounded border px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
          </div>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full rounded border px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Оценка часов"
          />
          <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full" />
          <p className="text-xs text-slate-500">{t("progress")}: {progress}%</p>
          <button
            className="w-full rounded bg-violet-600 px-4 py-2 text-white transition hover:bg-violet-500 dark:bg-violet-500"
            onClick={() =>
              onSave({
                title,
                description,
                status,
                priority,
                dueDate: dueDate || undefined,
                progress,
                estimateHours: Number(hours) || 1,
              })
            }
          >
            {t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

function MatrixQuadrant({
  title,
  tasks,
  onDelete,
  onToggle,
  t,
}: {
  title: string;
  tasks: TaskWithMeta[];
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onToggle: (id: string, status: TaskStatus) => void;
  t: Translator;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 shadow-sm dark:border-slate-700">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <TaskRows tasks={tasks} onDelete={onDelete} onToggle={onToggle} t={t} />
    </div>
  );
}

function statusLabel(status: TaskStatus, t: Translator) {
  if (status === "inbox") return t("statusInbox");
  if (status === "todo") return t("statusTodo");
  if (status === "in_progress") return t("statusInProgress");
  return t("statusDone");
}

function priorityLabel(priority: TaskPriority, t: Translator) {
  if (priority === "low") return t("priorityLow");
  if (priority === "medium") return t("priorityMedium");
  if (priority === "high") return t("priorityHigh");
  return t("priorityUrgent");
}
