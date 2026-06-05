create schema if not exists private;

create or replace function private.is_current_user_facility_owner(facility_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.gym_facilities gf
    where gf.id = $1
      and gf.owner_id = (select auth.uid())
  );
$$;

create or replace function private.current_user_has_facility_membership(facility_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.membership_subscriptions ms
    where ms.facility_id = $1
      and ms.member_id = (select auth.uid())
  );
$$;

create or replace function private.is_current_user_subscription_facility_manager(subscription_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.membership_subscriptions ms
    join public.facility_managers fm on fm.facility_id = ms.facility_id
    where ms.id = $1
      and fm.manager_id = (select auth.uid())
  );
$$;

create or replace function private.is_current_user_subscription_facility_owner(subscription_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.membership_subscriptions ms
    join public.gym_facilities gf on gf.id = ms.facility_id
    where ms.id = $1
      and gf.owner_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_current_user_facility_owner(uuid)
from public, anon, authenticated, service_role;

revoke execute on function private.current_user_has_facility_membership(uuid)
from public, anon, authenticated, service_role;

revoke execute on function private.is_current_user_subscription_facility_manager(uuid)
from public, anon, authenticated, service_role;

revoke execute on function private.is_current_user_subscription_facility_owner(uuid)
from public, anon, authenticated, service_role;

create table if not exists public.facility_feedbacks (
  id uuid primary key default extensions.gen_random_uuid(),
  facility_id uuid not null
    references public.gym_facilities(id)
    on delete cascade,
  member_id uuid not null
    references public.users(id),
  subject text not null,
  message text not null,
  rating integer,
  status text not null default 'open',
  manager_response text,
  responded_by_manager_id uuid
    references public.users(id)
    on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint facility_feedbacks_subject_not_blank
    check (length(trim(subject)) > 0),
  constraint facility_feedbacks_message_not_blank
    check (length(trim(message)) > 0),
  constraint facility_feedbacks_rating_valid
    check (rating is null or rating between 1 and 5),
  constraint facility_feedbacks_status_valid
    check (status in ('open', 'in_review', 'responded', 'closed')),
  constraint facility_feedbacks_response_not_blank
    check (manager_response is null or length(trim(manager_response)) > 0),
  constraint facility_feedbacks_response_fields_consistent
    check (
      (
        manager_response is null
        and responded_by_manager_id is null
        and responded_at is null
      )
      or
      (
        manager_response is not null
        and responded_by_manager_id is not null
        and responded_at is not null
      )
    ),
  constraint facility_feedbacks_responded_status_has_response
    check (status <> 'responded' or manager_response is not null)
);

comment on table public.facility_feedbacks is
  'Member feedback about a gym facility. Managers and owners of that facility can read and respond.';
comment on column public.facility_feedbacks.status is
  'Feedback lifecycle: open, in_review, responded, or closed.';
comment on column public.facility_feedbacks.manager_response is
  'Response sent by a manager or owner to the member feedback.';

create table if not exists public.pt_session_feedbacks (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null
    references public.membership_pt_sessions(id)
    on delete cascade,
  subscription_id uuid not null
    references public.membership_subscriptions(id)
    on delete cascade,
  member_id uuid not null
    references public.users(id),
  pt_id uuid not null
    references public.users(id),
  feedback text not null,
  rating integer,
  next_steps text,
  status text not null default 'sent',
  sent_at timestamptz not null default now(),
  member_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pt_session_feedbacks_session_unique
    unique (session_id),
  constraint pt_session_feedbacks_feedback_not_blank
    check (length(trim(feedback)) > 0),
  constraint pt_session_feedbacks_next_steps_not_blank
    check (next_steps is null or length(trim(next_steps)) > 0),
  constraint pt_session_feedbacks_rating_valid
    check (rating is null or rating between 1 and 5),
  constraint pt_session_feedbacks_status_valid
    check (status in ('sent', 'read', 'archived')),
  constraint pt_session_feedbacks_read_status_has_timestamp
    check (status <> 'read' or member_read_at is not null)
);

comment on table public.pt_session_feedbacks is
  'Feedback sent by a PT to a member for one dated PT session.';
comment on column public.pt_session_feedbacks.session_id is
  'One PT feedback record is allowed per PT session.';

create or replace function private.ensure_facility_feedback_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  respondent_role text;
  response_changed boolean := false;
begin
  if not exists (
    select 1
    from public.users u
    where u.id = new.member_id
      and u.role = 'member'
  ) then
    raise exception 'facility_feedbacks.member_id must reference a member user';
  end if;

  if not exists (
    select 1
    from public.membership_subscriptions ms
    where ms.facility_id = new.facility_id
      and ms.member_id = new.member_id
  ) then
    raise exception 'member must have a subscription history with the feedback facility';
  end if;

  if tg_op = 'UPDATE' then
    if new.facility_id <> old.facility_id
      or new.member_id <> old.member_id
    then
      raise exception 'facility feedback facility_id and member_id cannot be changed';
    end if;
  end if;

  if new.manager_response is not null then
    if tg_op = 'INSERT' then
      response_changed := true;
    else
      response_changed :=
        new.manager_response is distinct from old.manager_response
        or new.responded_by_manager_id is distinct from old.responded_by_manager_id;
    end if;

    if response_changed then
      if (select auth.uid()) is not null then
        new.responded_by_manager_id := (select auth.uid());
      end if;

      if new.responded_at is null or response_changed then
        new.responded_at := now();
      end if;

      if new.status in ('open', 'in_review') then
        new.status := 'responded';
      end if;
    end if;
  end if;

  if new.manager_response is null then
    new.responded_by_manager_id := null;
    new.responded_at := null;
  end if;

  if new.responded_by_manager_id is not null then
    select role
    into respondent_role
    from public.users
    where id = new.responded_by_manager_id;

    if respondent_role not in ('manager', 'owner') then
      raise exception 'responded_by_manager_id must reference a manager or owner user';
    end if;

    if respondent_role = 'manager'
      and not exists (
        select 1
        from public.facility_managers fm
        where fm.facility_id = new.facility_id
          and fm.manager_id = new.responded_by_manager_id
      )
    then
      raise exception 'responding manager must manage the feedback facility';
    end if;

    if respondent_role = 'owner'
      and not exists (
        select 1
        from public.gym_facilities gf
        where gf.id = new.facility_id
          and gf.owner_id = new.responded_by_manager_id
      )
    then
      raise exception 'responding owner must own the feedback facility';
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.ensure_pt_session_feedback_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  session_record record;
begin
  select subscription_id, member_id, pt_id
  into session_record
  from public.membership_pt_sessions
  where id = new.session_id;

  if session_record is null then
    raise exception 'PT session must exist before session feedback can be created';
  end if;

  if tg_op = 'UPDATE' then
    if new.session_id <> old.session_id then
      raise exception 'pt_session_feedbacks.session_id cannot be changed';
    end if;
  end if;

  new.subscription_id := session_record.subscription_id;
  new.member_id := session_record.member_id;
  new.pt_id := session_record.pt_id;

  if new.status = 'read' and new.member_read_at is null then
    new.member_read_at := now();
  end if;

  return new;
end;
$$;

revoke all on function private.ensure_facility_feedback_integrity() from public;
revoke all on function private.ensure_facility_feedback_integrity() from anon;
revoke all on function private.ensure_facility_feedback_integrity() from authenticated;

revoke all on function private.ensure_pt_session_feedback_integrity() from public;
revoke all on function private.ensure_pt_session_feedback_integrity() from anon;
revoke all on function private.ensure_pt_session_feedback_integrity() from authenticated;

drop trigger if exists set_facility_feedbacks_updated_at
  on public.facility_feedbacks;
create trigger set_facility_feedbacks_updated_at
before update on public.facility_feedbacks
for each row
execute function private.set_updated_at();

drop trigger if exists ensure_facility_feedback_integrity_on_write
  on public.facility_feedbacks;
create trigger ensure_facility_feedback_integrity_on_write
before insert or update on public.facility_feedbacks
for each row
execute function private.ensure_facility_feedback_integrity();

drop trigger if exists set_pt_session_feedbacks_updated_at
  on public.pt_session_feedbacks;
create trigger set_pt_session_feedbacks_updated_at
before update on public.pt_session_feedbacks
for each row
execute function private.set_updated_at();

drop trigger if exists ensure_pt_session_feedback_integrity_on_write
  on public.pt_session_feedbacks;
create trigger ensure_pt_session_feedback_integrity_on_write
before insert or update on public.pt_session_feedbacks
for each row
execute function private.ensure_pt_session_feedback_integrity();

create index if not exists facility_feedbacks_facility_id_idx
  on public.facility_feedbacks (facility_id);

create index if not exists facility_feedbacks_member_id_idx
  on public.facility_feedbacks (member_id);

create index if not exists facility_feedbacks_status_idx
  on public.facility_feedbacks (status);

create index if not exists facility_feedbacks_responded_by_manager_id_idx
  on public.facility_feedbacks (responded_by_manager_id);

create index if not exists facility_feedbacks_created_at_idx
  on public.facility_feedbacks (created_at desc);

create index if not exists pt_session_feedbacks_subscription_id_idx
  on public.pt_session_feedbacks (subscription_id);

create index if not exists pt_session_feedbacks_member_id_idx
  on public.pt_session_feedbacks (member_id);

create index if not exists pt_session_feedbacks_pt_id_idx
  on public.pt_session_feedbacks (pt_id);

create index if not exists pt_session_feedbacks_status_idx
  on public.pt_session_feedbacks (status);

create index if not exists pt_session_feedbacks_sent_at_idx
  on public.pt_session_feedbacks (sent_at desc);

grant select, insert, update on table
  public.facility_feedbacks,
  public.pt_session_feedbacks
to authenticated;

alter table public.facility_feedbacks enable row level security;
alter table public.pt_session_feedbacks enable row level security;

drop policy if exists "Members can create facility feedback"
  on public.facility_feedbacks;
create policy "Members can create facility feedback"
  on public.facility_feedbacks
  for insert
  to authenticated
  with check (
    member_id = (select auth.uid())
    and (select private.current_user_has_facility_membership(facility_id))
  );

drop policy if exists "Members can read own facility feedback"
  on public.facility_feedbacks;
create policy "Members can read own facility feedback"
  on public.facility_feedbacks
  for select
  to authenticated
  using (member_id = (select auth.uid()));

drop policy if exists "Managers can read facility feedback"
  on public.facility_feedbacks;
create policy "Managers can read facility feedback"
  on public.facility_feedbacks
  for select
  to authenticated
  using ((select private.is_current_user_facility_manager(facility_id)));

drop policy if exists "Owners can read facility feedback"
  on public.facility_feedbacks;
create policy "Owners can read facility feedback"
  on public.facility_feedbacks
  for select
  to authenticated
  using ((select private.is_current_user_facility_owner(facility_id)));

drop policy if exists "Managers can respond to facility feedback"
  on public.facility_feedbacks;
create policy "Managers can respond to facility feedback"
  on public.facility_feedbacks
  for update
  to authenticated
  using ((select private.is_current_user_facility_manager(facility_id)))
  with check ((select private.is_current_user_facility_manager(facility_id)));

drop policy if exists "Owners can respond to facility feedback"
  on public.facility_feedbacks;
create policy "Owners can respond to facility feedback"
  on public.facility_feedbacks
  for update
  to authenticated
  using ((select private.is_current_user_facility_owner(facility_id)))
  with check ((select private.is_current_user_facility_owner(facility_id)));

drop policy if exists "PTs can create session feedback"
  on public.pt_session_feedbacks;
create policy "PTs can create session feedback"
  on public.pt_session_feedbacks
  for insert
  to authenticated
  with check (pt_id = (select auth.uid()));

drop policy if exists "PTs can read own session feedback"
  on public.pt_session_feedbacks;
create policy "PTs can read own session feedback"
  on public.pt_session_feedbacks
  for select
  to authenticated
  using (pt_id = (select auth.uid()));

drop policy if exists "Members can read own session feedback"
  on public.pt_session_feedbacks;
create policy "Members can read own session feedback"
  on public.pt_session_feedbacks
  for select
  to authenticated
  using (member_id = (select auth.uid()));

drop policy if exists "Managers can read session feedback"
  on public.pt_session_feedbacks;
create policy "Managers can read session feedback"
  on public.pt_session_feedbacks
  for select
  to authenticated
  using ((select private.is_current_user_subscription_facility_manager(subscription_id)));

drop policy if exists "Owners can read session feedback"
  on public.pt_session_feedbacks;
create policy "Owners can read session feedback"
  on public.pt_session_feedbacks
  for select
  to authenticated
  using ((select private.is_current_user_subscription_facility_owner(subscription_id)));

drop policy if exists "PTs can update own session feedback"
  on public.pt_session_feedbacks;
create policy "PTs can update own session feedback"
  on public.pt_session_feedbacks
  for update
  to authenticated
  using (pt_id = (select auth.uid()))
  with check (pt_id = (select auth.uid()));
