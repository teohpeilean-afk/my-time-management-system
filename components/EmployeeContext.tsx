"use client";

import { createContext, useContext } from "react";
import type { Employee } from "@/lib/types";

interface EmployeeContextValue {
  activeEmployee: Employee | null;
  activeEmployeeId: string | null;
}

const EmployeeContext = createContext<EmployeeContextValue | null>(null);

export function EmployeeProvider({
  employee,
  children,
}: {
  employee: Employee | null;
  children: React.ReactNode;
}) {
  return (
    <EmployeeContext.Provider
      value={{ activeEmployee: employee, activeEmployeeId: employee?.id ?? null }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export function useActiveEmployee() {
  const ctx = useContext(EmployeeContext);
  if (!ctx) {
    throw new Error("useActiveEmployee must be used within EmployeeProvider");
  }
  return ctx;
}
