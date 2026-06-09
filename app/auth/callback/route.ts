import { NextRequest, NextResponse } from "next/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));
  const errorOrigin =
    process.env.NODE_ENV === "development"
      ? getSafeOrigin(new URL(request.url))
      : origin;

  if (!hasSupabasePublicEnv()) {
    return NextResponse.redirect(`${errorOrigin}/auth/auth-code-error`, 307);
  }

  if (code) {
    const isLocalEnv = process.env.NODE_ENV === "development";
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const redirectOrigin = isLocalEnv
      ? getSafeOrigin(new URL(request.url))
      : forwardedHost
        ? `${forwardedProto ?? "https"}://${forwardedHost}`
        : origin;
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${redirectOrigin}${next}`, 307);
    }

    console.error("Supabase auth code exchange failed", error);
  }

  return NextResponse.redirect(`${errorOrigin}/auth/auth-code-error`, 307);
}
