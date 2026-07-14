import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 py-12 dark:bg-neutral-950">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white">
          TMS
        </span>
        Time Management System
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
