import { LoadingState } from "@/components/state/loading-state";

export default function Loading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      <div className="space-y-6">
        <LoadingState lines={4} />
        <LoadingState lines={6} />
      </div>
      <LoadingState lines={8} />
    </div>
  );
}

