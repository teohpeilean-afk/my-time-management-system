import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-lg font-semibold">Log in</h1>
      <LoginForm />
      <p className="text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
