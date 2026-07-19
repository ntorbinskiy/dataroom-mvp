-- Docket cloud schema. Run once in the Supabase SQL editor.

create table public.datarooms (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nodes (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dataroom_id uuid not null references public.datarooms (id) on delete cascade,
  parent_id uuid null references public.nodes (id) on delete cascade,
  type text not null check (type in ('folder', 'file')),
  name text not null,
  mime_type text null,
  size bigint null,
  blob_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index nodes_dataroom_id_idx on public.nodes (dataroom_id);

alter table public.datarooms enable row level security;
alter table public.nodes enable row level security;

create policy "own datarooms" on public.datarooms
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own nodes" on public.nodes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', false);

create policy "own pdf objects" on storage.objects
  for all using (
    bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text
  );
