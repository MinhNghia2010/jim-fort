-- Import the existing app accounts into Supabase Auth.
-- The Auth user id is intentionally the same as public.users.id so auth.uid()
-- can be used directly against app-owned user rows in future RLS policies.

insert into auth.users as target (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
select
  u.id,
  'authenticated',
  'authenticated',
  lower(a.email),
  a.password_hash,
  now(),
  jsonb_build_object(
    'provider', 'email',
    'providers', array['email'],
    'app_role', u.role
  ),
  jsonb_build_object(
    'sub', u.id::text,
    'email', lower(a.email),
    'email_verified', true,
    'phone_verified', false,
    'full_name', u.full_name,
    'role', u.role
  ),
  false,
  coalesce(u.created_at, now()),
  now(),
  false,
  false
from public.users u
join public.accounts a on a.id = u.account_id
where a.status = 'active'
  and a.email is not null
  and a.password_hash is not null
on conflict (id) do update
set
  aud = excluded.aud,
  role = excluded.role,
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(target.email_confirmed_at, excluded.email_confirmed_at),
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now(),
  is_sso_user = false,
  is_anonymous = false;

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', lower(a.email),
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now()
from public.users u
join public.accounts a on a.id = u.account_id
join auth.users au on au.id = u.id
where a.status = 'active'
  and a.email is not null
  and a.password_hash is not null
on conflict (provider_id, provider) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();
