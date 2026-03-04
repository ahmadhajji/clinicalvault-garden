-- Notes synced from Google Drive ingest
create table if not exists notes (
  slug text primary key,
  title text not null,
  tags jsonb not null default '[]'::jsonb,
  excerpt text not null default '',
  content text not null default '',
  permalink text,
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  frontmatter jsonb not null default '{}'::jsonb,
  video_embed jsonb,
  source_file_id text,
  source_modified_time timestamptz,
  last_ingested_at timestamptz not null default now()
);

create unique index if not exists notes_source_file_id_unique on notes(source_file_id) where source_file_id is not null;
create index if not exists notes_published_updated_idx on notes(published, updated_at desc);

-- Comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  note_slug text not null references notes(slug) on delete cascade,
  author_user_id uuid not null,
  author_name text not null,
  body_markdown text not null,
  status text not null check (status in ('visible', 'flagged', 'rejected')),
  toxicity_score numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists comments_note_slug_created_idx on comments(note_slug, created_at desc);
create index if not exists comments_status_idx on comments(status);

-- Comment events / moderation telemetry
create table if not exists comment_events (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references comments(id) on delete cascade,
  note_slug text not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Drive sync state
create table if not exists sync_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Dead letters for ingest failures
create table if not exists ingest_dead_letters (
  id uuid primary key default gen_random_uuid(),
  source_file_id text,
  file_name text,
  reason text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
