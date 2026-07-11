import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Have a staff number already? Enter it to link your existing record.
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100">
          Log in
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
