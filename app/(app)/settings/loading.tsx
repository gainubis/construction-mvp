import { LoadingState } from "@/components/state/loading-state";

export default function Loading() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <LoadingState lines={6} />
      <LoadingState lines={6} />
    </div>
  );
}

