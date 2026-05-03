import { LoadingState } from "@/components/state/loading-state";

export default function ReportDetailLoading() {
  return (
    <div className="space-y-4">
      <LoadingState lines={3} />
      <LoadingState lines={4} />
      <LoadingState lines={4} />
    </div>
  );
}
