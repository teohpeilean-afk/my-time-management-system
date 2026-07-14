"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn({ email, password });
      if (!result.ok) {
        setError(result.error ?? "Login failed.");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
        />
      </label>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-600 dark:text-white dark:hover:bg-brand-700"
      >
        {pending && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
