"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import type { ARPlanDetail, ARPlanFormState, ARPlanSummary, ARMarkerType, StageRow } from "@/lib/projects/types";
import { FieldShell } from "@/components/forms/field-shell";
import { FileInput, SelectInput, TextInput, TextareaInput } from "@/components/forms/inputs";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { ARMarkerCanvas, type EditorMarker } from "@/components/ar/ar-marker-canvas";
import { ARMarkerList } from "@/components/ar/ar-marker-list";
import { arMarkerTypeOptions, getArMarkerLabel } from "@/lib/ar/validation";

type ARPlanEditorProps = {
  projectId: string;
  projectName: string;
  stages: Array<Pick<StageRow, "id" | "name">>;
  plans: ARPlanSummary[];
  initialPlan: ARPlanDetail | null;
  action: (state: ARPlanFormState, formData: FormData) => Promise<ARPlanFormState>;
  creatingNew: boolean;
};

const initialState: ARPlanFormState = {
  error: null,
  fieldErrors: {},
};

function normalizeMarkers(markers: EditorMarker[]) {
  return markers.map((marker, index) => ({
    ...marker,
    sort_order: index + 1,
  }));
}

function buildDefaultTitle(projectName: string, planCount: number) {
  return `${projectName} план стены ${planCount + 1}`;
}

export function ARPlanEditor({
  projectId,
  projectName,
  stages,
  plans,
  initialPlan,
  action,
  creatingNew,
}: ARPlanEditorProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [title, setTitle] = useState(initialPlan?.title ?? buildDefaultTitle(projectName, plans.length));
  const [notes, setNotes] = useState(initialPlan?.notes ?? "");
  const [stageId, setStageId] = useState(initialPlan?.stage_id ?? stages[0]?.id ?? "");
  const [markers, setMarkers] = useState<EditorMarker[]>(
    (initialPlan?.markers ?? []).map((marker) => ({
      id: marker.id,
      markerType: marker.marker_type,
      xPercent: marker.x_percent,
      yPercent: marker.y_percent,
      label: marker.label ?? "",
      notes: marker.notes ?? "",
      sort_order: marker.sort_order,
    })),
  );
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(initialPlan?.markers[0]?.id ?? null);
  const [activeTool, setActiveTool] = useState<ARMarkerType | null>("socket");
  const [zoomPercent, setZoomPercent] = useState(100);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPlan?.wall_photo_url ?? null);

  const selectedMarker = useMemo(
    () => markers.find((marker) => marker.id === selectedMarkerId) ?? null,
    [markers, selectedMarkerId],
  );

  const markerCountByType = useMemo(
    () =>
      markers.reduce<Record<string, number>>((acc, marker) => {
        acc[marker.markerType] = (acc[marker.markerType] ?? 0) + 1;
        return acc;
      }, {}),
    [markers],
  );

  const selectedMarkerIndex = selectedMarker ? markers.findIndex((marker) => marker.id === selectedMarker.id) : -1;

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <input type="hidden" name="projectId" value={projectId} />
      {initialPlan ? <input type="hidden" name="planId" value={initialPlan.id} /> : null}
      <input
        type="hidden"
        name="markersJson"
        value={JSON.stringify(markers.map((marker, index) => ({ ...marker, sort_order: index + 1 })))}
      />

      <div className="space-y-6">
        <Panel>
          <PanelHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PanelTitle>{initialPlan ? "Редактирование плана стены" : "Создание плана стены"}</PanelTitle>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomPercent((value) => Math.max(80, value - 10))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Масштаб -
                </button>
                <button
                  type="button"
                  onClick={() => setZoomPercent((value) => Math.min(150, value + 10))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Масштаб +
                </button>
              </div>
            </div>
          </PanelHeader>
          <PanelBody className="space-y-5">
            {state.error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {state.error}
              </div>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-2">
              <FieldShell label="Название плана" description="Используйте понятное название для архива и передачи команде." error={state.fieldErrors.title} required>
                <TextInput
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={buildDefaultTitle(projectName, plans.length)}
                />
              </FieldShell>

              <FieldShell label="Связанный этап" description="Необязательный контекст этапа для разметки стены." error={state.fieldErrors.stageId}>
                <SelectInput name="stageId" value={stageId} onChange={(event) => setStageId(event.target.value)}>
                  <option value="">Без привязки к этапу</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </SelectInput>
              </FieldShell>
            </div>

            <FieldShell label="Примечания" description="Зафиксируйте допущения, маршруты или координационные заметки." error={state.fieldErrors.notes}>
              <TextareaInput
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Отметьте позиции розеток по периметру офиса и не заходите в зону открытия двери."
              />
            </FieldShell>

              <FieldShell
              label="Фото стены"
              description="Загрузите фото стены, которое будет использоваться как фон для планирования."
              error={state.fieldErrors.wallPhoto}
              required={!initialPlan}
            >
              <FileInput
                name="wallPhoto"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFileName(file?.name ?? null);

                  setPreviewUrl((current) => {
                    if (current?.startsWith("blob:")) {
                      URL.revokeObjectURL(current);
                    }

                    if (!file) {
                      return initialPlan?.wall_photo_url ?? null;
                    }

                    return URL.createObjectURL(file);
                  });
                }}
              />
            </FieldShell>

            {selectedFileName ? (
              <p className="text-xs text-slate-500">Выбранный файл: {selectedFileName}</p>
            ) : null}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PanelTitle>Интерактивное полотно</PanelTitle>
              <div className="text-xs text-slate-500">
                Размещено: {markers.length} маркер{markers.length === 1 ? "" : "ов"}
              </div>
            </div>
          </PanelHeader>
          <PanelBody>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  activeTool === null ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Выбор
              </button>
              {arMarkerTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActiveTool(option.value)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    activeTool === option.value ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <ARMarkerCanvas
              imageUrl={previewUrl}
              markers={markers}
              activeTool={activeTool}
              selectedMarkerId={selectedMarkerId}
              zoomPercent={zoomPercent}
              onCanvasClick={({ xPercent, yPercent }) => {
                if (!activeTool) {
                  return;
                }

                const nextCount = (markerCountByType[activeTool] ?? 0) + 1;
                const nextMarker: EditorMarker = {
                  id: crypto.randomUUID(),
                  markerType: activeTool,
                  xPercent,
                  yPercent,
                  label: `${getArMarkerLabel(activeTool)} ${nextCount}`,
                  notes: "",
                  sort_order: markers.length + 1,
                };

                const nextMarkers = normalizeMarkers([...markers, nextMarker]);
                setMarkers(nextMarkers);
                setSelectedMarkerId(nextMarker.id);
              }}
              onMarkerMove={(markerId, position) => {
                setMarkers((current) =>
                  normalizeMarkers(
                    current.map((marker) =>
                      marker.id === markerId
                        ? {
                            ...marker,
                            xPercent: Math.max(0, Math.min(100, position.xPercent)),
                            yPercent: Math.max(0, Math.min(100, position.yPercent)),
                          }
                        : marker,
                    ),
                  ),
                );
              }}
              onMarkerSelect={setSelectedMarkerId}
            />
          </PanelBody>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel>
          <PanelHeader>
            <PanelTitle>Параметры маркера</PanelTitle>
          </PanelHeader>
          <PanelBody className="space-y-4">
            {selectedMarker ? (
              <>
                <FieldShell label="Метка">
                  <TextInput
                    value={selectedMarker.label}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setMarkers((current) =>
                        normalizeMarkers(
                          current.map((marker) =>
                            marker.id === selectedMarker.id ? { ...marker, label: nextValue } : marker,
                          ),
                        ),
                      );
                    }}
                    placeholder={getArMarkerLabel(selectedMarker.markerType)}
                  />
                </FieldShell>

                <FieldShell label="Примечания">
                  <TextareaInput
                    value={selectedMarker.notes}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setMarkers((current) =>
                        normalizeMarkers(
                          current.map((marker) =>
                            marker.id === selectedMarker.id ? { ...marker, notes: nextValue } : marker,
                          ),
                        ),
                      );
                    }}
                    placeholder="Необязательная заметка по полю или напоминание по координации"
                  />
                </FieldShell>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="block font-semibold uppercase tracking-wide">Тип</span>
                    <span className="mt-1 block text-sm text-slate-700">{selectedMarker.markerType}</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="block font-semibold uppercase tracking-wide">Порядок</span>
                    <span className="mt-1 block text-sm text-slate-700">#{selectedMarkerIndex + 1}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Выберите маркер на полотне или в списке, чтобы изменить его метку и примечания.
              </p>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Размещенные маркеры</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <ARMarkerList
              markers={markers}
              selectedMarkerId={selectedMarkerId}
              onSelectMarker={setSelectedMarkerId}
              onDeleteMarker={(markerId) => {
                setMarkers((current) => normalizeMarkers(current.filter((marker) => marker.id !== markerId)));
                setSelectedMarkerId((current) => (current === markerId ? null : current));
              }}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Легенда маркеров</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <div className="grid gap-3">
              {arMarkerTypeOptions.map((option) => (
                <div key={option.value} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{option.label}</p>
                    <p className="text-xs text-slate-500">{option.description}</p>
                  </div>
                  <span className={`h-3 w-3 rounded-full ${option.accent}`} />
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Сохраненные планы стены</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <div className="space-y-3">
              {plans.length > 0 ? (
                plans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/projects/${projectId}/ar?plan=${plan.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{plan.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {plan.stage?.name ?? "Без этапа"} - {plan.marker_count} маркер{plan.marker_count === 1 ? "" : "ов"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Открыть
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Сохраненные планы будут отображаться здесь, чтобы команда могла снова открыть и обновить предыдущие схемы.
                </p>
              )}
            </div>
          </PanelBody>
        </Panel>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/projects/${projectId}/ar${creatingNew ? "" : "?new=1"}`}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {creatingNew ? "Вернуться к текущему плану" : "Начать новый план"}
          </Link>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Сохранение плана стены..." : initialPlan ? "Сохранить изменения" : "Создать план стены"}
          </button>
        </div>
      </div>
    </form>
  );
}
