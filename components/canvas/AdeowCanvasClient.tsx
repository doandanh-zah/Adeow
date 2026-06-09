"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CanvasPageSwitcher } from "@/components/canvas/CanvasPageSwitcher";
import { CanvasToolbarTooltips } from "@/components/canvas/CanvasToolbarTooltips";
import type { CanvasAuthUser } from "@/components/canvas/CanvasTopRightControls";
import {
  readInitialCanvasDocument,
  type CanvasInitialDocument,
  upsertLocalCanvasDirectoryEntry,
} from "@/lib/canvas-core/document";
import type {
  CanvasLanguageCode,
  CanvasTheme,
} from "@/lib/canvas-core/ui";
import { getCanvasTitle } from "@/lib/supabase/canvases";
import { CanvasEngine } from "@/lib/canvas-core/runtime";

const CRITICAL_CANVAS_STYLES = `
.excalidraw:not(.excalidraw--mobile) .shapes-section .dropdown-menu {
  top: auto !important;
  bottom: calc(100% + 0.5rem) !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.excalidraw .main-menu-trigger,
.excalidraw .App-menu__left,
.excalidraw .zoom-actions,
.excalidraw .undo-redo-buttons,
.excalidraw .dropdown-menu .dropdown-menu-container {
  background-color: var(--island-bg-color) !important;
  box-shadow: var(--shadow-island) !important;
}

.excalidraw .zoom-button,
.excalidraw .undo-redo-buttons button {
  background-color: var(--island-bg-color) !important;
}
`;

type AdeowCanvasClientProps = {
  initialData: CanvasInitialDocument;
  initialUser: CanvasAuthUser;
};

function isCanvasTheme(value: unknown): value is CanvasTheme {
  return value === "light" || value === "dark";
}

function getInitialCanvasTheme(initialData: CanvasInitialDocument): CanvasTheme {
  return isCanvasTheme(initialData.appState?.theme)
    ? initialData.appState.theme
    : "light";
}

export function AdeowCanvasClient({
  initialData,
  initialUser,
}: AdeowCanvasClientProps) {
  const params = useParams<{ id?: string | string[] }>();
  const canvasId =
    typeof params.id === "string" && params.id.trim() ? params.id : "home";

  const resolvedInitialData = useMemo(() => {
    if (initialUser) {
      return initialData;
    }

    return readInitialCanvasDocument(canvasId);
  }, [canvasId, initialData, initialUser]);
  const initialTheme = getInitialCanvasTheme(resolvedInitialData);
  const [themeByCanvasId, setThemeByCanvasId] = useState<
    Partial<Record<string, CanvasTheme>>
  >({});
  const [langCode, setLangCode] = useState<CanvasLanguageCode>("en");
  const theme = themeByCanvasId[canvasId] ?? initialTheme;

  const handleThemeChange = (nextTheme: CanvasTheme) => {
    setThemeByCanvasId((currentThemes) => ({
      ...currentThemes,
      [canvasId]: nextTheme,
    }));
  };

  useEffect(() => {
    if (initialUser) {
      return;
    }

    upsertLocalCanvasDirectoryEntry({
      id: canvasId,
      title: getCanvasTitle(canvasId),
    });
  }, [canvasId, initialUser]);

  return (
    <div className="adeow-canvas-host relative h-screen w-screen overflow-hidden bg-background">
      <style dangerouslySetInnerHTML={{ __html: CRITICAL_CANVAS_STYLES }} />
      <CanvasPageSwitcher
        canvasId={canvasId}
        initialUser={initialUser}
        langCode={langCode}
        theme={theme}
      />
      <CanvasToolbarTooltips langCode={langCode} />
      <div className="h-screen w-screen">
        {resolvedInitialData ? (
          <CanvasEngine
            canvasId={canvasId}
            initialData={resolvedInitialData}
            initialUser={initialUser}
            key={canvasId}
            langCode={langCode}
            onLangCodeChange={setLangCode}
            onThemeChange={handleThemeChange}
            theme={theme}
          />
        ) : null}
      </div>
    </div>
  );
}
