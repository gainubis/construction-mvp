import { LoadingState } from "@/components/state/loading-state";

export default function Loading() {
  return (
    <div className="space-y-6">
      <LoadingState lines={4} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <LoadingState lines={6} />
        <div className="space-y-6">
          <LoadingState lines={4} />
          <LoadingState lines={4} />
        </div>
      </div>
    </div>
  );
}

