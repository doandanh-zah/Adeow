export function getSidecarBaseUrl() {
  return process.env.NEXT_PUBLIC_SIDECAR_URL ?? "http://localhost:27107";
}

export function getSidecarHealthUrl() {
  return `${getSidecarBaseUrl()}/health`;
}
