import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return new NextResponse(null, {
    status: 307,
    headers: {
      location: `${getSafeOrigin(requestUrl)}${next}`,
    },
  });
}
