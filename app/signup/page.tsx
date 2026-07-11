import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-lg font-semibold">Sign up</h1>
      <SignupForm />
      <p className="text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
