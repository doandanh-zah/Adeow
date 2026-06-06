import type { SupabaseClient } from "@supabase/supabase-js";
import type { CanvasInitialDocument } from "@/lib/canvas-core/document";
import { createSupabaseBrowserClient } from "./client";

function normalizeRouteCanvasId(routeCanvasId: string) {
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

export function getPersistedCanvasId(routeCanvasId: string, userId: string) {
  return `user:${userId}:canvas:${normalizeRouteCanvasId(routeCanvasId)}`;
}

function getCanvasTitle(routeCanvasId: string) {
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
