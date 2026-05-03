"use client";

import { useEffect, useRef } from "react";
import SignaturePad from "signature_pad";

type SignatureCanvasProps = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  description?: string;
};

export function SignatureCanvas({ value, onChange, label = "Подпись", description }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const savedSignatureRef = useRef<string | null>(value);

  useEffect(() => {
    savedSignatureRef.current = value;
    if (value && padRef.current && padRef.current.isEmpty()) {
      padRef.current.fromDataURL(value);
    }
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = canvas.parentElement?.clientWidth ?? canvas.clientWidth;

      canvas.width = width * ratio;
      canvas.height = 200 * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = "200px";
      const context = canvas.getContext("2d");
      if (context) {
        context.scale(ratio, ratio);
      }

      if (!padRef.current) {
        padRef.current = new SignaturePad(canvas, {
          penColor: "#0f172a",
          backgroundColor: "#ffffff",
        });

        const pad = padRef.current;
        pad.addEventListener("endStroke", () => {
          if (!pad.isEmpty()) {
            const dataUrl = pad.toDataURL("image/png");
            savedSignatureRef.current = dataUrl;
            onChange(dataUrl);
          }
        });
      } else if (savedSignatureRef.current) {
        padRef.current.fromDataURL(savedSignatureRef.current);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      padRef.current?.off();
      padRef.current = null;
    };
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <canvas ref={canvasRef} className="block h-[200px] w-full" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Поставьте подпись мышью, трекпадом или касанием.</p>
        <button
          type="button"
          onClick={() => {
            padRef.current?.clear();
            savedSignatureRef.current = null;
            onChange(null);
          }}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Очистить подпись
        </button>
      </div>
    </div>
  );
}
