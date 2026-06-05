create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

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

create table canvas_documents (
  canvas_id uuid primary key references canvases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  document jsonb not null default '{}'::jsonb,
  schema_version text not null default 'adeow-excalidraw-fork',
  updated_at timestamptz not null default now()
);

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

alter publication supabase_realtime add table canvases;
alter publication supabase_realtime add table canvas_documents;
alter publication supabase_realtime add table artifacts;
alter publication supabase_realtime add table block_contexts;
