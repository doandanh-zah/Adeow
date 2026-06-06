import { CanvasShell } from "@/components/canvas/CanvasShell";
import {
  createInitialCanvasDocument,
  type CanvasInitialDocument,
} from "@/lib/canvas-core/document";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCanvasDocumentForUser } from "@/lib/supabase/canvases";

export default async function CanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let initialData: CanvasInitialDocument = createInitialCanvasDocument();

  if (user) {
    const document = await loadCanvasDocumentForUser(supabase, id, user.id);

    if (document) {
      initialData = createInitialCanvasDocument(document);
    }
  }

  return (
    <CanvasShell
      initialData={initialData}
      initialUser={
        user
          ? {
              email: user.email,
              user_metadata: user.user_metadata,
            }
          : null
      }
    />
  );
}
