import { createClient } from "@/lib/supabase/server";
import { EmployeeProvider } from "@/components/EmployeeContext";
import { Sidebar } from "@/components/Sidebar";
import type { Employee } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const [{ data: employees }, { data: { user } }] = await Promise.all([
    supabase.from("employees").select("*").eq("active", true).order("full_name"),
    supabase.auth.getUser(),
  ]);

  return (
    <EmployeeProvider employees={(employees as Employee[]) ?? []}>
      <div className="flex min-h-screen flex-col sm:flex-row">
        <Sidebar authEmail={user?.email ?? null} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </div>
    </EmployeeProvider>
  );
}
