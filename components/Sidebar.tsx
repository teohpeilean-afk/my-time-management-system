"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EmployeeSwitcher } from "@/components/EmployeeSwitcher";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/leave", label: "Leave" },
  { href: "/review", label: "Review" },
  { href: "/export", label: "Export" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col border-b border-neutral-200 sm:h-screen sm:w-56 sm:border-b-0 sm:border-r sm:sticky sm:top-0 dark:border-neutral-800">
      <div className="px-4 py-4">
        <span className="font-semibold tracking-tight">TMS</span>
      </div>
      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto px-2 pb-2 sm:flex-col sm:overflow-visible sm:pb-4">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <EmployeeSwitcher />
      </div>
    </aside>
  );
}
