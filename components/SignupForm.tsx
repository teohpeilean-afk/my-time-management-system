"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/app/actions/auth";

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
      <div className="rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        Account created. Check <strong>{email}</strong> for a confirmation link, then log in.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <label className="block text-xs text-neutral-500">
        Full name
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="block text-xs text-neutral-500">
        Staff No (optional — enter yours, e.g. W-001, to link your existing demo record)
        <input
          value={staffNo}
          onChange={(e) => setStaffNo(e.target.value)}
          className="mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="block text-xs text-neutral-500">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="block text-xs text-neutral-500">
        Password
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        Sign up
      </button>
    </form>
  );
}
