import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

type PanelHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function PanelHeader({ children, className }: PanelHeaderProps) {
  return <div className={cn("border-b border-slate-100 p-5", className)}>{children}</div>;
}

export function PanelBody({ children, className }: PanelHeaderProps) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function PanelTitle({ children, className }: PanelHeaderProps) {
  return <h2 className={cn("text-base font-semibold text-slate-900", className)}>{children}</h2>;
}

