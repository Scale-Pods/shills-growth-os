-- =============================================================
-- 22_users_auth.sql
-- Grants the API (service role) access to public.users and seeds
-- the two operator accounts with PBKDF2-hashed passwords.
--
-- Run this in the Salon CRM Supabase project → SQL Editor.
-- The `users` table itself already exists:
--   create table public.users (
--     id uuid primary key default gen_random_uuid(),
--     email text not null unique,
--     password_hash text not null,
--     full_name text,
--     created_at timestamptz default now(),
--     passwords_changed_at timestamptz default now(),
--     otp_code text,
--     otp_expires_at timestamptz
--   );
-- =============================================================

-- 1. Let the service role (used by /api/auth/login) read/write the table.
grant select, insert, update, delete on public.users to service_role;

-- 2. RLS: enabled, service_role bypasses it, but add an explicit deny-all
--    for anon/authenticated so the anon key can never read password hashes.
alter table public.users enable row level security;

drop policy if exists "no anon access to users" on public.users;
create policy "no anon access to users"
  on public.users
  for all
  to anon, authenticated
  using (false)
  with check (false);

-- 3. Seed / update the two operator accounts.
--    Hash format: pbkdf2$<iterations>$<saltB64>$<hashB64>  (see src/lib/auth.ts)
insert into public.users (email, password_hash, full_name, passwords_changed_at)
values
  (
    'info@scalepods.co',
    'pbkdf2$120000$tEO6oTE+bkKxbuF6nfHcQA==$7fOFryMmkZMwioPBbyXOqAaZW7Uax0SmQLntpGomZDk=',
    'ScalePods Admin',
    now()
  ),
  (
    'shillsp01@gmail.com',
    'pbkdf2$120000$MpB9Up8+3eowvNAAPZq15A==$N8vxmXInWEHZIyiNr2NnKkoowfqZPXJn3Uy5ZZOYBcg=',
    'Shills Professional',
    now()
  )
on conflict (email) do update
  set password_hash        = excluded.password_hash,
      full_name            = excluded.full_name,
      passwords_changed_at  = now();

-- Verify
select email, full_name, left(password_hash, 16) || '…' as hash_prefix, created_at
from public.users
order by created_at;
