"use client";

import { signOut } from "@/lib/auth/actions";
import type { CurrentUser } from "@/lib/auth/types";

type UserMenuProps = {
  currentUser: CurrentUser;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ currentUser }: UserMenuProps) {
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-semibold text-white">
          {getInitials(currentUser.fullName)}
        </div>
        <div className="hidden min-w-0 text-left sm:block">
          <div className="truncate text-sm font-semibold text-slate-900">
            {currentUser.fullName}
          </div>
          <div className="text-xs text-slate-500 capitalize">{currentUser.role}</div>
        </div>
      </summary>

      <div className="absolute right-0 z-40 mt-3 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">{currentUser.fullName}</div>
          <div className="mt-1 text-sm text-slate-600">{currentUser.email}</div>
          <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {currentUser.role}
          </div>
        </div>

        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Выйти
          </button>
        </form>
      </div>
    </details>
  );
}
