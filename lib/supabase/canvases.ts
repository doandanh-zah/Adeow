import type { SupabaseClient } from "@supabase/supabase-js";
import type { CanvasInitialDocument } from "@/lib/canvas-core/document";
import { createInitialCanvasDocument } from "@/lib/canvas-core/document";
import { createSupabaseBrowserClient } from "./client";
import { hasSupabasePublicEnv } from "./config";

export type CanvasDirectoryEntry = {
  id: string;
  routeId: string;
  title: string;
  updatedAt: string;
  description: string | null;
  projectContext: string;
};

export function normalizeRouteCanvasId(routeCanvasId: string) {
  const trimmed = routeCanvasId.trim();
  return trimmed || "home";
}

function toTitleCase(value: string) {
  return value
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function createCanvasSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function buildUniqueCanvasRouteId(
  existingRouteIds: string[],
  requestedValue: string,
) {
  const normalizedExistingIds = new Set(
    existingRouteIds.map((routeId) => normalizeRouteCanvasId(routeId)),
  );
  const baseRouteId = normalizeRouteCanvasId(
    createCanvasSlug(requestedValue) || "untitled-canvas",
  );

  if (!normalizedExistingIds.has(baseRouteId)) {
    return baseRouteId;
  }

  let suffix = 2;

  while (normalizedExistingIds.has(`${baseRouteId}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseRouteId}-${suffix}`;
}

export function getPersistedCanvasId(routeCanvasId: string, userId: string) {
  return `user:${userId}:canvas:${normalizeRouteCanvasId(routeCanvasId)}`;
}

export function extractRouteCanvasId(
  persistedCanvasId: string,
  userId?: string,
) {
  const exactPrefix = userId ? `user:${userId}:canvas:` : null;

  if (exactPrefix && persistedCanvasId.startsWith(exactPrefix)) {
    return persistedCanvasId.slice(exactPrefix.length) || "home";
  }

  const separatorIndex = persistedCanvasId.indexOf(":canvas:");

  if (separatorIndex === -1) {
    return normalizeRouteCanvasId(persistedCanvasId);
  }

  return normalizeRouteCanvasId(
    persistedCanvasId.slice(separatorIndex + ":canvas:".length),
  );
}

export function getCanvasTitle(routeCanvasId: string) {
  const normalized = normalizeRouteCanvasId(routeCanvasId);
  return normalized === "home" ? "Home" : toTitleCase(normalized);
}

async function upsertCanvasMetadata(
  supabase: SupabaseClient,
  routeCanvasId: string,
  userId: string,
) {
  return await supabase.from("canvases").upsert(
    {
      id: getPersistedCanvasId(routeCanvasId, userId),
      title: getCanvasTitle(routeCanvasId),
      user_id: userId,
    },
    { onConflict: "id" },
  );
}

export async function saveCanvasDocumentToDB(
  routeCanvasId: string,
  payload: string,
): Promise<boolean> {
  if (!hasSupabasePublicEnv()) {
    return false;
  }

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  let parsed: Partial<CanvasInitialDocument> | null = null;

  try {
    parsed = JSON.parse(payload) as Partial<CanvasInitialDocument>;
  } catch {
    return false;
  }

  if (!parsed || typeof parsed !== "object") {
    return false;
  }

  const { error: canvasError } = await upsertCanvasMetadata(
    supabase,
    routeCanvasId,
    user.id,
  );

  if (canvasError) {
    console.error("[adeow] canvas upsert failed", canvasError);
    return false;
  }

  const { error: documentError } = await supabase.from("canvas_documents").upsert(
    {
      canvas_id: getPersistedCanvasId(routeCanvasId, user.id),
      document: parsed,
      user_id: user.id,
    },
    { onConflict: "canvas_id" },
  );

  if (documentError) {
    console.error("[adeow] canvas document upsert failed", documentError);
    return false;
  }

  return true;
}

export async function listCanvasesForUser(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("canvases")
    .select("id, title, updated_at, description, project_context")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [] satisfies CanvasDirectoryEntry[];
  }

  return data.map((canvas) => ({
    id: canvas.id,
    routeId: extractRouteCanvasId(canvas.id, userId),
    title: canvas.title,
    updatedAt: canvas.updated_at,
    description: canvas.description,
    projectContext: canvas.project_context ?? "",
  }));
}

export async function createCanvasForUser(
  supabase: SupabaseClient,
  userId: string,
  requestedTitle: string,
) {
  const existingCanvases = await listCanvasesForUser(supabase, userId);
  const routeId = buildUniqueCanvasRouteId(
    existingCanvases.map((canvas) => canvas.routeId),
    requestedTitle,
  );
  const title = getCanvasTitle(routeId);
  const persistedCanvasId = getPersistedCanvasId(routeId, userId);

  const { error: canvasError } = await supabase.from("canvases").upsert(
    {
      id: persistedCanvasId,
      title,
      user_id: userId,
    },
    { onConflict: "id" },
  );

  if (canvasError) {
    throw canvasError;
  }

  const { error: documentError } = await supabase.from("canvas_documents").upsert(
    {
      canvas_id: persistedCanvasId,
      document: createInitialCanvasDocument(),
      user_id: userId,
    },
    { onConflict: "canvas_id" },
  );

  if (documentError) {
    throw documentError;
  }

  return {
    persistedCanvasId,
    routeId,
    title,
  };
}

export async function loadCanvasDocumentForUser(
  supabase: SupabaseClient,
  routeCanvasId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("canvas_documents")
    .select("document")
    .eq("canvas_id", getPersistedCanvasId(routeCanvasId, userId))
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.document) {
    return null;
  }

  return data.document as Partial<CanvasInitialDocument>;
}
