"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import type { CanvasAuthUser } from "@/components/canvas/CanvasTopRightControls";
import {
  readInitialCanvasDocument,
  type CanvasInitialDocument,
} from "@/lib/canvas-core/document";
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

  return (
    <div className="adeow-canvas-host relative h-screen w-screen overflow-hidden bg-background">
      <style dangerouslySetInnerHTML={{ __html: CRITICAL_CANVAS_STYLES }} />
      <div className="h-screen w-screen">
        {resolvedInitialData ? (
          <CanvasEngine
            canvasId={canvasId}
            initialData={resolvedInitialData}
            initialUser={initialUser}
            key={canvasId}
          />
        ) : null}
      </div>
    </div>
  );
}
