import Link from "next/link";

const FEATURES = [
  {
    title: "GPS-verified clock-in",
    body: "Punches are checked against approved factory locations automatically.",
  },
  {
    title: "EA 1955 hours, computed",
    body: "Normal, OT, rest-day and public-holiday minutes split correctly, every time.",
  },
  {
    title: "Payroll-ready export",
    body: "One click turns a month of attendance into an Excel file HR can use.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[42%] max-w-lg flex-col justify-between overflow-hidden bg-neutral-900 px-10 py-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent 70%)" }}
        />

        <Link href="/" className="relative flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-neutral-900">
            TMS
          </span>
          <span className="text-neutral-300">Time Management System</span>
        </Link>

        <div className="relative space-y-8">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Attendance, overtime and leave — sorted before payroll even asks.
          </h1>
          <ul className="space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10l4 4 8-8" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  <p className="mt-0.5 text-sm text-neutral-400">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-neutral-500">
          Malaysia Employment Act 1955 compliant hours &amp; overtime.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-neutral-50 px-6 py-12 dark:bg-neutral-950">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-900 lg:hidden dark:text-neutral-100"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
            TMS
          </span>
          Time Management System
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
