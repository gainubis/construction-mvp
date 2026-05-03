"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";

type RouteToastProps = {
  title: string;
  description?: string;
  tone?: "success" | "error" | "info";
  enabled?: boolean;
};

export function RouteToast({ title, description, tone = "success", enabled = true }: RouteToastProps) {
  const toast = useToast();

  useEffect(() => {
    if (enabled) {
      toast({ title, description, tone });
    }
  }, [description, enabled, title, tone, toast]);

  return null;
}
