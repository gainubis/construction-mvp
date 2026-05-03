const AR_WALL_PHOTOS_BUCKET = "ar-wall-photos";

export function buildArWallPhotoPath(projectId: string, planId: string, fileName: string) {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
  return `projects/${projectId}/plans/${planId}/${Date.now()}-${sanitizedName}`;
}

export { AR_WALL_PHOTOS_BUCKET };
