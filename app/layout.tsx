import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Time Management System",
  description: "Attendance, overtime and leave tracking for the team",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  );
}
