export const ARTIFACT_KINDS = [
  "doc",
  "sheet",
  "slides",
  "fillable_form",
  "survey_form",
  "media",
  "file",
] as const;

export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

export type ArtifactRecord = {
  id: string;
  canvasId: string;
  kind: ArtifactKind;
  title: string;
};
