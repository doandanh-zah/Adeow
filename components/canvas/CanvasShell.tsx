import type { CanvasAuthUser } from "./CanvasTopRightControls";
import { AdeowCanvasClient } from "./AdeowCanvasClient";

type CanvasShellProps = {
  initialUser: CanvasAuthUser;
};

export function CanvasShell({ initialUser }: CanvasShellProps) {
  return (
    <main className="h-screen w-screen bg-background">
      <AdeowCanvasClient initialUser={initialUser} />
    </main>
  );
}
