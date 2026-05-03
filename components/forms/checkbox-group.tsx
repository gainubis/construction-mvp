import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CheckboxGroupProps = {
  children: ReactNode;
  className?: string;
};

export function CheckboxGroup({ children, className }: CheckboxGroupProps) {
  return <div className={cn("grid gap-3 sm:grid-cols-2", className)}>{children}</div>;
}

