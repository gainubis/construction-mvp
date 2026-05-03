export type ProjectRecord = {
  id: string;
  name: string;
  location: string;
  client: string;
  status: "On track" | "At risk" | "Needs review";
  progress: number;
  progressClass: string;
  stageCount: number;
  activeTeam: number;
  floorPlan: string;
};

export type StageRecord = {
  id: string;
  name: string;
  status: "Planned" | "In progress" | "Review" | "Complete";
  deadline: string;
  progress: number;
  progressClass: string;
  responsible: string;
};

export type ReportRecord = {
  id: string;
  title: string;
  stage: string;
  submittedBy: string;
  time: string;
  health: "Good" | "Attention";
};

export type SafetyRecord = {
  id: string;
  violation: string;
  worker: string;
  severity: "Low" | "Medium" | "High";
  time: string;
  status: "Open" | "Resolved";
};

export type DeadlineRecord = {
  id: string;
  name: string;
  due: string;
  owner: string;
};

export type MarkerRecord = {
  id: string;
  type: "socket" | "pipe" | "switch" | "light";
  x: number;
  y: number;
  positionClass: string;
};

export const projects: ProjectRecord[] = [
  {
    id: "alpha-tower",
    name: "Alpha Tower Renovation",
    location: "Moscow, Tverskaya 12",
    client: "Prime Capital",
    status: "On track",
    progress: 72,
    progressClass: "w-[72%]",
    stageCount: 8,
    activeTeam: 14,
    floorPlan: "Floor plan uploaded",
  },
  {
    id: "nova-residence",
    name: "Nova Residence Fit-out",
    location: "Saint Petersburg, Nevsky 41",
    client: "Nova Living",
    status: "At risk",
    progress: 43,
    progressClass: "w-[43%]",
    stageCount: 5,
    activeTeam: 9,
    floorPlan: "Awaiting upload",
  },
  {
    id: "river-hub",
    name: "River Hub Office Block",
    location: "Kazan, Embankment 7",
    client: "Riverline Group",
    status: "Needs review",
    progress: 58,
    progressClass: "w-[58%]",
    stageCount: 10,
    activeTeam: 18,
    floorPlan: "Stored in archive",
  },
];

export const stagesByProject: Record<string, StageRecord[]> = {
  "alpha-tower": [
    {
      id: "stage-01",
      name: "Demolition and cleanup",
      status: "Complete",
      deadline: "2026-04-14",
      progress: 100,
      progressClass: "w-full",
      responsible: "Andrey K.",
    },
    {
      id: "stage-02",
      name: "Electrical rough-in",
      status: "In progress",
      deadline: "2026-04-26",
      progress: 68,
      progressClass: "w-[68%]",
      responsible: "Irina S.",
    },
    {
      id: "stage-03",
      name: "Finishing and inspection",
      status: "Planned",
      deadline: "2026-05-04",
      progress: 0,
      progressClass: "w-0",
      responsible: "Sergey P.",
    },
  ],
};

export const reportsByProject: Record<string, ReportRecord[]> = {
  "alpha-tower": [
    {
      id: "r-101",
      title: "Daily inspection summary",
      stage: "Electrical rough-in",
      submittedBy: "Olga M.",
      time: "Today, 08:40",
      health: "Good",
    },
    {
      id: "r-102",
      title: "Photo-based stage review",
      stage: "Demolition and cleanup",
      submittedBy: "Anton R.",
      time: "Yesterday, 17:10",
      health: "Attention",
    },
  ],
};

export const safetyByProject: Record<string, SafetyRecord[]> = {
  "alpha-tower": [
    {
      id: "s-201",
      violation: "Missing harness on elevated work",
      worker: "Dmitry V.",
      severity: "High",
      time: "Today, 09:25",
      status: "Open",
    },
    {
      id: "s-202",
      violation: "Blocked emergency access",
      worker: "Pavel R.",
      severity: "Medium",
      time: "Today, 07:55",
      status: "Resolved",
    },
  ],
};

export const deadlines: DeadlineRecord[] = [
  {
    id: "d-1",
    name: "Electrical inspection",
    due: "2026-04-22",
    owner: "Irina S.",
  },
  {
    id: "d-2",
    name: "Safety briefing",
    due: "2026-04-23",
    owner: "Foreman desk",
  },
  {
    id: "d-3",
    name: "Act signing",
    due: "2026-04-26",
    owner: "Engineer desk",
  },
];

export const wallMarkers: MarkerRecord[] = [
  { id: "m-1", type: "socket", x: 22, y: 58, positionClass: "left-[22%] top-[58%]" },
  { id: "m-2", type: "switch", x: 42, y: 34, positionClass: "left-[42%] top-[34%]" },
  { id: "m-3", type: "light", x: 74, y: 20, positionClass: "left-[74%] top-[20%]" },
  { id: "m-4", type: "pipe", x: 62, y: 71, positionClass: "left-[62%] top-[71%]" },
];

export function getProject(id: string) {
  return projects.find((project) => project.id === id) ?? projects[0];
}

export function getStages(projectId: string) {
  return stagesByProject[projectId] ?? [];
}

export function getReports(projectId: string) {
  return reportsByProject[projectId] ?? [];
}

export function getSafetyRecords(projectId: string) {
  return safetyByProject[projectId] ?? [];
}
