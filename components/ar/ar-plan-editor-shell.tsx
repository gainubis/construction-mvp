"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/components/state/loading-state";
import type { ARPlanDetail, ARPlanFormState, ARPlanSummary, StageRow } from "@/lib/projects/types";

const ARPlanEditor = dynamic(
  () => import("@/components/ar/ar-plan-editor").then((module) => module.ARPlanEditor),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <LoadingState lines={8} />
        <LoadingState lines={8} />
      </div>
    ),
  },
);

type ARPlanEditorShellProps = {
  projectId: string;
  projectName: string;
  stages: Array<Pick<StageRow, "id" | "name">>;
  plans: ARPlanSummary[];
  initialPlan: ARPlanDetail | null;
  action: (state: ARPlanFormState, formData: FormData) => Promise<ARPlanFormState>;
  creatingNew: boolean;
  editorKey: string;
};

export function ARPlanEditorShell({
  editorKey,
  ...props
}: ARPlanEditorShellProps) {
  return <ARPlanEditor key={editorKey} {...props} />;
}

