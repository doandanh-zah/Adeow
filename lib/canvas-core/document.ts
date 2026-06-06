export type CanvasInitialDocument = {
  type?: string;
  version?: number;
  source?: string;
  elements?: unknown[];
  files?: Record<string, unknown>;
  appState: Record<string, unknown> & {
    gridModeEnabled?: boolean;
    gridSize?: number;
    gridStep?: number;
    viewBackgroundColor?: string;
    theme?: "light" | "dark";
  };
};

const STORAGE_PREFIX = "adeow:canvas:v1:";

export function getCanvasStorageKey(canvasId: string) {
  return `${STORAGE_PREFIX}${canvasId}`;
}

export function createInitialCanvasDocument(
  overrides?: Partial<CanvasInitialDocument>,
): CanvasInitialDocument {
  const base: CanvasInitialDocument = {
    appState: {
      gridModeEnabled: true,
      gridSize: 36,
      gridStep: 1,
      viewBackgroundColor: "#f7f8fa",
    },
  };

  return {
    ...base,
    ...overrides,
    appState: {
      ...base.appState,
      ...overrides?.appState,
    },
  };
}

export function readInitialCanvasDocument(canvasId: string): CanvasInitialDocument {
  if (typeof window === "undefined") {
    return createInitialCanvasDocument();
  }

  const rawValue = window.localStorage.getItem(getCanvasStorageKey(canvasId));

  if (!rawValue) {
    return createInitialCanvasDocument();
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<CanvasInitialDocument> | null;

    if (!parsed || typeof parsed !== "object") {
      return createInitialCanvasDocument();
    }

    return createInitialCanvasDocument(parsed);
  } catch {
    return createInitialCanvasDocument();
  }
}
