"use client";

import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Layer, Stage, Text } from "react-konva";
import type { ARMarkerType } from "@/lib/projects/types";
import { getArMarkerColor, getArMarkerLabel } from "@/lib/ar/validation";

export type EditorMarker = {
  id: string;
  markerType: ARMarkerType;
  xPercent: number;
  yPercent: number;
  label: string;
  notes: string;
  sort_order: number;
};

type ARMarkerCanvasProps = {
  imageUrl: string | null;
  markers: EditorMarker[];
  activeTool: ARMarkerType | null;
  selectedMarkerId: string | null;
  zoomPercent: number;
  onCanvasClick: (position: { xPercent: number; yPercent: number }) => void;
  onMarkerMove: (markerId: string, position: { xPercent: number; yPercent: number }) => void;
  onMarkerSelect: (markerId: string) => void;
};

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setWidth(nextWidth);
    });

    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

function useLoadedImage(src: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      const timeoutId = window.setTimeout(() => setImage(null), 0);
      return () => window.clearTimeout(timeoutId);
    }

    const nextImage = new window.Image();
    nextImage.src = src;
    nextImage.onload = () => setImage(nextImage);
    nextImage.onerror = () => setImage(null);

    return () => {
      nextImage.onload = null;
      nextImage.onerror = null;
    };
  }, [src]);

  return image;
}

export function ARMarkerCanvas({
  imageUrl,
  markers,
  activeTool,
  selectedMarkerId,
  zoomPercent,
  onCanvasClick,
  onMarkerMove,
  onMarkerSelect,
}: ARMarkerCanvasProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const { ref: containerRef, width: containerWidth } = useElementWidth<HTMLDivElement>();
  const image = useLoadedImage(imageUrl);
  const aspectRatio = image ? image.naturalWidth / image.naturalHeight : 16 / 10;
  const baseWidth = Math.max(containerWidth || 0, 320);
  const stageWidth = Math.max(640, Math.round((baseWidth * zoomPercent) / 100));
  const stageHeight = Math.max(360, Math.round(stageWidth / aspectRatio));

  const stageMarkers = useMemo(
    () =>
      markers.map((marker) => ({
        ...marker,
        x: (marker.xPercent / 100) * stageWidth,
        y: (marker.yPercent / 100) * stageHeight,
      })),
    [markers, stageHeight, stageWidth],
  );

  function handleCanvasPlacement() {
    if (!activeTool) {
      return;
    }

    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) {
      return;
    }

    onCanvasClick({
      xPercent: (pointer.x / stageWidth) * 100,
      yPercent: (pointer.y / stageHeight) * 100,
    });
  }

  return (
    <div ref={containerRef} className="overflow-auto rounded-3xl border border-slate-200 bg-slate-950/5 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        <span>{activeTool ? `Инструмент: ${getArMarkerLabel(activeTool)}` : "Инструмент: режим выбора"}</span>
        <span>{imageUrl ? "Нажмите на полотно, чтобы поставить маркер" : "Загрузите фото стены, чтобы начать размещение маркеров"}</span>
      </div>

      <div className="overflow-hidden rounded-3xl bg-slate-100 shadow-inner">
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          onMouseDown={(event) => {
            if (event.target === event.target.getStage()) {
              handleCanvasPlacement();
            }
          }}
          onTouchStart={(event) => {
            if (event.target === event.target.getStage()) {
              handleCanvasPlacement();
            }
          }}
        >
          <Layer>
            {image ? (
              <KonvaImage image={image} width={stageWidth} height={stageHeight} listening={false} />
            ) : (
              <Group>
                <Text
                  x={24}
                  y={24}
                  width={stageWidth - 48}
                  text="Загрузите фото стены, чтобы начать AR-планирование."
                  fontSize={22}
                  fill="#475569"
                  align="center"
                />
              </Group>
            )}

            {stageMarkers.map((marker) => {
              const color = getArMarkerColor(marker.markerType);
              const isSelected = marker.id === selectedMarkerId;

              return (
                <Group
                  key={marker.id}
                  x={marker.x}
                  y={marker.y}
                  draggable
                  onClick={() => onMarkerSelect(marker.id)}
                  onTap={() => onMarkerSelect(marker.id)}
                  onDragEnd={(event) => {
                    const node = event.target;
                    onMarkerMove(marker.id, {
                      xPercent: (node.x() / stageWidth) * 100,
                      yPercent: (node.y() / stageHeight) * 100,
                    });
                  }}
                >
                  <Circle
                    radius={18}
                    fill={color}
                    stroke={isSelected ? "#0f172a" : "#ffffff"}
                    strokeWidth={isSelected ? 4 : 3}
                    shadowColor="rgba(15, 23, 42, 0.22)"
                    shadowBlur={10}
                    shadowOpacity={0.45}
                    shadowOffset={{ x: 0, y: 4 }}
                  />
                  <Circle radius={6} fill="#ffffff" opacity={0.95} />
                  <Text
                    x={-42}
                    y={24}
                    width={84}
                    text={marker.label || getArMarkerLabel(marker.markerType)}
                    fontSize={11}
                    fill="#0f172a"
                    align="center"
                    padding={4}
                    borderRadius={8}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
