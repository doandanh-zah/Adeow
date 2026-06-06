import type { CanvasAuthUser } from "./CanvasTopRightControls";
import type { CanvasInitialDocument } from "@/lib/canvas-core/document";
import { AdeowCanvasClient } from "./AdeowCanvasClient";

type CanvasShellProps = {
  initialData: CanvasInitialDocument;
  initialUser: CanvasAuthUser;
};

export function CanvasShell({ initialData, initialUser }: CanvasShellProps) {
  return (
    <main className="h-screen w-screen bg-background">
      <AdeowCanvasClient initialData={initialData} initialUser={initialUser} />
    </main>
  );
}
