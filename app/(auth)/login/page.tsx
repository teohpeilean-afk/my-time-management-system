import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Log in to your Time Management System account.</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100">
          Sign up
        </Link>
      </p>
      <p className="text-center text-xs text-neutral-400">
        <Link href="/" className="underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-300">
          Continue without an account
        </Link>
      </p>
    </div>
  );
}
