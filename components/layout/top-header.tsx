"use client";

import type { CurrentUser } from "@/lib/auth/types";
import type { NotificationSummary } from "@/lib/projects/types";
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown";
import { UserMenu } from "@/components/layout/user-menu";

type TopHeaderProps = {
  onMenuClick: () => void;
  currentUser: CurrentUser;
  notifications: NotificationSummary[];
  unreadNotificationCount: number;
};

export function TopHeader({
  onMenuClick,
  currentUser,
  notifications,
  unreadNotificationCount,
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
          aria-label="Открыть навигацию"
        >
          <span className="flex flex-col gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-current" />
            <span className="h-0.5 w-4 rounded-full bg-current" />
            <span className="h-0.5 w-4 rounded-full bg-current" />
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Готово для демо
            </span>
            <p className="hidden text-sm text-slate-500 sm:block">
              Рабочее пространство для управления строительством
            </p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {currentUser.role}
            </span>
          </div>
        </div>

        <div className="hidden max-w-md flex-1 lg:block">
          <label className="relative block">
            <span className="sr-only">Поиск</span>
            <input
              type="search"
              placeholder="Поиск проектов, этапов, отчетов..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
            />
          </label>
        </div>

        <NotificationsDropdown
          notifications={notifications}
          unreadCount={unreadNotificationCount}
        />
        <UserMenu currentUser={currentUser} />
      </div>
    </header>
  );
}
