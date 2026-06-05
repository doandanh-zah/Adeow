export const ARTIFACT_SHARE_ACCESS = ["view", "comment", "edit", "fill"] as const;

export type ArtifactShareAccess = (typeof ARTIFACT_SHARE_ACCESS)[number];

export type ArtifactShareLink = {
  token: string;
  access: ArtifactShareAccess;
  allowDownload: boolean;
};
