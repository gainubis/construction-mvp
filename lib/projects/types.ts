import type { Database } from "@/lib/supabase/database.types";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProjectMemberRow = Database["public"]["Tables"]["project_members"]["Row"];
export type StageRow = Database["public"]["Tables"]["stages"]["Row"];
export type ChecklistRow = Database["public"]["Tables"]["checklists"]["Row"];
export type ChecklistItemRow = Database["public"]["Tables"]["checklist_items"]["Row"];
export type StageReportRow = Database["public"]["Tables"]["stage_reports"]["Row"];
export type ARPlanRow = Database["public"]["Tables"]["ar_plans"]["Row"];
export type ARMarkerRow = Database["public"]["Tables"]["ar_markers"]["Row"];
export type SafetyViolationRow = Database["public"]["Tables"]["safety_violations"]["Row"];
export type SafetyViolationPhotoRow = Database["public"]["Tables"]["safety_violation_photos"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type ActRow = Database["public"]["Tables"]["acts"]["Row"];
export type InspectionItemResultRow = Database["public"]["Tables"]["inspection_item_results"]["Row"];
export type ReportPhotoRow = Database["public"]["Tables"]["report_photos"]["Row"];

export type ProfileSummary = Pick<
  ProfileRow,
  "id" | "full_name" | "email" | "avatar_url" | "role"
>;

export type ProjectObjectType =
  Database["public"]["Enums"]["project_object_type"];
export type ProjectStatus = Database["public"]["Enums"]["project_status"];
export type StageStatus = Database["public"]["Enums"]["stage_status"];

export type ProjectSummary = {
  id: string;
  code: string;
  name: string;
  clientName: string;
  objectType: ProjectObjectType;
  location: string;
  status: ProjectStatus;
  progressPercent: number;
  floorPlanUrl: string | null;
  floorPlanPath: string | null;
  startDate: string | null;
  targetEndDate: string | null;
  memberCount: number;
  stageCount: number;
};

export type ProjectMemberWithProfile = ProjectMemberRow & {
  profile: ProfileSummary | null;
};

export type StageChecklistItem = ChecklistItemRow;

export type StageChecklist = ChecklistRow & {
  items: StageChecklistItem[];
};

export type ProjectStageSummary = StageRow & {
  responsible_profile: ProfileSummary | null;
  checklist: Pick<ChecklistRow, "id" | "name"> | null;
};

export type ProjectDetail = ProjectRow & {
  members: ProjectMemberWithProfile[];
  stages: ProjectStageSummary[];
};

export type ProjectAssigneeOption = Pick<
  ProfileRow,
  "id" | "full_name" | "email" | "role" | "avatar_url"
>;

export type StageAssigneeOption = ProjectAssigneeOption;

export type StageReportSummary = StageReportRow & {
  reported_by_profile: ProfileSummary | null;
  photo_count: number;
};

export type ProjectReportSummary = StageReportSummary & {
  stage: Pick<StageRow, "id" | "project_id" | "name" | "sequence" | "status"> | null;
};

export type InspectionChecklistResult = InspectionItemResultRow & {
  checklist_item: Pick<
    ChecklistItemRow,
    "id" | "title" | "description" | "item_type" | "sort_order" | "is_required"
  > | null;
};

export type StageReportDetail = StageReportSummary & {
  stage: Pick<
    StageRow,
    "id" | "project_id" | "name" | "sequence" | "status" | "progress_percent" | "planned_end_date"
  > | null;
  project: Pick<ProjectRow, "id" | "code" | "name" | "location" | "status" | "object_type"> | null;
  checklist: Pick<ChecklistRow, "id" | "name" | "description"> | null;
  photos: ReportPhotoRow[];
  inspection_results: InspectionChecklistResult[];
};

export type InspectionResultValue =
  Database["public"]["Enums"]["inspection_result"];
export type ARMarkerType = Database["public"]["Enums"]["marker_type"];
export type SafetySeverity = Database["public"]["Enums"]["severity_level"];
export type SafetyStatus = Database["public"]["Enums"]["violation_status"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];
export type SafetyViolationType =
  | "no_helmet"
  | "no_gloves"
  | "unsafe_zone"
  | "improper_tool_storage"
  | "blocked_passage";

export type SafetyViolationSummary = SafetyViolationRow & {
  reported_by_profile: ProfileSummary | null;
  assigned_to_profile: ProfileSummary | null;
  stage: Pick<StageRow, "id" | "name" | "sequence"> | null;
  photos_count: number;
};

export type SafetyViolationPhoto = SafetyViolationPhotoRow;

export type SafetyViolationDetail = SafetyViolationSummary & {
  project: Pick<ProjectRow, "id" | "code" | "name" | "location" | "status" | "object_type">;
  photos: SafetyViolationPhoto[];
};

export type NotificationSummary = NotificationRow & {
  project: Pick<ProjectRow, "id" | "name" | "code"> | null;
  stage: Pick<StageRow, "id" | "name"> | null;
  violation: Pick<SafetyViolationRow, "id" | "title" | "violation_type" | "severity"> | null;
};

export type ActSummary = ActRow & {
  project: Pick<ProjectRow, "id" | "code" | "name"> | null;
  stage: Pick<StageRow, "id" | "name" | "sequence"> | null;
  prepared_by_profile: ProfileSummary | null;
  signed_by_profile: ProfileSummary | null;
  pdf_url: string | null;
};

export type ActDetail = ActSummary & {
  project: Pick<ProjectRow, "id" | "code" | "name" | "location" | "status" | "object_type"> | null;
};

export type ARPlanSummary = ARPlanRow & {
  stage: Pick<StageRow, "id" | "name" | "sequence"> | null;
  uploaded_by_profile: ProfileSummary | null;
  marker_count: number;
  wall_photo_url: string | null;
};

export type ARMarkerSummary = ARMarkerRow;

export type ARPlanDetail = ARPlanSummary & {
  markers: ARMarkerSummary[];
};

export type StageDetail = StageRow & {
  project: Pick<ProjectRow, "id" | "code" | "name" | "location" | "status" | "object_type">;
  responsible_profile: ProfileSummary | null;
  checklist: StageChecklist | null;
  reports: StageReportSummary[];
  safety_violations: SafetyViolationSummary[];
  acts: ActSummary[];
};

export type ProjectFormField = "name" | "address" | "objectType" | "startDate" | "endDate" | "responsibleUsers" | "floorPlan";

export type ProjectFormState = {
  error: string | null;
  fieldErrors: Partial<Record<ProjectFormField, string>>;
};

export type StageFormField =
  | "name"
  | "description"
  | "sequence"
  | "deadline"
  | "responsibleProfileId"
  | "status";

export type StageFormState = {
  error: string | null;
  fieldErrors: Partial<Record<StageFormField, string>>;
};

export type InspectionFormField = "photos" | "inspectorComments";

export type InspectionFormState = {
  error: string | null;
  fieldErrors: Partial<Record<InspectionFormField, string>>;
  itemErrors: Record<string, string>;
  aiWarning?: string | null;
};

export type ARPlanFormField = "title" | "stageId" | "notes" | "wallPhoto" | "markersJson";

export type ARPlanFormState = {
  error: string | null;
  fieldErrors: Partial<Record<ARPlanFormField, string>>;
};

export type ActCompletionFormField = "comments" | "signatureDataUrl";

export type ActCompletionFormState = {
  error: string | null;
  fieldErrors: Partial<Record<ActCompletionFormField, string>>;
};

export type SafetyFormField =
  | "title"
  | "violationType"
  | "severity"
  | "status"
  | "assignedTo"
  | "stageId"
  | "details"
  | "locationNote"
  | "photos";

export type SafetyFormState = {
  error: string | null;
  fieldErrors: Partial<Record<SafetyFormField, string>>;
};

export type ChecklistFormField = "name" | "description";

export type ChecklistFormState = {
  error: string | null;
  fieldErrors: Partial<Record<ChecklistFormField, string>>;
};

export type ChecklistItemFormField = "title" | "description" | "itemType" | "expectedValue";

export type ChecklistItemFormState = {
  error: string | null;
  fieldErrors: Partial<Record<ChecklistItemFormField, string>>;
};
