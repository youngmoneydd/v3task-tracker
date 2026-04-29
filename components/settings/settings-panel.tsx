"use client";

import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";

import { changePassword, updateProductivitySettings } from "@/features/settings/actions";

type SettingsPanelProps = {
  email?: string | null;
  defaults: {
    pomodoroMinutes: number;
    shortBreakMin: number;
    longBreakMin: number;
  };
};

export function SettingsPanel({ email, defaults }: SettingsPanelProps) {
  const [isPending, startTransition] = useTransition();

  const [pomodoroMinutes, setPomodoroMinutes] = useState(String(defaults.pomodoroMinutes));
  const [shortBreakMin, setShortBreakMin] = useState(String(defaults.shortBreakMin));
  const [longBreakMin, setLongBreakMin] = useState(String(defaults.longBreakMin));
  const [settingsMsg, setSettingsMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  const saveSettings = () => {
    setSettingsMsg("");
    startTransition(async () => {
      const result = await updateProductivitySettings({
        pomodoroMinutes: Number(pomodoroMinutes),
        shortBreakMin: Number(shortBreakMin),
        longBreakMin: Number(longBreakMin),
      });
      setSettingsMsg(result.ok ? "Настройки сохранены" : result.error ?? "Не удалось сохранить");
    });
  };

  const submitPassword = () => {
    setPasswordMsg("");
    startTransition(async () => {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!result.ok) {
        setPasswordMsg(result.error ?? "Не удалось изменить пароль");
        return;
      }
      setPasswordMsg("Пароль обновлен");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 dark:border-slate-700">
        <p className="text-sm text-slate-500">Текущий пользователь</p>
        <p className="font-medium">{email ?? "-"}</p>
      </div>

      <div className="rounded-xl border p-4 dark:border-slate-700">
        <h3 className="text-base font-semibold">Настройки продуктивности</h3>
        <p className="mt-1 text-sm text-slate-500">Параметры помодоро и перерывов</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberField label="Помодоро (мин)" value={pomodoroMinutes} onChange={setPomodoroMinutes} />
          <NumberField label="Короткий перерыв (мин)" value={shortBreakMin} onChange={setShortBreakMin} />
          <NumberField label="Длинный перерыв (мин)" value={longBreakMin} onChange={setLongBreakMin} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={saveSettings}
            disabled={isPending}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white transition hover:bg-violet-500 disabled:opacity-70"
          >
            Сохранить настройки
          </button>
          {settingsMsg ? <span className="text-sm text-slate-500">{settingsMsg}</span> : null}
        </div>
      </div>

      <div className="rounded-xl border p-4 dark:border-slate-700">
        <h3 className="text-base font-semibold">Изменение пароля</h3>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <input
            type="password"
            placeholder="Старый пароль"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
          <input
            type="password"
            placeholder="Новый пароль"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
          <input
            type="password"
            placeholder="Повторите новый пароль"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={submitPassword}
            disabled={isPending}
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-slate-100 disabled:opacity-70 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Обновить пароль
          </button>
          {passwordMsg ? <span className="text-sm text-slate-500">{passwordMsg}</span> : null}
        </div>
      </div>

      <div className="rounded-xl border p-4 dark:border-slate-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg border px-4 py-2 text-sm transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-slate-500">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
      />
    </label>
  );
}
