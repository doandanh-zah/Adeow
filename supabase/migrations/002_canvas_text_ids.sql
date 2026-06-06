alter table canvas_documents drop constraint canvas_documents_canvas_id_fkey;
alter table artifacts drop constraint artifacts_canvas_id_fkey;
alter table block_contexts drop constraint block_contexts_canvas_id_fkey;
alter table block_links drop constraint block_links_canvas_id_fkey;
alter table session_snapshots drop constraint session_snapshots_canvas_id_fkey;
alter table canvases drop constraint canvases_parent_canvas_id_fkey;

alter table canvases alter column id drop default;
alter table canvases alter column id type text using id::text;
alter table canvases alter column id set default gen_random_uuid()::text;

alter table canvases
  alter column parent_canvas_id type text using parent_canvas_id::text;
alter table canvas_documents
  alter column canvas_id type text using canvas_id::text;
alter table artifacts
  alter column canvas_id type text using canvas_id::text;
alter table block_contexts
  alter column canvas_id type text using canvas_id::text;
alter table block_links
  alter column canvas_id type text using canvas_id::text;
alter table session_snapshots
  alter column canvas_id type text using canvas_id::text;

alter table canvas_documents
  add constraint canvas_documents_canvas_id_fkey
  foreign key (canvas_id) references canvases(id) on delete cascade;

alter table artifacts
  add constraint artifacts_canvas_id_fkey
  foreign key (canvas_id) references canvases(id) on delete cascade;

alter table block_contexts
  add constraint block_contexts_canvas_id_fkey
  foreign key (canvas_id) references canvases(id) on delete cascade;

alter table block_links
  add constraint block_links_canvas_id_fkey
  foreign key (canvas_id) references canvases(id) on delete cascade;

alter table session_snapshots
  add constraint session_snapshots_canvas_id_fkey
  foreign key (canvas_id) references canvases(id) on delete cascade;

alter table canvases
  add constraint canvases_parent_canvas_id_fkey
  foreign key (parent_canvas_id) references canvases(id) on delete set null;
