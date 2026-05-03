"use client";

import type { EditorMarker } from "@/components/ar/ar-marker-canvas";
import { getArMarkerAccent, getArMarkerLabel } from "@/lib/ar/validation";
import { cn } from "@/lib/utils";

type ARMarkerListProps = {
  markers: EditorMarker[];
  selectedMarkerId: string | null;
  onSelectMarker: (markerId: string) => void;
  onDeleteMarker: (markerId: string) => void;
};

export function ARMarkerList({
  markers,
  selectedMarkerId,
  onSelectMarker,
  onDeleteMarker,
}: ARMarkerListProps) {
  return (
    <div className="space-y-3">
      {markers.length > 0 ? (
        markers.map((marker) => {
          const isSelected = marker.id === selectedMarkerId;

          return (
            <div
              key={marker.id}
              className={cn(
                "rounded-2xl border p-4 transition",
                isSelected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => onSelectMarker(marker.id)} className="text-left">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", getArMarkerAccent(marker.markerType))} />
                    <p className="text-sm font-semibold text-slate-950">
                      {marker.label || getArMarkerLabel(marker.markerType)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    {marker.markerType} #{marker.sort_order}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    x {marker.xPercent.toFixed(1)}% y {marker.yPercent.toFixed(1)}%
                  </p>
                  {marker.notes ? <p className="mt-2 text-sm text-slate-600">{marker.notes}</p> : null}
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteMarker(marker.id)}
                  className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Удалить
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          Маркеры еще не размещены. Выберите тип маркера и нажмите на полотно, чтобы добавить его.
        </div>
      )}
    </div>
  );
}
