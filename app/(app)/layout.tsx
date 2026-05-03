import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getNavigationItemsForRole } from "@/lib/auth/permissions";
import { requireCurrentUser } from "@/lib/auth/session";
import { getNotificationsForUser, getUnreadNotificationCount } from "@/lib/notifications/queries";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireCurrentUser();

  if (!session) {
    redirect("/login");
  }

  const navigationItems = getNavigationItemsForRole(session.currentUser.role);
  const [notifications, unreadNotificationCount] = await Promise.all([
    getNotificationsForUser(session.currentUser.id),
    getUnreadNotificationCount(session.currentUser.id),
  ]);

  return (
    <AppShell
      currentUser={session.currentUser}
      navigationItems={navigationItems}
      notifications={notifications}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AppShell>
  );
}
