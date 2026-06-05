# ADEOW
**Agent Does Everything On Whiteboard**

> Một AI-native canvas workspace cá nhân — nơi mọi thứ mày đang làm đều sống trên một mặt phẳng duy nhất, và AI hiểu đủ context để act thay mày.

---

## 1. Vấn Đề Cần Giải Quyết

Người làm việc hàng ngày với file/code/thư mục bị 3 cái giết năng suất:

1. **Không biết cái gì nằm ở đâu** — poster ở Illustrator, nội dung ở Google Docs, budget ở Sheets, code ở GitHub, feedback ở Telegram. Mỗi thứ một nơi. Đến lúc cần sửa thì mất thời gian đi tìm hơn là làm.

2. **Switch context liên tục** — đang làm slide → nhớ cần ảnh → mở Drive → thấy file khác → quay qua sửa poster → quên mất slide đang làm tới đâu. Não phải giữ quá nhiều tab cùng lúc.

3. **Không có "working memory"** — file không tự nói: cái này dùng để làm gì, tại sao sửa như vậy, có liên quan đến task nào, bản nào là mới nhất. Mỗi lần quay lại là phải tự nhớ lại toàn bộ bối cảnh. Với code thì tệ hơn — vibecode xong, hôm sau quay lại mất 30 phút chỉ để hiểu "hồi đó mình đang làm tới đâu".

**Root cause:** Công cụ hiện tại lưu artifacts, không lưu context. File system lưu dữ liệu, nhưng không lưu suy nghĩ.

---

## 2. Vision

**JARVIS cho cá nhân** — không phải app collaboration, không phải productivity suite cho team. Một tool cá nhân để một người trở nên siêu năng suất.

Thay vì app-centric (mở từng app riêng), là **context-centric**: mọi thứ sống trên canvas, AI hiểu toàn bộ context, act được thay mày.

```
Finder biết tìm file.
GitHub biết code.
Figma biết design.
Notion biết note.

Adeow biết mày đang làm gì.
```

Khi mày mở Adeow, nó biết: "Mày đang làm hackathon DSUC, đây là poster, đây là timeline, đây là repo web đăng ký, đây là budget, đây là file đã duyệt, đây là task đang trễ, đây là phần cần sửa tiếp."

---

## 3. Core Concepts

### Canvas
Đơn vị tổ chức cao nhất. Một canvas = một project/context. Ví dụ: "DSUC Hackathon", "VORA", "The Builzer". Canvas có thể chứa canvas con (nested), cho phép zoom in/out từ overview đến detail.

### Block
Đơn vị nội dung trên canvas. Mỗi block là một scene element hoặc app node trong canvas engine của ADEOW, và đi kèm **context layer**: tại sao tồn tại, trạng thái hiện tại, lý do sửa đổi, liên kết đến block khác. Đây là thứ phân biệt Adeow với FigJam.

### Artifact
Đơn vị tài liệu/file thực sự. Block trên canvas chỉ là card đại diện hoặc entry point cho artifact. Double-click block sẽ mở artifact ở route riêng / tab riêng để edit kiểu Google Docs. Artifact có thể là `doc`, `sheet`, `slides`, `fillable_form`, `survey_form`, `media`, hoặc file reference khác.

### AI Layer
AI không phải chatbot ngồi một góc. AI có thể đọc và act trên block, artifact, memory, session snapshot; biết toàn bộ context của canvas; và khi được cấp quyền có thể sửa file thật, update doc metadata, review diff, hoặc generate nội dung vào document editor. AI là layer overlay lên toàn bộ workspace.

### Sidecar
Process Node.js chạy local trên máy (`localhost:27107`). Là bridge giữa web app và filesystem/git. Khi sidecar chạy, AI chỉ được đụng vào **repo đã register và command đã allowlist**. Khi không có sidecar (cloud mode), AI chỉ làm việc với content trong canvas.

### Memory
AI nhớ về mày qua các sessions: preferences, quyết định đã làm, patterns làm việc. Không phải chatbot mỗi lần là người lạ.

### Session Snapshot
Cuối mỗi working session, AI tự ghi lại: đang làm tới đâu, files nào đã sửa, todo còn lại, open questions. Đầu session mới, AI đọc snapshot và brief mày trong 30 giây. Giải quyết hoàn toàn vấn đề vibecode context reset.

### Heartbeat
Trong v1, đây là **active-session assistant**: khi app hoặc sidecar đang chạy thì định kỳ detect block stale, detect duplicate, nhắc task trễ, suggest archive. Nếu sau này cần true background agent 24/7 thì làm phase riêng.

---

## 4. Tech Stack

### Frontend / App
| Layer | Tech | Lý do |
|-------|------|-------|
| Framework | **Next.js** (App Router) | App shell, auth, route handlers, deploy Vercel |
| Canvas | **Forked Excalidraw core** (vendored vào repo, render trong client-only component) | Có thể fork/sửa sâu hợp pháp theo MIT, vẫn giữ lợi thế whiteboard và scene JSON |
| Styling | **Tailwind CSS** | Utility-first, consistent |
| Code editor | **Monaco Editor** (`@monaco-editor/react`) | VS Code engine, embed trong block |
| Rich text | **TipTap** | Headless, extensible, dùng cho Doc block |
| Office editor | **ONLYOFFICE Docs** + `@onlyoffice/document-editor-react` | Một engine cho DOCX/XLSX/PPTX/PDF forms, phù hợp flow mở tab riêng, edit, comment, review, share |
| Survey / app forms | **SurveyJS** (optional module) | Dùng nếu cần Google Forms-like survey builder; tách riêng với fillable office forms |

### Backend / Data
| Layer | Tech | Lý do |
|-------|------|-------|
| Database | **Supabase** (Postgres) | Auth + Realtime + free tier đủ dùng |
| File storage | **Cloudflare R2** | Free egress, thay Supabase Storage cho media |
| Auth | **Supabase Auth** (Google OAuth) | Nhanh setup, đủ cho 1 user |
| Deploy | **Vercel** | Free tier, Next.js native |

### AI
| Layer | Tech | Lý do |
|-------|------|-------|
| Primary runtime | **OpenAI Responses API** qua Next.js route | Auth chuẩn, dễ vận hành, stream ổn định |
| Model | **Coding-capable OpenAI model** (pin exact model theo env) | Mạnh cho code/file workflows nhưng không hard-code 1 model name vào kiến trúc |
| Provider layer | **Adapter interface** (`lib/ai/providers/*`) | Cho phép đổi model/auth path mà không đụng UI + tool executor |
| Auth | **Server-side API key / project key** | Production-safe, supported path |
| Experimental path | **Local Codex session via sidecar** | Chỉ làm sau khi có POC riêng, không block v1 |
| Transport | **SSE từ route handler** | Stream token + tool events về client đơn giản |

**Ghi chú:** Đường mặc định của v1 là `OPENAI_API_KEY` trên server. Nếu sau này muốn đi theo `Codex local session`, làm như một adapter thử nghiệm, không để toàn bộ app phụ thuộc vào nó ngay từ đầu.

### Local Sidecar
| Layer | Tech | Lý do |
|-------|------|-------|
| Runtime | **Node.js** + Express | Lightweight, mày đã quen |
| Git | **simple-git** | Wrapper gọn cho git operations |
| Port | `27107` | Consistent với VORA architecture |
| Security | **shared secret + repo allowlist** | Không expose raw filesystem cho app/model |

### Storage Strategy
```
Browser IndexedDB + canvas scene snapshot  ← local-first cho canvas document
        ↓ debounce sync
Supabase Postgres                          ← cloud backup + AI metadata + user-owned sync

Sidecar SQLite (optional, phase sau)      ← local registry cho repos / queues / secure sidecar state
Cloudflare R2                             ← artifact binaries + media assets
```
**Nguyên tắc:**
1. Canvas document dùng scene snapshot của canvas engine, lưu local trước rồi mới sync.
2. Artifact binary (`docx/xlsx/pptx/pdf`) lưu object storage; metadata artifact + share link lưu ở Supabase.
3. AI metadata (`block context`, `memory`, `session snapshot`) lưu ở Supabase và cache local khi cần.
4. Sidecar không phải điều kiện để app chạy. Không có sidecar thì app vẫn dùng được ở `cloud mode`.

### Locked Decisions Cho v1
- Base app = **Next.js App Router**. Canvas engine dùng **fork của Excalidraw** được vendor/fork riêng, không lấy app demo của upstream làm foundation của repo.
- Persistence tách 2 lớp: **canvas document** và **AI metadata**. Không tự model lại toàn bộ scene geometry/content của elements trong Postgres.
- V1 có 2 loại nội dung: `native block` (note/doc/code/link/canvas_ref) và `artifact block` (office doc/sheet/slides/forms mở tab riêng).
- Office editing engine mặc định = **ONLYOFFICE Docs**. Nếu cần survey-style forms như Google Forms thì làm module riêng bằng **SurveyJS**, không nhét chung vào office form flow.
- AI path mặc định = server-side OpenAI adapter. Bất kỳ `Codex OAuth/session reuse` nào cũng là experimental, không khóa chặt kiến trúc.
- Upstream canvas strategy = fork `Excalidraw`

---

## 5. Kiến Trúc Hệ Thống

```
┌──────────────────────────────────────────────────────────────┐
│                    BROWSER (Next.js App)                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   CanvasShell (client-only)                          │   │
│  │   dynamic(..., { ssr: false })                       │   │
│  │                                                      │   │
│  │   Forked Excalidraw core + scene persistence         │   │
│  │   [Note] [Doc] [Code] [Artifact] [Link] [CanvasRef]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↕                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AI Panel                                             │   │
│  │  Context Builder → /api/ai → Tool Executor           │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↕ open in new tab                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Artifact Editor Routes                              │   │
│  │  /a/[id]  /share/a/[token]                           │   │
│  │  ONLYOFFICE / SurveyJS / custom viewers              │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↕ fetch                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js Route Handlers                              │   │
│  │  /api/canvas  /api/document  /api/ai                 │   │
│  │  /api/memory  /api/snapshots                         │   │
│  │  /api/artifacts  /api/share-links                    │   │
│  │  /api/onlyoffice/config  /api/onlyoffice/callback    │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────┬──────────────────────────┬──────────────────┘
                │ localhost:27107           │ HTTPS
                ↓                           ↓
┌─────────────────────────┐   ┌──────────────────────────────┐
│   Local Sidecar         │   │  Supabase                    │
│   (optional)            │   │  Postgres + Auth + Realtime  │
│                         │   └──────────────────────────────┘
│  /health                │   ┌──────────────────────────────┐
│  /repos                 │   │  Cloudflare R2               │
│  /files                 │   │  Media assets                │
│  /git                   │   └──────────────────────────────┘
│  /terminal              │   ┌──────────────────────────────┐
│  ↓ allowlisted repos    │   │  OpenAI Responses API        │
│  filesystem + git       │   │  via provider adapter        │
└─────────────────────────┘   └──────────────────────────────┘
                               ┌──────────────────────────────┐
                               │  ONLYOFFICE Document Server  │
                               │  JWT-signed config + callback│
                               └──────────────────────────────┘
```

**Persistence split của v1:**
- `canvas document` = scene snapshot JSON của canvas, local-first.
- `block_contexts` = metadata AI hiểu được về từng block/shape.
- `artifacts` = office docs / forms / binary resources mở bằng editor riêng.
- `memories` + `session_snapshots` = working memory của user và project.

---

## 6. Data Model

### Canvas
```typescript
type Canvas = {
  id: string
  user_id: string
  title: string
  description: string
  project_context: string
  parent_canvas_id: string | null
  created_at: string
  updated_at: string
}
```

### CanvasDocument
```typescript
type CanvasDocument = {
  canvas_id: string
  user_id: string
  document: Record<string, unknown> // scene snapshot của canvas engine
  schema_version: string
  updated_at: string
}
```

### BlockContext
```typescript
type BlockContext = {
  id: string
  canvas_id: string
  user_id: string
  shape_id: string               // id thật của scene element / block node
  type: BlockType
  canonical_name: string | null
  purpose: string
  status: 'draft' | 'in_progress' | 'review' | 'approved' | 'archived'
  summary: string | null
  linked_artifact_id: string | null
  linked_repo_alias: string | null
  linked_file_path: string | null
  metadata: Record<string, unknown>
  decision_log: DecisionEntry[]
  created_at: string
  updated_at: string
}

type BlockType =
  | 'note'
  | 'doc'
  | 'code'
  | 'artifact'
  | 'link'
  | 'canvas_ref'
  | 'media'   // optional sau v1
```

### Artifact
```typescript
type Artifact = {
  id: string
  canvas_id: string
  user_id: string
  kind: ArtifactKind
  editor_provider: 'onlyoffice' | 'surveyjs' | 'native' | 'external'
  title: string
  summary: string | null
  mime_type: string
  file_ext: string
  storage_key: string
  byte_size: number | null
  latest_version: number
  preview_image_key: string | null
  created_at: string
  updated_at: string
}

type ArtifactKind =
  | 'doc'
  | 'sheet'
  | 'slides'
  | 'fillable_form'
  | 'survey_form'
  | 'media'
  | 'file'
```

### ArtifactShareLink
```typescript
type ArtifactShareLink = {
  id: string
  artifact_id: string
  created_by: string
  token: string
  access: 'view' | 'comment' | 'edit' | 'fill'
  allow_download: boolean
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}
```

### BlockLink
```typescript
type BlockLink = {
  id: string
  canvas_id: string
  user_id: string
  from_shape_id: string
  to_shape_id: string
  relationship:
    | 'supports'
    | 'depends_on'
    | 'references'
    | 'duplicates'
    | 'supersedes'
  metadata: Record<string, unknown>
  created_at: string
}
```

### Memory
```typescript
type Memory = {
  id: string
  user_id: string
  scope: 'global' | 'canvas' | 'block'
  scope_ref: string | null       // canvas_id hoặc shape_id tùy scope
  type: 'fact' | 'preference' | 'decision' | 'pattern'
  content: string
  confidence: number             // 0-1
  source: 'user' | 'ai' | 'system'
  created_at: string
  last_accessed: string
}
```

### SessionSnapshot
```typescript
type SessionSnapshot = {
  id: string
  user_id: string
  canvas_id: string
  summary: string
  active_shape_ids: string[]
  next_steps: string[]
  open_questions: string[]
  repo_summaries: Array<{
    repo_alias: string
    status: string
  }>
  created_at: string
}
```

---

## 7. AI System

### Context Hierarchy (khi gọi model)
```
System prompt = Soul (~500 tokens)
+ Canvas overview (~300 tokens)
+ Focused block content (shape + block context)
+ Related blocks (summary only, ~50 tokens mỗi cái)
+ Top-5 relevant memories (~500 tokens)
+ Last session snapshot (~300 tokens)
─────────────────────────────────
Tổng < 8k tokens → còn room cho response
```

### Soul (system prompt cố định)
```
Mày là ADEOW — workspace agent cá nhân của Zah.
- Trả lời tiếng Việt, technical terms giữ tiếng Anh
- Direct, concise, không vòng vo, không nịnh
- Khi request rõ ràng thì act luôn; chỉ hỏi lại khi thiếu thông tin ảnh hưởng trực tiếp tới kết quả
- Được phép challenge assumption yếu, chỉ ra risk, và đề xuất hướng thực thi tốt hơn
- Profile cá nhân của user không hard-code ở đây; đọc từ memory/profile store
- Không dùng công kích hay insult mặc định; chỉ dùng tone gắt hơn nếu user explicit trong session
```

### Tool Calls
```typescript
// Canvas tools (luôn available)
get_canvas_overview(canvas_id)
get_canvas_document(canvas_id)
get_block_context(shape_id)
create_shape(type, position, props)
update_shape(shape_id, props)
delete_shape(shape_id)
upsert_block_context(shape_id, patch)
create_artifact(kind, title, source?)
get_artifact(artifact_id)
update_artifact(artifact_id, patch)
open_artifact(artifact_id)           // UI event: open new tab/editor
create_share_link(artifact_id, access, options?)
link_blocks(from_shape_id, to_shape_id, relationship, metadata?)
search_block_contexts(query)
save_memory(type, content, scope, scope_ref?)
update_session_snapshot(canvas_id, summary, next_steps, open_questions, repo_summaries?)

// Sidecar tools (chỉ khi sidecar detected)
list_registered_repos()
register_repo(alias, root_path)
read_file(repo_alias, relative_path)
write_file(repo_alias, relative_path, content)
git_status(repo_alias)
git_diff(repo_alias)
git_commit(repo_alias, message)
git_push(repo_alias)
run_terminal(repo_alias, command, args)    // preset allowlist, không nhận raw shell command mặc định
```

**Nguyên tắc bảo mật cho sidecar tools:**
1. Model không bao giờ cầm raw absolute path.
2. File ops luôn đi qua `repo_alias + relative_path`.
3. `write`, `commit`, `push` mặc định phải qua approval gate ở UI hoặc policy flag rõ ràng.

### Khi Context Bị Tight
Không dump toàn bộ canvas vào prompt. Thay vào đó:
1. `get_canvas_overview()` → nhận list blocks + summary
2. AI tự quyết định block nào cần đọc full
3. `get_canvas_document()` hoặc `get_block_context(id)` cho từng block cần thiết
4. Xử lý chunked, không load hết 1 lần

---

## 8. Block Types — Chi Tiết

### V1 Scope
- Ship trước: `note`, `doc`, `code`, `artifact`, `link`, `canvas_ref`
- `artifact` trong v1 cover: `doc`, `sheet`, `slides`, `fillable_form`
- `survey_form` là module riêng; chỉ làm nếu thực sự cần Google Forms-like flow
- `media` để phase sau

### Note Block
- Sticky note nhanh, minimal
- AI: convert sang Doc block khi cần expand
- Shortcut: `Ctrl+Space` → tạo note ngay giữa canvas

### Doc Block
- Native doc block để viết nhanh ngay trên canvas
- TipTap rich text editor render trong native ADEOW block
- AI: viết, sửa, format, tóm tắt, dịch
- Export: `.md`, `.docx`
- Header: title + status badge + word count

### Artifact Block
- Card đại diện cho file/tài liệu thực
- Double-click → mở tab mới `/a/[artifactId]`
- Hỗ trợ `docx`, `xlsx`, `pptx`, `pdf form` qua ONLYOFFICE
- Nếu là survey-style form thì route artifact mở builder/renderer của SurveyJS
- Hiện: title, kind badge, owner, last edited, share status
- Có share link riêng cho từng artifact

### Code Block
- Monaco Editor embed
- Linked đến `repo_alias + relative_path`, không lưu absolute path cloud-side
- AI: viết, review, refactor, explain, git commit
- Hiển thị: git status badge, diff view, file tree nhỏ
- Handoff protocol: AI tự snapshot cuối session

### Media Block
- V1 nếu làm chỉ hỗ trợ ảnh/GIF trước; video để sau
- Lưu Cloudflare R2
- AI: caption, describe
- Có quota ngay từ đầu: giới hạn size/file count theo plan, không để "unlimited"

### Link Card Block
- URL → auto-fetch OG metadata
- AI: tóm tắt nội dung

### Canvas Ref Block
- Embed canvas con vào canvas cha
- Double-click → navigate vào canvas con
- Breadcrumb navigation

---

## 9. Folder Structure

```
adeow/
├── app/                              # Next.js App Router
│   ├── page.tsx                      # redirect → /canvas/home
│   ├── (workspace)/
│   │   └── canvas/
│   │       └── [id]/
│   │           └── page.tsx          # main canvas page
│   ├── a/
│   │   └── [id]/
│   │       └── page.tsx              # artifact editor route
│   ├── share/
│   │   └── a/
│   │       └── [token]/
│   │           └── page.tsx          # public/shared artifact route
│   └── api/
│       ├── ai/route.ts               # AI orchestration + streaming
│       ├── artifacts/route.ts        # artifact CRUD
│       ├── canvas/route.ts           # Canvas CRUD
│       ├── document/route.ts         # save/load canvas scene snapshot
│       ├── memory/route.ts           # Memory ops
│       ├── onlyoffice/
│       │   ├── config/[id]/route.ts  # signed editor config
│       │   └── callback/[id]/route.ts# save callback từ ONLYOFFICE
│       ├── share-links/route.ts      # create/revoke artifact links
│       └── snapshots/route.ts        # Session snapshot ops
│
├── components/
│   ├── canvas/
│   │   ├── AdeowCanvasClient.tsx     # client-only canvas runtime wrapper
│   │   ├── CanvasShell.tsx           # compose canvas + topbar + sidebar
│   │   ├── AIPanel.tsx               # slide-in panel bên phải
│   │   ├── Topbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── blocks/
│   │       ├── NoteBlock.tsx         # block component + block state
│   │       ├── DocBlock.tsx
│   │       ├── CodeBlock.tsx
│   │       ├── ArtifactBlock.tsx
│   │       ├── LinkCardBlock.tsx
│   │       └── CanvasRefBlock.tsx
│   ├── artifacts/
│   │   ├── ArtifactEditorShell.tsx
│   │   ├── OnlyOfficeEditor.tsx
│   │   ├── SurveyFormEditor.tsx
│   │   └── ShareDialog.tsx
│   └── ui/                           # Button, Badge, Toast...
│
├── lib/
│   ├── ai/
│   │   ├── soul.ts                   # system prompt
│   │   ├── context-builder.ts        # build context từ canvas state
│   │   ├── tool-definitions.ts       # tool call schemas
│   │   ├── tool-executor.ts          # execute tool calls
│   │   ├── heartbeat.ts              # active-session assistant
│   │   └── providers/
│   │       ├── openai.ts             # default provider adapter
│   │       └── experimental-codex.ts # optional adapter sau POC
│   ├── supabase/
│   │   ├── client.ts                 # browser client
│   │   └── server.ts                 # server client
│   ├── artifacts/
│   │   ├── service.ts                # artifact CRUD + storage metadata
│   │   ├── share-links.ts            # signed/public link logic
│   │   └── viewers.ts                # map artifact kind -> editor route
│   ├── onlyoffice/
│   │   ├── config.ts                 # build ONLYOFFICE editor config
│   │   ├── jwt.ts                    # sign ONLYOFFICE token/JWT
│   │   └── callback.ts               # persist saved doc versions
│   ├── canvas-core/
│   │   ├── document.ts               # scene snapshot helpers
│   │   ├── persistence.ts            # local-first save queue
│   │   └── scene.ts                  # block/element registry
│   ├── search/
│   │   └── retrieval.ts              # recall blocks/memories
│   └── sidecar/
│       └── client.ts                 # HTTP client → localhost:27107
│
├── vendor/
│   └── excalidraw/                   # nơi đặt fork / upstream sync notes
│
├── sidecar/                          # chạy riêng: node sidecar/index.js
│   ├── index.js
│   └── routes/
│       ├── health.js                 # health check
│       ├── repos.js                  # register/list allowed repos
│       ├── files.js                  # read/write inside allowlisted repos
│       ├── git.js                    # git operations
│       └── terminal.js               # preset commands only
│
├── supabase/
│   └── migrations/
│       └── 001_init.sql              # schema ban đầu + RLS
│
├── public/
├── middleware.ts                     # protect workspace routes
└── .env.local
```

---

## 10. Design System

### Theme — Dark Only
```css
--bg:       #0d0e10   /* page background */
--surface:  #13151a   /* cards, panels */
--surface2: #1a1d24   /* inputs, hover states */
--border:   #2a2d38   /* tất cả borders */
--accent:   #6c63ff   /* primary action, selected */
--accent2:  #00e5c0   /* secondary accent, git clean, success */
--text:     #e8e9ed   /* primary text */
--muted:    #6b7080   /* secondary text, labels */
--danger:   #f87171   /* errors, destructive */
--warning:  #fbbf24   /* warnings, draft status */
```

### Typography
```css
--font-display: 'Syne', sans-serif        /* headings, UI labels, canvas title */
--font-mono:    'JetBrains Mono', mono    /* code, badges, timestamps, file paths */
```

### Block Visual Language
Mỗi block type có màu accent riêng để nhận ra ngay trên canvas:
```
note:   #1e1e2a + icon 📌 (yellow)
doc:    #1e2438 + icon 📄 (blue)
code:   #1a2218 + icon ⌨️  (green)
artifact:#182338 + icon 🗂️  (cyan)
media:  #221a1a + icon 🖼️  (red)
```

### UX Principles
- **Không bao giờ block UI** — mọi thứ save local trước, sync background
- **Spatial memory** — vị trí block trên canvas là thông tin (blocks liên quan nằm gần nhau)
- **Progressive disclosure** — block hiện info tối giản, hover/focus mới hiện detail
- **AI là overlay** — AI panel không chiếm space canvas, slide-in khi cần
- **Keyboard-first** — `Ctrl+Space` quick capture, `J` toggle AI panel, `B` brief me

---

## 11. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_PROJECT_ID=
NEXT_PUBLIC_SIDECAR_URL=http://localhost:27107
SIDECAR_SHARED_SECRET=
APP_ENCRYPTION_KEY=
ONLYOFFICE_DOCUMENT_SERVER_URL=
ONLYOFFICE_JWT_SECRET=
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=adeow-media

# Optional docs/form modules
SURVEYJS_LICENSE_KEY=

# Optional / experimental
CODEX_AUTH_STORAGE_PATH=
CODEX_SESSION_PROFILE=default
```

**Lưu ý:** V1 mặc định dùng `OPENAI_API_KEY` ở server. `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng cho admin/background jobs; route handler bình thường nên đi qua user-scoped client + RLS. `ONLYOFFICE_*` dùng để ký config/callback giữa app và Document Server. `CODEX_*` chỉ là biến optional cho adapter thử nghiệm.

---

## 12. Build Phases & Checklist

> Agent: đọc từng phase theo thứ tự. Không làm phase N+1 khi phase N chưa pass **Definition of Done**.  
> Khi sắp hết context: commit, tạo `HANDOFF.md`, dừng lại.

---

### PHASE 0 — Project Setup
**Mục tiêu:** Repo sạch, app chạy được, infra ready.

```
[ ] Tạo Next.js app:
      npx create-next-app@latest adeow --ts --tailwind --app
      cd adeow
      npm install @excalidraw/excalidraw

[ ] Tạo `vendor/excalidraw` strategy:
      - quyết định fork upstream hay vendor package source
      - lưu rõ upstream repo URL + commit hash + LICENSE
      - không sửa trực tiếp package trong node_modules

[ ] Tạo client-only canvas shell:
      - render canvas runtime trong component có `'use client'`
      - nếu cần, bọc bằng `dynamic(..., { ssr: false })`
      - route `/canvas/[id]` phải sống được cả khi fork chưa import xong bằng placeholder canvas nội bộ

[ ] Verify canvas render:
      npm run dev → localhost:3000 → thấy canvas = OK
      QUAN TRỌNG: nếu blank trắng → kiểm tra container có explicit size chưa

[ ] Tạo folder structure theo mục 9

[ ] Setup Supabase:
      npm install @supabase/supabase-js @supabase/ssr
      Tạo project tại supabase.com
      Chạy migration 001_init.sql (SQL ở cuối file này)

[ ] Setup .env.local với tất cả variables

[ ] Pin exact versions trong lockfile

[ ] Dọn repo sạch trước khi làm tiếp:
      - không bắt đầu Phase 1 nếu worktree đang lẫn scaffold/thư mục test không dùng

[ ] Deploy lên Vercel (để có URL sớm)

[ ] Commit: "feat: init project"
```

**Definition of Done:** `npm run dev` → canvas render đúng trong Next.js, không lỗi SSR/hydration, không lỗi console, không còn phụ thuộc canvas SDK cũ.

---

### PHASE 1 — Canvas Core + Local-First Persistence
**Mục tiêu:** Canvas chạy local-first, có Note block, auth/sync rõ ràng.

```
[ ] Setup auth boundary:
      - Supabase Auth
      - middleware bảo vệ workspace routes
      - tất cả data đều gắn `user_id`

[ ] Custom Note block:
      - define native block schema `type = 'note'`
      - default props: title, content, status
      - render React component trong canvas engine
      - selected state + resize handles rõ ràng

[ ] Canvas CRUD API (app/api/canvas/route.ts):
      GET    /api/canvas         → list canvases
      POST   /api/canvas         → tạo mới
      PATCH  /api/canvas/[id]    → update title/context
      DELETE /api/canvas/[id]    → xoá

[ ] Document save/load:
      - dùng scene snapshot làm nguồn persistence
      - save local trước (IndexedDB / browser persistence)
      - debounce 2s → sync document snapshot lên Supabase `canvas_documents`
      - load local snapshot trước, cloud sync sau
      - show "saving..." / "✓ saved" indicator trên topbar

[ ] Block context index:
      - tạo `block_contexts` record cho Note block
      - lưu metadata AI cần, không lưu duplicated shape geometry

[ ] Sidebar: danh sách canvases, tạo mới, switch

[ ] Topbar: logo "Adeow", canvas name, tab nếu nhiều canvas

[ ] Dark theme áp dụng đúng (xem Design System mục 10)
```

**Definition of Done:** Tạo canvas → add note → đóng tab → mở lại khi offline vẫn còn; online lại thì sync lên cloud thành công.

---

### PHASE 2 — Doc Block + AI Layer + Memory
**Mục tiêu:** AI đọc canvas context trong cloud mode, edit được note/doc, nhớ working history.

```
[ ] Doc Block:
      npm install @tiptap/react @tiptap/starter-kit
      TipTap render trong native Doc block
      Toolbar: bold, italic, heading, bullet list, code
      Export: copy markdown, download .md

[ ] Soul (lib/ai/soul.ts): system prompt cố định (xem mục 7)

[ ] Context Builder (lib/ai/context-builder.ts):
      Input: canvasId + focusedShapeId
      Output: string <8000 tokens
      Gồm: canvas overview + scene excerpt + block contexts + memories + last snapshot

[ ] Tool Definitions (lib/ai/tool-definitions.ts):
      canvas tools: create_shape, update_shape, upsert_block_context, search_block_contexts
      memory tools: save_memory, update_session_snapshot

[ ] Tool Executor (lib/ai/tool-executor.ts):
      Handle từng tool call từ provider response
      Execute → update canvas scene store hoặc Supabase

[ ] AI API route (app/api/ai/route.ts):
      POST với streaming response
      Runtime: OpenAI Responses API qua provider adapter
      Auth: server-side `OPENAI_API_KEY`
      Handle tool calls trong stream

[ ] AI Panel UI (components/canvas/AIPanel.tsx):
      Slide-in từ phải, width 280px
      Toggle: phím J hoặc button topbar
      Messages: AI / User bubbles
      "Brief me" button
      "Snapshot" button

[ ] Memory API (app/api/memory/route.ts):
      save: POST memory entry
      recall: GET với full-text / trigram search query

[ ] Session Snapshot:
      Tạo khi user gõ "save session" hoặc idle 30 phút
      Load và display khi mở canvas (last snapshot date + summary)
```

**Definition of Done:** Đóng canvas → mở lại → "Brief me" → AI nói được đang làm gì.

---

### PHASE 3 — Artifact Docs System
**Mục tiêu:** Có hệ thống docs/file thật kiểu Google Docs: add block vào canvas, double-click mở tab riêng, edit/share được.

```
[ ] Artifact model + APIs:
      - table `artifacts`
      - table `artifact_share_links`
      - route `/api/artifacts`
      - route `/api/share-links`

[ ] Artifact Block:
      - add block type `artifact`
      - card hiển thị title, kind, last edited, share badge
      - double-click → `window.open('/a/[artifactId]', '_blank')`

[ ] ONLYOFFICE integration:
      npm install @onlyoffice/document-editor-react
      - route `/a/[id]` render editor shell
      - `/api/onlyoffice/config/[id]` trả signed config
      - `/api/onlyoffice/callback/[id]` nhận save callback và update file trong storage
      - map file types: `docx -> word`, `xlsx -> cell`, `pptx -> slide`, `pdf form -> pdf`

[ ] New artifact actions:
      - New Doc
      - New Sheet
      - New Slides
      - New Fillable Form
      - Import existing file

[ ] Share flow:
      - tạo share link `view/comment/edit/fill`
      - route `/share/a/[token]`
      - optional expire/revoke/download policy

[ ] Survey forms:
      - nếu cần Google Forms-like flow, tạo artifact kind `survey_form`
      - editor/renderer dùng SurveyJS ở route artifact riêng
```

**Definition of Done:** Add 1 artifact block vào canvas → double-click mở tab editor riêng → sửa file → reload vẫn thấy bản mới → share link mở được đúng quyền.

---

### PHASE 4 — Sidecar Foundation + Secure Repo Registry
**Mục tiêu:** Sidecar đủ an toàn để mở đường cho filesystem/git, nhưng chưa vội expose quá tay.

```
[ ] Sidecar (sidecar/index.js):
      Express server port 27107
      Security:
        - chỉ accept localhost requests
        - shared secret giữa app và sidecar
        - origin allowlist
      Routes: /health, /repos, /api/files, /api/git, /api/terminal

[ ] Sidecar routes:
      repos.js:    POST /register {alias, rootPath}, GET /list
      files.js:    GET /read?repo=&path=, POST /write {repo, path, content}
      git.js:      GET /status?repo=, GET /diff?repo=,
                   POST /commit {repo, message}, POST /push {repo}
      terminal.js: POST /run {repo, command, args}
                   Allowlist/preset commands only, không nhận raw shell string mặc định

[ ] Sidecar client (lib/sidecar/client.ts):
      sidecarAvailable(): ping /health, timeout 500ms
      listRepos(), registerRepo(alias, rootPath)
      readFile(repo, path), writeFile(repo, path, content)
      gitCommit(repo, message), gitDiff(repo), gitStatus(repo)

[ ] Detect sidecar trong app:
      Check khi canvas mount
      Show "● sidecar connected" / "○ cloud mode" trên topbar
      Show số repo đã register

[ ] Add sidecar tools vào AI khi detected:
      list_registered_repos, read_file, write_file, git_commit, git_diff, git_push, run_terminal
```

**Definition of Done:** Register 1 repo local → app đọc file trong repo đó được → request ngoài repo bị chặn đúng.

---

### PHASE 5 — Code Block + Git Workflow
**Mục tiêu:** Code block dùng sidecar an toàn để đọc/ghi file thật, review diff, commit có kiểm soát.

```
[ ] Code Block (components/canvas/blocks/CodeBlock.tsx):
      Monaco Editor embed (@monaco-editor/react)
      Header: repo alias, relative path, language, git status badge
      Field: linked repo alias + relative path
      Git status: "✓ clean" / "● 3 changes" / "↑ 2 ahead"
      Diff view: hiện unified diff sau khi AI edit

[ ] Write flow:
      - AI đề xuất patch
      - UI hiện diff preview
      - user approve rồi mới write/commit/push nếu policy yêu cầu

[ ] Handoff Protocol:
      Cuối session: AI chạy git_diff → generate handoff note → update_session_snapshot
      Trigger: user gõ "save session"
      Đầu session: AI đọc snapshot → brief trong 3 bullets
```

**Definition of Done:** Nói "thêm console.log vào file X" → AI tạo diff → approve → file được sửa đúng → git commit thành công.

---

### PHASE 6 — Nested Canvas + Quick Capture + Active-Session Heartbeat
**Mục tiêu:** UX hoàn thiện hơn nhưng không giả vờ có background agent khi chưa có nền thật.

```
[ ] Quick Capture:
      Global listener: Ctrl+Space
      Floating input overlay (không đóng canvas)
      Enter → tạo Note block giữa current viewport
      Esc → dismiss
      Implement qua canvas viewport store + window keydown

[ ] Canvas Ref Block:
      Hiện: canvas name, block count, last updated
      Double-click → navigate vào canvas con
      Back button → canvas cha
      Breadcrumb: "DSUC > Planning > Sprint 1"

[ ] Nested canvas logic:
      Khi tạo canvas mới từ bên trong → set parent_canvas_id
      Sidebar hiện hierarchy dạng tree

[ ] Heartbeat (lib/ai/heartbeat.ts):
      V1 = active-session assistant, không claim background agent 24/7
      Chạy khi app đang mở hoặc sidecar đang chạy
      Checks:
        - Blocks status 'in_progress' không update > 3 ngày → notify
        - Session snapshot không có > 24 giờ → remind
        - canonical_name đụng nhau → flag duplicate
      Toast notification với action button

[ ] Polish:
      Smooth animation transitions
      Keyboard shortcut map (?, J, B, Ctrl+Space)
      Empty state khi canvas trống
      Performance: canvas engine với 100+ blocks không lag
```

**Definition of Done:** App mở lên tự nhắc đúng stale block/snapshot trong session đang active, quick capture tạo note đúng viewport hiện tại.

---

### PHASE 7 — Optional Blocks Sau Khi Core Ổn
**Mục tiêu:** Chỉ mở rộng scope khi 6 phase đầu đã ổn định.

```
[ ] Sheet Block:
      - Chỉ bắt đầu khi chốt được package open-source
      - Scope đầu tiên = grid tối giản + export CSV

[ ] Media Block:
      - Ảnh/GIF trước, video sau
      - Quota + upload limits + thumbnail generation

[ ] Experimental Codex adapter:
      - Làm POC riêng
      - Chỉ merge vào main flow nếu chứng minh được auth/session ổn định
```

---

## 13. Handoff Protocol cho Agent

**Khi sắp hết context (làm trước khi bị cut off):**

1. Commit những gì đã xong: `git commit -m "wip: [phase] - [đã làm gì]"`
2. Tạo file `HANDOFF.md` trong root:

```markdown
## Đang làm: [phase + task cụ thể]
## Đã xong: 
- [ ]
## Chưa xong:
- [ ]
## Files đã sửa:
- 
## Vấn đề gặp phải:
- 
## Bước tiếp theo (cụ thể):
1. 
```

3. Kết thúc. Session tiếp theo đọc `HANDOFF.md` trước khi làm gì.

---

## 14. Database Migration

Chạy SQL này trong Supabase SQL Editor khi setup Phase 0:

```sql
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Canvases
create table canvases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  description text,
  project_context text not null default '',
  parent_canvas_id uuid references canvases(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- canvas scene snapshots
create table canvas_documents (
  canvas_id uuid primary key references canvases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  document jsonb not null default '{}'::jsonb,
  schema_version text not null default 'adeow-excalidraw-fork',
  updated_at timestamptz not null default now()
);

-- Artifacts: office docs, forms, media, files
create table artifacts (
  id uuid primary key default gen_random_uuid(),
  canvas_id uuid not null references canvases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  editor_provider text not null default 'onlyoffice',
  title text not null,
  summary text,
  mime_type text not null,
  file_ext text not null,
  storage_key text not null,
  byte_size bigint,
  latest_version integer not null default 1,
  preview_image_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artifacts_kind_check
    check (kind in ('doc', 'sheet', 'slides', 'fillable_form', 'survey_form', 'media', 'file')),
  constraint artifacts_editor_provider_check
    check (editor_provider in ('onlyoffice', 'surveyjs', 'native', 'external'))
);

create table artifact_share_links (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references artifacts(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  access text not null,
  allow_download boolean not null default false,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint artifact_share_links_access_check
    check (access in ('view', 'comment', 'edit', 'fill'))
);

-- AI-readable metadata for each shape/block
create table block_contexts (
  id uuid primary key default gen_random_uuid(),
  canvas_id uuid not null references canvases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  shape_id text not null,
  type text not null,
  canonical_name text,
  purpose text not null default '',
  status text not null default 'draft',
  summary text,
  linked_artifact_id uuid references artifacts(id) on delete set null,
  linked_repo_alias text,
  linked_file_path text,
  metadata jsonb not null default '{}'::jsonb,
  decision_log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint block_contexts_status_check
    check (status in ('draft', 'in_progress', 'review', 'approved', 'archived')),
  constraint block_contexts_canvas_shape_unique
    unique (canvas_id, shape_id)
);

create table block_links (
  id uuid primary key default gen_random_uuid(),
  canvas_id uuid not null references canvases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_shape_id text not null,
  to_shape_id text not null,
  relationship text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'global',
  scope_ref text,
  type text not null,
  content text not null,
  confidence float not null default 0.8,
  source text not null default 'user',
  created_at timestamptz not null default now(),
  last_accessed timestamptz not null default now(),
  constraint memories_scope_check
    check (scope in ('global', 'canvas', 'block')),
  constraint memories_confidence_check
    check (confidence >= 0 and confidence <= 1)
);

create table session_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  canvas_id uuid not null references canvases(id) on delete cascade,
  summary text not null,
  active_shape_ids text[] not null default '{}'::text[],
  next_steps text[] not null default '{}'::text[],
  open_questions text[] not null default '{}'::text[],
  repo_summaries jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Triggers
create trigger canvases_set_updated_at
before update on canvases
for each row execute procedure set_updated_at();

create trigger canvas_documents_set_updated_at
before update on canvas_documents
for each row execute procedure set_updated_at();

create trigger artifacts_set_updated_at
before update on artifacts
for each row execute procedure set_updated_at();

create trigger block_contexts_set_updated_at
before update on block_contexts
for each row execute procedure set_updated_at();

-- Indexes
create index canvases_user_id_idx on canvases(user_id);
create index canvases_parent_canvas_id_idx on canvases(parent_canvas_id);

create index canvas_documents_user_id_idx on canvas_documents(user_id);

create index artifacts_canvas_id_idx on artifacts(canvas_id);
create index artifacts_user_id_idx on artifacts(user_id);
create index artifacts_kind_idx on artifacts(kind);

create index artifact_share_links_artifact_id_idx on artifact_share_links(artifact_id);
create index artifact_share_links_token_idx on artifact_share_links(token);

create index block_contexts_canvas_id_idx on block_contexts(canvas_id);
create index block_contexts_user_id_idx on block_contexts(user_id);
create index block_contexts_canonical_name_idx
  on block_contexts(canonical_name)
  where canonical_name is not null;
create index block_contexts_search_idx
  on block_contexts
  using gin ((coalesce(canonical_name, '') || ' ' || purpose || ' ' || coalesce(summary, '')) gin_trgm_ops);

create index block_links_canvas_id_idx on block_links(canvas_id);

create index memories_user_id_idx on memories(user_id);
create index memories_scope_idx on memories(scope, scope_ref);
create index memories_content_search_idx on memories using gin (content gin_trgm_ops);

create index session_snapshots_canvas_id_idx on session_snapshots(canvas_id);
create index session_snapshots_user_id_idx on session_snapshots(user_id);

-- RLS
alter table canvases enable row level security;
alter table canvas_documents enable row level security;
alter table artifacts enable row level security;
alter table artifact_share_links enable row level security;
alter table block_contexts enable row level security;
alter table block_links enable row level security;
alter table memories enable row level security;
alter table session_snapshots enable row level security;

create policy "users_manage_own_canvases"
  on canvases for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_manage_own_canvas_documents"
  on canvas_documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_manage_own_artifacts"
  on artifacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_manage_own_artifact_share_links"
  on artifact_share_links for all
  using (
    exists (
      select 1 from artifacts
      where artifacts.id = artifact_share_links.artifact_id
        and artifacts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from artifacts
      where artifacts.id = artifact_share_links.artifact_id
        and artifacts.user_id = auth.uid()
    )
  );

create policy "users_manage_own_block_contexts"
  on block_contexts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_manage_own_block_links"
  on block_links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_manage_own_memories"
  on memories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_manage_own_session_snapshots"
  on session_snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table canvases;
alter publication supabase_realtime add table canvas_documents;
alter publication supabase_realtime add table artifacts;
alter publication supabase_realtime add table block_contexts;
```

---

*ADEOW v1.0 — Cập nhật file này khi có quyết định kiến trúc mới. Không xoá, chỉ append.*
