import type { ReactNode } from "react";

type FieldShellProps = {
  label: string;
  description?: string;
  error?: string | null;
  children: ReactNode;
  required?: boolean;
};

export function FieldShell({
  label,
  description,
  error,
  children,
  required,
}: FieldShellProps) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">
          {label}
          {required ? <span className="ml-1 text-rose-500">*</span> : null}
        </span>
      </div>
      {description ? <p className="text-xs leading-5 text-slate-500">{description}</p> : null}
      {children}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}

