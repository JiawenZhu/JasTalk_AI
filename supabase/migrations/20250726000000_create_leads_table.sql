-- Leads table for email capture and attribution
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text,
  ref text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Allow inserts from anon (website) but not selects
create policy "Allow anonymous inserts into leads" on public.leads
  for insert
  to anon
  with check (true);

-- Optional: allow service role to read
-- This is implicit for service key; do not expose select to anon/auth users

create index if not exists idx_leads_created_at on public.leads(created_at);
create index if not exists idx_leads_email on public.leads(email);


