"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Task, Tag, TaskStatus, TaskPriority, Project } from "@prisma/client";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { format, isToday, isBefore, startOfDay } from "date-fns";

import { completePomodoroAction, createTaskAction, deleteTaskAction, updateTaskAction } from "@/features/tasks/actions";

type TaskWithMeta = Task & {
  taskTags: { tag: Tag }[];
  subtasks: Task[];
  project?: Project | null;
};

type ViewMode = "list" | "today" | "upcoming" | "calendar" | "kanban";

export function TaskClientView({ tasks, mode }: { tasks: TaskWithMeta[]; mode: ViewMode }) {
  const [title, setTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskWithMeta | null>(null);
  const [smartFilter, setSmartFilter] = useState<"all" | "today" | "overdue" | "no-date" | "high">("all");
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
      const key = task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : "No date";
      acc[key] = [...(acc[key] ?? []), task];
      return acc;
    }, {});
  }, [tasks]);

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
      await createTaskAction({ title, status: mode === "list" ? "inbox" : "todo" });
      setTitle("");
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
          className="w-full rounded-xl border px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          placeholder="Quick add task..."
        />
        <button onClick={createNewTask} disabled={isPending} className="rounded-xl bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900">
          Add
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <KpiCard title="All tasks" value={tasks.length} />
        <KpiCard title="Today" value={todayTasks.length} />
        <KpiCard title="Overdue" value={overdueCount} />
        <KpiCard title="Done" value={tasks.filter((t) => t.status === "done").length} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["today", "Today"],
          ["overdue", "Overdue"],
          ["no-date", "No date"],
          ["high", "High priority"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSmartFilter(id as "all" | "today" | "overdue" | "no-date" | "high")}
            className={`rounded-lg border px-3 py-1 text-xs ${smartFilter === id ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : ""}`}
          >
            {label}
          </button>
        ))}
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
          <option value="all">All projects</option>
          {projectOptions.map(([id, name]) => (
            <option value={id} key={id}>
              {name}
            </option>
          ))}
        </select>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="rounded-lg border px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
          <option value="all">All tags</option>
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
      />

      {mode === "calendar" && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Object.entries(groupedByDate).map(([date, dateTasks]) => (
            <div key={date} className="rounded-xl border p-3 dark:border-slate-700">
              <h3 className="mb-2 text-sm font-semibold">{date}</h3>
              <TaskRows tasks={dateTasks} onDelete={deleteTaskAction} onToggle={moveTask} />
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
                  <div ref={provided.innerRef} {...provided.droppableProps} className="rounded-xl border p-3 dark:border-slate-700">
                    <h3 className="mb-3 text-sm font-semibold">{status}</h3>
                    <div className="space-y-2">
                      {statusTasks.map((task, idx) => (
                        <Draggable draggableId={task.id} index={idx} key={task.id}>
                          {(draggable) => (
                            <div
                              ref={draggable.innerRef}
                              {...draggable.draggableProps}
                              {...draggable.dragHandleProps}
                              className="rounded-lg border p-2 text-sm dark:border-slate-700"
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
}: {
  tasks: TaskWithMeta[];
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onToggle: (id: string, status: TaskStatus) => void;
  onPomodoro?: (taskId: string | null, durationSec?: number) => Promise<{ ok: boolean }>;
  onEdit?: (task: TaskWithMeta) => void;
  onFocus?: (taskId: string) => void;
}) {
  const [, startTransition] = useTransition();
  if (!tasks.length) {
    return <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500 dark:border-slate-700">No tasks yet</div>;
  }
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="rounded-xl border p-3 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-xs text-slate-500">{task.priority} · {task.status}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded border px-2 py-1 text-xs" onClick={() => onToggle(task.id, task.status === "done" ? "todo" : "done")}>
                {task.status === "done" ? "Uncomplete" : "Complete"}
              </button>
              <button className="rounded border px-2 py-1 text-xs" onClick={() => startTransition(async () => { await onDelete(task.id); })}>
                Delete
              </button>
              {onEdit && (
                <button className="rounded border px-2 py-1 text-xs" onClick={() => onEdit(task)}>
                  Edit
                </button>
              )}
              {onFocus && (
                <button className="rounded border px-2 py-1 text-xs" onClick={() => onFocus(task.id)}>
                  Focus
                </button>
              )}
              {onPomodoro && (
                <button className="rounded border px-2 py-1 text-xs" onClick={() => startTransition(async () => { await onPomodoro(task.id, 1500); })}>
                  +Pomodoro
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
    <div className="rounded-xl border p-3 dark:border-slate-700">
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
}: {
  isRunning: boolean;
  secondsLeft: number;
  onStart: (taskId: string | null) => void;
  onStop: () => void;
  focusTaskId: string | null;
}) {
  const min = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const sec = String(secondsLeft % 60).padStart(2, "0");
  return (
    <div className="rounded-xl border p-3 dark:border-slate-700">
      <p className="text-sm font-semibold">Focus mode</p>
      <p className="text-3xl font-bold">{min}:{sec}</p>
      <p className="text-xs text-slate-500">Task: {focusTaskId ?? "not selected"}</p>
      <div className="mt-2 flex gap-2">
        <button className="rounded border px-3 py-1 text-xs" onClick={() => onStart(focusTaskId)} disabled={isRunning}>
          Start
        </button>
        <button className="rounded border px-3 py-1 text-xs" onClick={onStop} disabled={!isRunning}>
          Stop
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
  onSave: (payload: { title: string; description?: string; status: TaskStatus; priority: TaskPriority; dueDate?: string; progress: number }) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [progress, setProgress] = useState(task.progress);
  const [dueDate, setDueDate] = useState(task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : "");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-4 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit task</h3>
          <button className="rounded border px-2 py-1 text-xs" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="space-y-3">
          <input className="w-full rounded border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="w-full rounded border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="rounded border px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
              <option value="inbox">inbox</option>
              <option value="todo">todo</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="rounded border px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
          </div>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
          <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full" />
          <p className="text-xs text-slate-500">Progress: {progress}%</p>
          <button
            className="w-full rounded bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900"
            onClick={() => onSave({ title, description, status, priority, dueDate: dueDate || undefined, progress })}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
