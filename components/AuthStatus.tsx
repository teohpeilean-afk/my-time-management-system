"use client";

import { useTransition } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

export function AuthStatus({ email }: { email: string | null }) {
  const [pending, startTransition] = useTransition();

  if (!email) {
    return (
      <Link
        href="/login"
        className="block rounded-md px-2 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <p className="truncate text-xs text-neutral-500" title={email}>
        {email}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => signOutAction())}
        className="w-full rounded-md border border-neutral-300 px-2 py-1 text-left text-sm text-neutral-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300"
      >
        Sign out
      </button>
    </div>
  );
}
