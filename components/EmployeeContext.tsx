"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Employee } from "@/lib/types";

const STORAGE_KEY = "tms-active-employee-id";

interface EmployeeContextValue {
  employees: Employee[];
  activeEmployeeId: string | null;
  activeEmployee: Employee | null;
  setActiveEmployeeId: (id: string) => void;
}

const EmployeeContext = createContext<EmployeeContextValue | null>(null);

export function EmployeeProvider({
  employees,
  children,
}: {
  employees: Employee[];
  children: React.ReactNode;
}) {
  const [activeEmployeeId, setActiveEmployeeIdState] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && employees.some((e) => e.id === stored)) {
      setActiveEmployeeIdState(stored);
    } else if (employees.length > 0) {
      setActiveEmployeeIdState(employees[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setActiveEmployeeId(id: string) {
    setActiveEmployeeIdState(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }

  const activeEmployee = employees.find((e) => e.id === activeEmployeeId) ?? null;

  return (
    <EmployeeContext.Provider
      value={{ employees, activeEmployeeId, activeEmployee, setActiveEmployeeId }}
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
