# Excalidraw Upstream Snapshot

- Upstream repository: `https://github.com/excalidraw/excalidraw`
- Vendored on: `2026-06-05`
- Upstream commit: `b6d80e4256e718d14b2dc173315fb524f473320c`

## Contents

- `packages/` from upstream monorepo
- Root `LICENSE`
- Root `README.md`
- Root `package.json`

## Notes

- `.git` metadata is intentionally removed from the vendored copy.
- The ADEOW app currently renders the published `@excalidraw/excalidraw` package through `lib/canvas-core/runtime.tsx`.
- This vendored source exists so ADEOW can fork canvas behavior later without depending on `node_modules`.
