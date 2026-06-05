"use client";

import { createInitialCanvasDocument } from "@/lib/canvas-core/document";
import { CanvasEngine } from "@/lib/canvas-core/runtime";

export function AdeowCanvasClient() {
  const initialData = createInitialCanvasDocument();

  return (
    <div className="adeow-canvas-host relative h-screen w-screen overflow-hidden bg-background">
      <div className="h-screen w-screen">
        <CanvasEngine initialData={initialData} />
      </div>
    </div>
  );
}
