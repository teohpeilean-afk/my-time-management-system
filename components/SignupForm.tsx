"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/app/actions/auth";

const inputClass =
  "block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20";
const labelClass = "mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300";

export function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [staffNo, setStaffNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signUp({ email, password, fullName, staffNo });
      if (!result.ok) {
        setError(result.error ?? "Sign up failed.");
        return;
      }
      if (result.needsConfirmation) {
        setNeedsConfirmation(true);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  if (needsConfirmation) {
    return (
      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10l4 4 8-8" />
          </svg>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Account created. Check <strong className="text-neutral-900 dark:text-neutral-100">{email}</strong> for a
          confirmation link, then log in.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <label className="block">
        <span className={labelClass}>Full name</span>
        <input
          required
          autoComplete="name"
          placeholder="Ahmad Zulkifli"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>
          Staff No <span className="font-normal text-neutral-400">(optional — links your existing record)</span>
        </span>
        <input
          placeholder="e.g. W-001"
          value={staffNo}
          onChange={(e) => setStaffNo(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Password</span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
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
        {pending ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}
