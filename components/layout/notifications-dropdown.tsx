"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { NotificationSummary } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type NotificationsDropdownProps = {
  notifications: NotificationSummary[];
  unreadCount: number;
};

function getNotificationHref(notification: NotificationSummary) {
  if (notification.violation && notification.project) {
    return `/projects/${notification.project.id}/safety/${notification.violation.id}`;
  }

  if (notification.stage && notification.project) {
    return `/projects/${notification.project.id}/stages/${notification.stage.id}`;
  }

  if (notification.project) {
    return `/projects/${notification.project.id}`;
  }

  return "/dashboard";
}

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Неизвестно";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

async function markNotificationRead(id: string) {
  const response = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
  if (!response.ok) {
    throw new Error("Could not mark notification as read.");
  }
}

async function markAllRead() {
  const response = await fetch("/api/notifications/read-all", { method: "POST" });
  if (!response.ok) {
    throw new Error("Could not mark notifications as read.");
  }
}

export function NotificationsDropdown({ notifications, unreadCount }: NotificationsDropdownProps) {
  const router = useRouter();
  const toast = useToast();
  const [isBulkPending, startBulkTransition] = useTransition();

  const hasUnread = unreadCount > 0;

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer">
        <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50">
          <span className="text-sm font-semibold">N</span>
          {hasUnread ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </span>
      </summary>

      <div className="absolute right-0 z-40 mt-3 w-[22rem] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Уведомления</p>
            <p className="text-xs text-slate-500">
              {hasUnread ? `${unreadCount} непрочитанных уведомлени${unreadCount === 1 ? "е" : "й"}` : "Новых уведомлений нет"}
            </p>
          </div>
          {hasUnread ? (
            <button
              type="button"
              onClick={() => {
                startBulkTransition(async () => {
                  await markAllRead();
                  toast({
                    title: "Notifications marked as read",
                    description: "Входящие уведомления очищены.",
                    tone: "success",
                  });
                  router.refresh();
                });
              }}
              disabled={isBulkPending}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Отметить все прочитанными
            </button>
          ) : null}
        </div>

        <div className="max-h-[28rem] overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => {
                const href = getNotificationHref(notification);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex gap-3 px-4 py-4 transition",
                      notification.is_read ? "bg-white" : "bg-amber-50/40",
                    )}
                  >
                    <Link
                      href={href}
                      onClick={() => {
                        void markNotificationRead(notification.id)
                          .then(() => {
                            toast({
                              title: "Уведомление открыто",
                              description: notification.title,
                              tone: "info",
                            });
                            router.refresh();
                          })
                          .catch(() => {
                            toast({
                              title: "Не удалось обновить уведомление",
                              description: "Попробуйте еще раз.",
                              tone: "error",
                            });
                          });
                      }}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{notification.title}</p>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{notification.body}</p>
                        </div>
                        {notification.is_read ? (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Прочитано
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                            Новое
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {notification.project ? <span>{notification.project.code}</span> : null}
                        {notification.stage ? <span>| {notification.stage.name}</span> : null}
                        <span>| {formatRelativeTime(notification.created_at)}</span>
                      </div>
                    </Link>

                    {!notification.is_read ? (
                      <button
                      type="button"
                      onClick={() => {
                        void markNotificationRead(notification.id)
                          .then(() => {
                            toast({
                              title: "Notification marked as read",
                              description: notification.title,
                              tone: "success",
                            });
                            router.refresh();
                          })
                          .catch(() => {
                            toast({
                              title: "Could not update notification",
                              description: "Please try again.",
                              tone: "error",
                            });
                          });
                      }}
                      className="mt-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                        Отметить
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Пока нет уведомлений.
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
