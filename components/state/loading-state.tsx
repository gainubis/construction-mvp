type LoadingStateProps = {
  lines?: number;
};

const lineWidths = ["w-11/12", "w-10/12", "w-9/12", "w-8/12", "w-7/12", "w-6/12"];

export function LoadingState({ lines = 3 }: LoadingStateProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`h-4 animate-pulse rounded-full bg-slate-100 ${
              lineWidths[index % lineWidths.length]
            }`}
          />
        ))}
      </div>
    </div>
  );
}
