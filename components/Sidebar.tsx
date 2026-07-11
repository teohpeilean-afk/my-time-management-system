"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EmployeeSwitcher } from "@/components/EmployeeSwitcher";
import { AuthStatus } from "@/components/AuthStatus";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/leave", label: "Leave" },
  { href: "/review", label: "Review" },
  { href: "/export", label: "Export" },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-md px-3 py-3 text-sm font-medium transition-colors ${
              active
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar({ authEmail }: { authEmail: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:hidden dark:border-neutral-800">
        <span className="font-semibold tracking-tight">TMS</span>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-neutral-700 active:bg-neutral-100 dark:text-neutral-300 dark:active:bg-neutral-900"
        >
          {open ? (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="border-b border-neutral-200 px-3 pb-4 sm:hidden dark:border-neutral-800">
          <nav className="flex flex-col gap-1 pt-2">
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </nav>
          <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <EmployeeSwitcher />
          </div>
          <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <AuthStatus email={authEmail} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 flex-col border-r border-neutral-200 sm:sticky sm:top-0 sm:flex sm:h-screen sm:w-56 dark:border-neutral-800">
        <div className="px-4 py-4">
          <span className="font-semibold tracking-tight">TMS</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2 pb-4">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <EmployeeSwitcher />
        </div>
        <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <AuthStatus email={authEmail} />
        </div>
      </aside>
    </>
  );
}
