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
const CANVAS_DIRECTORY_STORAGE_KEY = "adeow:canvas-directory:v1";

export type LocalCanvasDirectoryEntry = {
  id: string;
  title: string;
  updatedAt: string;
};

export function getCanvasStorageKey(canvasId: string) {
  return `${STORAGE_PREFIX}${canvasId}`;
}

function readLocalCanvasDirectoryEntriesFromStorage() {
  if (typeof window === "undefined") {
    return [] as LocalCanvasDirectoryEntry[];
  }

  const rawValue = window.localStorage.getItem(CANVAS_DIRECTORY_STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const record = entry as Partial<LocalCanvasDirectoryEntry>;

        if (
          typeof record.id !== "string" ||
          !record.id.trim() ||
          typeof record.title !== "string" ||
          !record.title.trim() ||
          typeof record.updatedAt !== "string" ||
          !record.updatedAt.trim()
        ) {
          return null;
        }

        return {
          id: record.id.trim(),
          title: record.title.trim(),
          updatedAt: record.updatedAt,
        } satisfies LocalCanvasDirectoryEntry;
      })
      .filter((entry): entry is LocalCanvasDirectoryEntry => entry !== null)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } catch {
    return [];
  }
}

function writeLocalCanvasDirectoryEntries(
  entries: LocalCanvasDirectoryEntry[],
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    CANVAS_DIRECTORY_STORAGE_KEY,
    JSON.stringify(entries),
  );
}

export function listLocalCanvasDirectoryEntries() {
  return readLocalCanvasDirectoryEntriesFromStorage();
}

export function upsertLocalCanvasDirectoryEntry(
  entry: Pick<LocalCanvasDirectoryEntry, "id"> &
    Partial<Omit<LocalCanvasDirectoryEntry, "id">>,
) {
  if (typeof window === "undefined") {
    return;
  }

  const existingEntries = readLocalCanvasDirectoryEntriesFromStorage().filter(
    (existingEntry) => existingEntry.id !== entry.id,
  );

  existingEntries.unshift({
    id: entry.id.trim(),
    title: entry.title?.trim() || entry.id.trim(),
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
  });

  writeLocalCanvasDirectoryEntries(
    existingEntries.sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    ),
  );
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
