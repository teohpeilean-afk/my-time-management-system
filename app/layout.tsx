import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { EmployeeProvider } from "@/components/EmployeeContext";
import { EmployeeSwitcher } from "@/components/EmployeeSwitcher";
import type { Employee } from "@/lib/types";

export const metadata: Metadata = {
  title: "Time Management System",
  description: "Attendance, overtime and leave tracking for the team",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("active", true)
    .order("full_name");

  return (
    <html lang="en">
      <body className="antialiased bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <EmployeeProvider employees={(employees as Employee[]) ?? []}>
          <header className="border-b border-neutral-200 dark:border-neutral-800">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-6">
                <span className="font-semibold tracking-tight">TMS</span>
                <nav className="flex gap-4 text-sm text-neutral-600 dark:text-neutral-300">
                  <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">
                    Dashboard
                  </Link>
                  <Link href="/leave" className="hover:text-neutral-900 dark:hover:text-white">
                    Leave
                  </Link>
                  <Link href="/review" className="hover:text-neutral-900 dark:hover:text-white">
                    Review
                  </Link>
                  <Link href="/export" className="hover:text-neutral-900 dark:hover:text-white">
                    Export
                  </Link>
                </nav>
              </div>
              <EmployeeSwitcher />
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </EmployeeProvider>
      </body>
    </html>
  );
}
