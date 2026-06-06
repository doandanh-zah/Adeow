import { CanvasShell } from "@/components/canvas/CanvasShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CanvasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <CanvasShell
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
