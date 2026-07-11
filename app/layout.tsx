import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { EmployeeProvider } from "@/components/EmployeeContext";
import { Sidebar } from "@/components/Sidebar";
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
          <div className="flex min-h-screen flex-col sm:flex-row">
            <Sidebar />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
          </div>
        </EmployeeProvider>
      </body>
    </html>
  );
}
