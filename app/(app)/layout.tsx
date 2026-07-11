import { EmployeeProvider } from "@/components/EmployeeContext";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authEmail, employee } = await getCurrentSession();

  return (
    <EmployeeProvider employee={employee}>
      <div className="flex min-h-screen flex-col sm:flex-row">
        <Sidebar authEmail={authEmail} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {employee ? (
            children
          ) : (
            <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
              Setting up your account…
            </p>
          )}
        </main>
      </div>
    </EmployeeProvider>
  );
}
