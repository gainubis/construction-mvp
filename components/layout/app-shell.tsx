"use client";

import { useState, type ReactNode } from "react";
import type { CurrentUser } from "@/lib/auth/types";
import type { NavigationItem } from "@/lib/auth/permissions";
import type { NotificationSummary } from "@/lib/projects/types";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { ToastProvider } from "@/components/ui/toast";

type AppShellProps = {
  children: ReactNode;
  currentUser: CurrentUser;
  navigationItems: NavigationItem[];
  notifications: NotificationSummary[];
  unreadNotificationCount: number;
};

export function AppShell({
  children,
  currentUser,
  navigationItems,
  notifications,
  unreadNotificationCount,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="relative flex min-h-screen">
          <div
            className={[
              "fixed inset-0 z-40 bg-slate-950/50 transition-opacity lg:hidden",
              mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
            ].join(" ")}
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />

          <div
            className={[
              "fixed inset-y-0 left-0 z-50 w-[18rem] transform transition-transform duration-200 ease-out lg:static lg:translate-x-0",
              mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            ].join(" ")}
          >
            <Sidebar
              onNavigate={() => setMobileNavOpen(false)}
              currentUser={currentUser}
              navigationItems={navigationItems}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <TopHeader
              onMenuClick={() => setMobileNavOpen(true)}
              currentUser={currentUser}
              notifications={notifications}
              unreadNotificationCount={unreadNotificationCount}
            />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
