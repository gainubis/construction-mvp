import type { ARMarkerType } from "@/lib/projects/types";

export const arMarkerTypeOptions: Array<{
  value: ARMarkerType;
  label: string;
  description: string;
  accent: string;
  color: string;
}> = [
  {
    value: "socket",
    label: "Socket",
    description: "Outlet point on the wall",
    accent: "bg-blue-500",
    color: "#3b82f6",
  },
  {
    value: "pipe",
    label: "Pipe",
    description: "Visible or planned pipe run",
    accent: "bg-emerald-500",
    color: "#10b981",
  },
  {
    value: "switch",
    label: "Switch",
    description: "Light or control switch",
    accent: "bg-amber-500",
    color: "#f59e0b",
  },
  {
    value: "light",
    label: "Light point",
    description: "Ceiling or wall light point",
    accent: "bg-violet-500",
    color: "#8b5cf6",
  },
];

export function isArMarkerType(value: string): value is ARMarkerType {
  return arMarkerTypeOptions.some((option) => option.value === value);
}

export function getArMarkerLabel(value: ARMarkerType | string) {
  return arMarkerTypeOptions.find((option) => option.value === value)?.label ?? value;
}

export function getArMarkerAccent(value: ARMarkerType | string) {
  return arMarkerTypeOptions.find((option) => option.value === value)?.accent ?? "bg-slate-500";
}

export function getArMarkerColor(value: ARMarkerType | string) {
  return arMarkerTypeOptions.find((option) => option.value === value)?.color ?? "#64748b";
}
