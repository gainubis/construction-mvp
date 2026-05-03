import { LoadingState } from "@/components/state/loading-state";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center lg:grid-cols-2">
        <LoadingState lines={5} />
        <LoadingState lines={6} />
      </div>
    </div>
  );
}

