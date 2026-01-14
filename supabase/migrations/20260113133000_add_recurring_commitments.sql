-- =====================================================================================
-- Migration: Add Recurring Commitments (Fixed Weekly Blocks)
-- =====================================================================================
-- Purpose: Store recurring fixed commitments (work/school/sleep/appointments) that act
--          as hard constraints during AI schedule generation and can be shown in the
--          weekly calendar.
--
-- Table:
--   - recurring_commitments
--
-- Notes:
--   - Shared commitments use is_shared=true and family_member_id is NULL
--   - Member commitments use family_member_id and is_shared=false
--   - day_of_week uses ISO-like mapping: 1=Monday ... 7=Sunday
--   - start_time/end_time stored as time without time zone
--   - Soft delete supported via deleted_at
-- =====================================================================================

create table if not exists recurring_commitments (
  commitment_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  family_member_id uuid references family_members(family_member_id) on delete cascade,
  title text not null,
  block_type block_type not null default 'OTHER',
  day_of_week smallint not null check (day_of_week between 1 and 7),
  start_time time not null,
  end_time time not null,
  is_shared boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint recurring_commitments_valid_time check (start_time < end_time),
  constraint recurring_commitments_shared_member_exclusive check (
    (is_shared = true and family_member_id is null) or
    (is_shared = false and family_member_id is not null)
  )
);

comment on table recurring_commitments is 'Recurring fixed commitments that constrain weekly schedules (work/school/sleep/etc.)';
comment on column recurring_commitments.day_of_week is 'Day of week: 1=Monday ... 7=Sunday';
comment on column recurring_commitments.is_shared is 'If true, commitment applies to whole family and family_member_id must be NULL';

create index if not exists idx_recurring_commitments_user_active
  on recurring_commitments(user_id)
  where deleted_at is null;

create index if not exists idx_recurring_commitments_member_active
  on recurring_commitments(family_member_id)
  where deleted_at is null;

-- Enable RLS
alter table recurring_commitments enable row level security;

-- Policies: authenticated users can manage only their own commitments
drop policy if exists "recurring_commitments_select_own" on recurring_commitments;
create policy "recurring_commitments_select_own"
  on recurring_commitments
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "recurring_commitments_insert_own" on recurring_commitments;
create policy "recurring_commitments_insert_own"
  on recurring_commitments
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "recurring_commitments_update_own" on recurring_commitments;
create policy "recurring_commitments_update_own"
  on recurring_commitments
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "recurring_commitments_delete_own" on recurring_commitments;
create policy "recurring_commitments_delete_own"
  on recurring_commitments
  for delete
  to authenticated
  using (user_id = auth.uid());

