import { LoadingState } from "@/components/state/loading-state";

export default function Loading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <LoadingState lines={6} />
      <LoadingState lines={6} />
    </div>
  );
}

