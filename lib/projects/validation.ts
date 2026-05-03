import type { ProjectFormField, ProjectObjectType } from "@/lib/projects/types";

export const projectObjectTypes: Array<{
  value: ProjectObjectType;
  label: string;
  description: string;
}> = [
  { value: "apartment", label: "Apartment", description: "Single residential unit or fit-out" },
  { value: "residential_building", label: "Residential building", description: "Multi-unit apartment block" },
  { value: "office", label: "Office", description: "Administrative or business workspace" },
  { value: "retail", label: "Retail", description: "Stores, malls, and customer-facing spaces" },
  { value: "industrial", label: "Industrial", description: "Workshop, plant, or warehouse project" },
  { value: "renovation", label: "Renovation", description: "Existing asset renovation or repair" },
  { value: "fit_out", label: "Fit-out", description: "Interior fit-out and commissioning" },
  { value: "other", label: "Other", description: "Custom construction object" },
];

export function isProjectObjectType(value: string): value is ProjectObjectType {
  return projectObjectTypes.some((option) => option.value === value);
}

export function validateProjectDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "Enter valid planned dates.";
  }

  if (end < start) {
    return "The end date must be on or after the start date.";
  }

  return null;
}

export function getMissingFieldMessage(field: ProjectFormField) {
  switch (field) {
    case "name":
      return "Project name is required.";
    case "address":
      return "Address is required.";
    case "objectType":
      return "Choose an object type.";
    case "startDate":
      return "Choose a planned start date.";
    case "endDate":
      return "Choose a planned end date.";
    case "responsibleUsers":
      return "Select at least one responsible user.";
    case "floorPlan":
      return "Upload a floor plan image.";
    default:
      return "This field is required.";
  }
}

