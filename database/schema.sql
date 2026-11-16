-- THE DEAL: authoritative room aggregate; optimistic compare-and-swap version.
-- Private application data: accessible exclusively from server-side service role.
create table if not exists public.deal_rooms (
 code text primary key check (code ~ '^[A-F0-9]{8}$'),
 version bigint not null default 0,
 state jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.deal_rooms enable row level security;
revoke all on public.deal_rooms from anon, authenticated;
grant select, insert, update, delete on public.deal_rooms to service_role;
-- No public policies by design. State is filtered by authenticated server roles.
-- Votes are a unique map keyed by team ID within one versioned room transaction.
-- No scores, answers, tokens or private events are readable through the public API.
