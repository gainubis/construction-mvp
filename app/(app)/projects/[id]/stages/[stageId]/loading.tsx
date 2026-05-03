import { LoadingState } from "@/components/state/loading-state";

export default function Loading() {
  return (
    <div className="space-y-6">
      <LoadingState lines={4} />
      <LoadingState lines={5} />
    </div>
  );
}

