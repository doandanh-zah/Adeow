import type { ArtifactKind } from "./service";

export function getArtifactEditorRoute(artifactId: string, kind: ArtifactKind) {
  void kind;
  return `/a/${artifactId}`;
}

export function getArtifactShareRoute(token: string) {
  return `/share/a/${token}`;
}
