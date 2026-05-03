import { LoadingState } from "@/components/state/loading-state";

export default function ReportsLoading() {
  return (
    <div className="space-y-4">
      <LoadingState lines={4} />
      <LoadingState lines={4} />
    </div>
  );
}
