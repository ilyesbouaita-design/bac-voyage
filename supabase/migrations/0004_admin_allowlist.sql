-- ============================================================
-- BacAllemand — Admin allowlist
-- Emails listed here automatically become 'admin' on signup,
-- and any matching existing account is promoted immediately.
-- ============================================================

create table if not exists public.admin_emails (
  email      text primary key,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.admin_emails to authenticated;
alter table public.admin_emails enable row level security;

-- Only admins can view/manage the allowlist (the signup trigger reads it
-- via SECURITY DEFINER, so it works regardless of RLS).
create policy "admin_emails_admin_all" on public.admin_emails
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Seed the first admin
insert into public.admin_emails(email) values ('ilyesbouaita@gmail.com')
  on conflict (email) do nothing;

-- Signup handler now honors the allowlist
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role public.user_role := 'student';
begin
  if exists (
    select 1 from public.admin_emails a
    where lower(a.email) = lower(coalesce(new.email, ''))
  ) then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, display_name, locale, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,''), '@', 1)),
    'fr',
    v_role
  )
  on conflict (id) do nothing;

  return new;
end; $$;

-- Keep this trigger function off the public RPC surface
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Promote the account now if it already exists
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('ilyesbouaita@gmail.com');
