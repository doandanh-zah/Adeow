# ADEOW

Agent Does Everything On Whiteboard.

## Current Scope

- Next.js App Router shell
- Vendored canvas-engine upstream snapshot in `vendor/excalidraw`
- Client-only canvas route at `/canvas/[id]`
- Full-screen white canvas with ADEOW naming and stripped upstream socials/help
- Phase 0 scaffold for artifact routes, sidecar, Supabase migration, and env template
- Brand tokens documented in `brand.md`

This repo intentionally keeps the artifact editor, AI tool execution, and local-first sync deeper than the first visual shell.

## Development

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`. The root route redirects to `/canvas/home`.

## Upstream Canvas Strategy

- App-facing code uses ADEOW naming. The upstream canvas package is isolated behind `lib/canvas-core/runtime.tsx`.
- Upstream source is vendored under `vendor/excalidraw` for future fork-level edits.
- The vendored snapshot is pinned in [vendor/excalidraw/UPSTREAM.md](vendor/excalidraw/UPSTREAM.md).

## Phase 0 Status

- Canvas route renders client-only without SSR or hydration issues.
- `.env.example`, `.env.local`, `supabase/migrations/001_init.sql`, and sidecar skeleton are now in place.
- Dedicated artifact routes exist at `/a/[id]` and `/share/a/[token]` as placeholders.
- Supabase project wiring is limited to setup only in Phase 0; auth and canvas CRUD are deferred to Phase 1.
- Remaining manual work: deploy to Vercel and wire ONLYOFFICE callbacks when Phase 1 starts.

## Verification

Validated locally with:

```bash
npm run lint
npm run build
```

## Next Steps

1. Keep iterating on the canvas UI until the whiteboard surface feels right.
2. Start Phase 1 with auth boundary, `canvas_documents` persistence, and local-first save flow.
3. Replace artifact placeholders with signed ONLYOFFICE config and callback handling later.
