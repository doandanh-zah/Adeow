export const CANVAS_SAVE_DEBOUNCE_MS = 2000;

export type CanvasPersistenceMode = "local-first";

export type CanvasSaveJob = {
  canvasId: string;
  revision: number;
  queuedAt: number;
};

export function createSaveJob(canvasId: string, revision: number): CanvasSaveJob {
  return {
    canvasId,
    revision,
    queuedAt: Date.now(),
  };
}
