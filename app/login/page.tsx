"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAppLang } from "@/lib/use-app-lang";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useAppLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError(t("invalidCredentials"));
      return;
    }
    router.push("/today");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 p-4 dark:bg-slate-950">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <h1 className="text-2xl font-semibold">{t("login")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("loginTagline")}</p>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded-lg border px-3 py-2 transition focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800" placeholder={t("email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-lg border px-3 py-2 transition focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800" placeholder={t("password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        <button disabled={loading} className="mt-4 w-full rounded-lg bg-slate-800 px-4 py-2 text-white transition hover:bg-slate-700 disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900">
          {loading ? t("signingIn") : t("signIn")}
        </button>
        <p className="mt-3 text-sm text-slate-500">
          {t("noAccount")} <Link href="/register" className="underline">{t("create")}</Link>
        </p>
      </form>
    </main>
  );
}
