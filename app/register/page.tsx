"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { registerUser } from "@/features/auth/actions";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await registerUser({ name, email, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (signInResult?.error) {
        setError("Аккаунт создан, но не удалось выполнить вход. Войдите вручную.");
        router.push("/login");
        return;
      }

      router.push("/today");
      router.refresh();
    } catch {
      setError("Ошибка регистрации. Проверьте подключение к базе и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold">Регистрация</h1>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        <button disabled={loading} className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900">
          {loading ? "Создаем..." : "Создать аккаунт"}
        </button>
        <p className="mt-3 text-sm text-slate-500">
          Уже есть аккаунт? <Link href="/login" className="underline">Войти</Link>
        </p>
      </form>
    </main>
  );
}
