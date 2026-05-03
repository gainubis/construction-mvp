"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CurrentUser } from "@/lib/auth/types";
import type { NavigationItem } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

type SidebarProps = {
  onNavigate?: () => void;
  currentUser: CurrentUser;
  navigationItems: NavigationItem[];
};

export function Sidebar({ onNavigate, currentUser, navigationItems }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-slate-950 px-4 py-5 text-slate-100">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-sm font-bold text-slate-950">
          C
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-white">ConstructFlow</p>
          <p className="text-xs text-slate-400">SaaS MVP для строительства</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center justify-between rounded-2xl px-3 py-3 text-sm transition",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="mt-0.5 text-xs text-slate-400 group-hover:text-slate-300">
                  {item.description}
                </div>
              </div>
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full border",
                  isActive ? "border-emerald-300 bg-emerald-400" : "border-slate-600 bg-transparent",
                )}
              />
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-white">{currentUser.fullName}</p>
            <p className="mt-1 capitalize text-slate-400">Роль: {currentUser.role}</p>
          </div>
          <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            Активен
          </div>
        </div>
        <p className="mt-4 leading-6">
          Ролевая модель доступа, AI-отчеты и управление этапами уже подготовлены для MVP.
        </p>
      </div>
    </aside>
  );
}
