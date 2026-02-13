-- initial template schema
create table if not exists work_items (
  id text primary key,
  source text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
