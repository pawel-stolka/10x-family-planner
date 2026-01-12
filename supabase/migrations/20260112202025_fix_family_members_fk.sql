-- =====================================================================================
-- Migration: Fix family_members Foreign Key to Reference Custom users Table
-- =====================================================================================
-- Purpose: Update family_members.user_id foreign key to reference the custom users
--          table instead of auth.users, matching the NestJS backend authentication.
--
-- Changes:
--   1. Drop the old foreign key constraint to auth.users
--   2. Add new foreign key constraint to custom users table
--   3. Update RLS policies to use custom users table
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- Step 1: Drop the old foreign key constraint
-- -------------------------------------------------------------------------------------
alter table family_members 
  drop constraint if exists family_members_user_id_fkey;

-- -------------------------------------------------------------------------------------
-- Step 2: Add new foreign key to custom users table
-- -------------------------------------------------------------------------------------
alter table family_members
  add constraint family_members_user_id_fkey
  foreign key (user_id) 
  references users(user_id) 
  on delete cascade;

comment on constraint family_members_user_id_fkey on family_members is 
  'References custom users table for NestJS backend authentication';

-- -------------------------------------------------------------------------------------
-- Step 3: Update RLS policies to work with custom users table
-- -------------------------------------------------------------------------------------
-- Note: RLS policies that use auth.uid() will need to be updated to match user_id
-- from the custom users table. For now, we'll disable RLS for development.
-- In production, implement proper RLS with custom JWT claims or service role.

-- Temporarily disable RLS for development (backend handles authorization)
alter table family_members disable row level security;

comment on table family_members is 
  'Stores family member profiles. RLS disabled - authorization handled by NestJS backend with JWT.';

-- -------------------------------------------------------------------------------------
-- Step 4: Similarly update other tables that reference users
-- -------------------------------------------------------------------------------------

-- Update weekly_schedules foreign key
alter table weekly_schedules 
  drop constraint if exists weekly_schedules_user_id_fkey;

alter table weekly_schedules
  add constraint weekly_schedules_user_id_fkey
  foreign key (user_id) 
  references users(user_id) 
  on delete cascade;

-- Disable RLS for development
alter table weekly_schedules disable row level security;

comment on table weekly_schedules is 
  'Weekly schedule container. RLS disabled - authorization handled by NestJS backend with JWT.';

-- Update recurring_goals foreign key
alter table recurring_goals 
  drop constraint if exists recurring_goals_user_id_fkey;

alter table recurring_goals
  add constraint recurring_goals_user_id_fkey
  foreign key (user_id) 
  references users(user_id) 
  on delete cascade;

-- Disable RLS for development
alter table recurring_goals disable row level security;

comment on table recurring_goals is 
  'Recurring goals to schedule. RLS disabled - authorization handled by NestJS backend with JWT.';

-- =====================================================================================
-- MIGRATION COMPLETE
-- =====================================================================================
-- All user_id foreign keys now reference the custom users table.
-- RLS is disabled for development - backend handles authorization via JWT.
-- For production, consider:
--   1. Re-enabling RLS with custom JWT claims
--   2. Using service role for backend operations
--   3. Implementing middleware to set RLS context
-- =====================================================================================
