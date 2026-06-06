import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/config";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/canvas/home";
  }

  return value;
}

function getSafeOrigin(requestUrl: URL) {
  const safeUrl = new URL(requestUrl.toString());

  if (
    safeUrl.hostname === "0.0.0.0" ||
    safeUrl.hostname === "::" ||
    safeUrl.hostname === "[::]" ||
    safeUrl.hostname === "::1"
  ) {
    safeUrl.hostname = "localhost";
  }

  return `${safeUrl.protocol}//${safeUrl.host}`;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const response = NextResponse.redirect(
    `${getSafeOrigin(requestUrl)}${next}`,
    307,
  );

  if (code) {
    const { url, anonKey } = getSupabasePublicEnv();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
