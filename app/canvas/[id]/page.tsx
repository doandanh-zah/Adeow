import { CanvasShell } from "@/components/canvas/CanvasShell";
import {
  createInitialCanvasDocument,
  type CanvasInitialDocument,
} from "@/lib/canvas-core/document";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCanvasDocumentForUser } from "@/lib/supabase/canvases";

export default async function CanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let initialData: CanvasInitialDocument = createInitialCanvasDocument();
  let user: Awaited<
    ReturnType<Awaited<ReturnType<typeof createSupabaseServerClient>>["auth"]["getUser"]>
  >["data"]["user"] | null = null;

  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();

    user = data.user;

    if (user) {
      const document = await loadCanvasDocumentForUser(supabase, id, user.id);

      if (document) {
        initialData = createInitialCanvasDocument(document);
      }
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
