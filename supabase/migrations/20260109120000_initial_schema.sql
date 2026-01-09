-- =====================================================================================
-- Migration: Initial Database Schema for Family Life Planner
-- =====================================================================================
-- Purpose: Create the complete database schema including tables, enums, indexes,
--          RLS policies, and triggers for the Family Life Planner application.
--
-- Affected Tables:
--   - family_members
--   - weekly_schedules
--   - time_blocks
--   - recurring_goals
--   - feedback
--   - suggestions_cache
--   - usage_stats
--
-- Special Notes:
--   - Uses Supabase Auth for users table (auth.users)
--   - Implements soft-delete pattern with deleted_at
--   - Uses TSTZRANGE for time block scheduling with collision detection
--   - Enables Row Level Security on all tables
--   - Creates granular RLS policies for anon and authenticated roles
-- =====================================================================================

-- =====================================================================================
-- SECTION 1: EXTENSIONS
-- =====================================================================================

-- Enable btree_gist extension for EXCLUDE constraints on non-range types
-- Required for the time_blocks collision detection constraint
create extension if not exists btree_gist;

comment on extension btree_gist is 'Provides GiST index support for B-tree equivalent data types, required for EXCLUDE constraints';

-- =====================================================================================
-- SECTION 2: ENUMS
-- =====================================================================================

-- Define role types for family members
create type family_member_role as enum ('USER', 'SPOUSE', 'CHILD');

-- Define types of time blocks for categorization
create type block_type as enum ('WORK', 'ACTIVITY', 'MEAL', 'OTHER');

-- Define types of AI-generated suggestions that can be cached
create type suggestion_type as enum ('ACTIVITY', 'MEAL');

-- =====================================================================================
-- SECTION 3: CORE TABLES
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- Table: family_members
-- -------------------------------------------------------------------------------------
-- Purpose: Store information about family members including the primary user,
--          their spouse, and children. Links to Supabase auth.users.
-- RLS: User can only access their own family members
-- -------------------------------------------------------------------------------------
create table family_members (
  family_member_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role family_member_role not null,
  age smallint,  -- primarily for children
  preferences jsonb not null default '{}'::jsonb,  -- interests, energy levels, etc.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Add comment explaining the table purpose
comment on table family_members is 'Stores family member profiles including user, spouse, and children with their preferences';
comment on column family_members.preferences is 'JSONB field for storing interests, energy levels, and other preferences';
comment on column family_members.deleted_at is 'Soft delete timestamp for GDPR compliance';

-- -------------------------------------------------------------------------------------
-- Table: weekly_schedules
-- -------------------------------------------------------------------------------------
-- Purpose: Container for weekly schedules. Each user can have multiple schedules
--          for different weeks. Tracks whether schedule was AI-generated.
-- RLS: User can only access their own schedules
-- -------------------------------------------------------------------------------------
create table weekly_schedules (
  schedule_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  is_ai_generated boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  
  -- Ensure one schedule per user per week
  constraint weekly_schedules_unique_week unique (user_id, week_start_date)
);

comment on table weekly_schedules is 'Container for weekly schedules with metadata about generation method';
comment on column weekly_schedules.is_ai_generated is 'Flag indicating if schedule was created by AI or manually';
comment on column weekly_schedules.metadata is 'Additional schedule metadata like generation parameters';

-- -------------------------------------------------------------------------------------
-- Table: recurring_goals
-- -------------------------------------------------------------------------------------
-- Purpose: Define recurring activities/goals for family members that should be
--          scheduled regularly (e.g., gym 3x/week, piano lessons 2x/week).
-- RLS: User can only access goals for their family members
-- -------------------------------------------------------------------------------------
create table recurring_goals (
  goal_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  family_member_id uuid not null references family_members(family_member_id) on delete cascade,
  name text not null,
  description text,
  frequency_per_week smallint not null default 1 check (frequency_per_week > 0),
  preferred_duration_minutes integer check (preferred_duration_minutes > 0),
  preferred_time_of_day text[],  -- e.g., ['morning', 'afternoon', 'evening']
  priority smallint not null default 0,
  rules jsonb not null default '{}'::jsonb,  -- additional rules like RRULE from RFC-5545
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table recurring_goals is 'Recurring activities and goals for family members to be scheduled by AI';
comment on column recurring_goals.frequency_per_week is 'How many times per week this goal should be scheduled';
comment on column recurring_goals.preferred_time_of_day is 'Array of preferred time slots: morning, afternoon, evening';
comment on column recurring_goals.rules is 'Additional scheduling rules including RRULE format for complex recurrence';

-- -------------------------------------------------------------------------------------
-- Table: time_blocks
-- -------------------------------------------------------------------------------------
-- Purpose: Individual time blocks within a schedule. Can be linked to recurring goals
--          and family members. Uses TSTZRANGE for precise time tracking.
-- RLS: User can only access blocks from their schedules
-- Special: EXCLUDE constraint prevents time collisions for non-shared blocks
-- -------------------------------------------------------------------------------------
create table time_blocks (
  block_id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references weekly_schedules(schedule_id) on delete cascade,
  recurring_goal_id uuid references recurring_goals(goal_id) on delete set null,
  family_member_id uuid references family_members(family_member_id) on delete set null,
  title text not null,
  block_type block_type not null,
  time_range tstzrange not null,
  is_shared boolean not null default false,  -- family activities with multiple members
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table time_blocks is 'Individual time blocks in schedules with collision detection for non-shared blocks';
comment on column time_blocks.time_range is 'PostgreSQL range type for precise time period with automatic overlap detection';
comment on column time_blocks.is_shared is 'If true, multiple family members can have overlapping blocks (e.g., family dinner)';
comment on column time_blocks.metadata is 'Additional block metadata like location, notes, etc.';

-- IMPORTANT: Collision detection constraint
-- Prevents overlapping time blocks for the same family member within a schedule
-- Only applies to non-shared blocks (shared blocks can overlap by design)
alter table time_blocks 
  add constraint time_blocks_no_collision 
  exclude using gist (
    schedule_id with =, 
    family_member_id with =, 
    time_range with &&
  ) 
  where (deleted_at is null and is_shared = false);

comment on constraint time_blocks_no_collision on time_blocks is 
  'Prevents time collisions for non-shared blocks of the same family member using GiST index';

-- -------------------------------------------------------------------------------------
-- Table: feedback
-- -------------------------------------------------------------------------------------
-- Purpose: Store user feedback on schedules and individual blocks for AI learning.
--          Simple thumbs up/down rating system with optional comments.
-- RLS: User can only access their own feedback
-- -------------------------------------------------------------------------------------
create table feedback (
  feedback_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id uuid not null references weekly_schedules(schedule_id) on delete cascade,
  block_id uuid references time_blocks(block_id) on delete cascade,
  rating smallint not null check (rating in (-1, 1)),  -- thumbs down or thumbs up
  comments text,
  created_at timestamptz not null default now()
);

comment on table feedback is 'User feedback on schedules and blocks for AI learning and improvement';
comment on column feedback.rating is 'Simple rating: -1 for thumbs down, 1 for thumbs up';
comment on column feedback.block_id is 'Optional: feedback can be for entire schedule or specific block';

-- -------------------------------------------------------------------------------------
-- Table: suggestions_cache
-- -------------------------------------------------------------------------------------
-- Purpose: Cache AI-generated suggestions to reduce OpenAI API costs.
--          Stores activities and meal suggestions with expiration.
-- RLS: User can only access their own cached suggestions
-- -------------------------------------------------------------------------------------
create table suggestions_cache (
  cache_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  suggestion_type suggestion_type not null,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table suggestions_cache is 'Cached AI-generated suggestions to reduce API costs with TTL expiration';
comment on column suggestions_cache.payload is 'JSONB containing the actual suggestion data';
comment on column suggestions_cache.expires_at is 'Expiration timestamp, cleanup handled by pg_cron or lambda';

-- -------------------------------------------------------------------------------------
-- Table: usage_stats
-- -------------------------------------------------------------------------------------
-- Purpose: Daily statistics per user for tracking schedule generation and acceptance.
--          Used for product metrics and usage analysis.
-- RLS: User can only access their own statistics
-- -------------------------------------------------------------------------------------
create table usage_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  stats_date date not null,
  generated_count integer not null default 0,
  accepted_count integer not null default 0,
  primary key (user_id, stats_date)
);

comment on table usage_stats is 'Daily usage statistics per user for product metrics';
comment on column usage_stats.generated_count is 'Number of AI-generated schedules created on this date';
comment on column usage_stats.accepted_count is 'Number of AI-generated schedules accepted on this date';

-- =====================================================================================
-- SECTION 4: INDEXES
-- =====================================================================================

-- Family members indexes
create index family_members_user_idx 
  on family_members(user_id) 
  where deleted_at is null;

comment on index family_members_user_idx is 'Quick lookup of family members by user, excluding soft-deleted records';

-- Weekly schedules indexes
create unique index weekly_schedules_unique_idx 
  on weekly_schedules(user_id, week_start_date) 
  where deleted_at is null;

comment on index weekly_schedules_unique_idx is 'Ensures one schedule per user per week, excluding soft-deleted records';

-- Time blocks indexes
create index time_blocks_type_idx 
  on time_blocks(block_type) 
  where deleted_at is null;

create index time_blocks_family_member_idx 
  on time_blocks(family_member_id) 
  where deleted_at is null;

comment on index time_blocks_type_idx is 'Filter time blocks by type for analytics and reporting';
comment on index time_blocks_family_member_idx is 'Quick lookup of blocks assigned to specific family member';

-- Recurring goals indexes
create index recurring_goals_family_member_idx 
  on recurring_goals(family_member_id) 
  where deleted_at is null;

create index recurring_goals_rules_gin 
  on recurring_goals using gin(rules);

comment on index recurring_goals_family_member_idx is 'Quick lookup of goals for specific family member';
comment on index recurring_goals_rules_gin is 'GIN index for searching within JSONB rules (RRULE patterns)';

-- Suggestions cache indexes
create index suggestions_cache_payload_gin 
  on suggestions_cache using gin(payload);

create index suggestions_cache_expires_idx 
  on suggestions_cache(expires_at);

comment on index suggestions_cache_payload_gin is 'GIN index for searching within cached suggestion data';
comment on index suggestions_cache_expires_idx is 'Index on expires_at for filtering non-expired cache entries';

-- Usage stats indexes
create index usage_stats_date_idx 
  on usage_stats(stats_date);

comment on index usage_stats_date_idx is 'Quick filtering by date for analytics queries';

-- =====================================================================================
-- SECTION 5: TRIGGERS AND FUNCTIONS
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- Function: update_updated_at_column
-- -------------------------------------------------------------------------------------
-- Purpose: Automatically update the updated_at timestamp on row modification
-- -------------------------------------------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function update_updated_at_column is 'Trigger function to automatically update updated_at timestamp';

-- Apply updated_at trigger to all relevant tables
create trigger set_updated_at before update on family_members
  for each row execute function update_updated_at_column();

create trigger set_updated_at before update on weekly_schedules
  for each row execute function update_updated_at_column();

create trigger set_updated_at before update on time_blocks
  for each row execute function update_updated_at_column();

create trigger set_updated_at before update on recurring_goals
  for each row execute function update_updated_at_column();

-- =====================================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- RLS for family_members
-- -------------------------------------------------------------------------------------
-- Policy: Users can only access family members they created
-- -------------------------------------------------------------------------------------
alter table family_members enable row level security;

-- SELECT policies
create policy "family_members_select_anon" on family_members
  for select to anon
  using (false);  -- Anonymous users cannot view family members

create policy "family_members_select_authenticated" on family_members
  for select to authenticated
  using (auth.uid() = user_id);  -- Users can only view their own family members

-- INSERT policies
create policy "family_members_insert_anon" on family_members
  for insert to anon
  with check (false);  -- Anonymous users cannot create family members

create policy "family_members_insert_authenticated" on family_members
  for insert to authenticated
  with check (auth.uid() = user_id);  -- Users can only create family members for themselves

-- UPDATE policies
create policy "family_members_update_anon" on family_members
  for update to anon
  using (false);  -- Anonymous users cannot update family members

create policy "family_members_update_authenticated" on family_members
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);  -- Users can only update their own family members

-- DELETE policies
create policy "family_members_delete_anon" on family_members
  for delete to anon
  using (false);  -- Anonymous users cannot delete family members

create policy "family_members_delete_authenticated" on family_members
  for delete to authenticated
  using (auth.uid() = user_id);  -- Users can only delete their own family members

-- -------------------------------------------------------------------------------------
-- RLS for weekly_schedules
-- -------------------------------------------------------------------------------------
-- Policy: Users can only access their own schedules
-- -------------------------------------------------------------------------------------
alter table weekly_schedules enable row level security;

-- SELECT policies
create policy "weekly_schedules_select_anon" on weekly_schedules
  for select to anon
  using (false);  -- Anonymous users cannot view schedules

create policy "weekly_schedules_select_authenticated" on weekly_schedules
  for select to authenticated
  using (auth.uid() = user_id);  -- Users can only view their own schedules

-- INSERT policies
create policy "weekly_schedules_insert_anon" on weekly_schedules
  for insert to anon
  with check (false);  -- Anonymous users cannot create schedules

create policy "weekly_schedules_insert_authenticated" on weekly_schedules
  for insert to authenticated
  with check (auth.uid() = user_id);  -- Users can only create schedules for themselves

-- UPDATE policies
create policy "weekly_schedules_update_anon" on weekly_schedules
  for update to anon
  using (false);  -- Anonymous users cannot update schedules

create policy "weekly_schedules_update_authenticated" on weekly_schedules
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);  -- Users can only update their own schedules

-- DELETE policies
create policy "weekly_schedules_delete_anon" on weekly_schedules
  for delete to anon
  using (false);  -- Anonymous users cannot delete schedules

create policy "weekly_schedules_delete_authenticated" on weekly_schedules
  for delete to authenticated
  using (auth.uid() = user_id);  -- Users can only delete their own schedules

-- -------------------------------------------------------------------------------------
-- RLS for recurring_goals
-- -------------------------------------------------------------------------------------
-- Policy: Users can only access goals for their family members
-- -------------------------------------------------------------------------------------
alter table recurring_goals enable row level security;

-- SELECT policies
create policy "recurring_goals_select_anon" on recurring_goals
  for select to anon
  using (false);  -- Anonymous users cannot view goals

create policy "recurring_goals_select_authenticated" on recurring_goals
  for select to authenticated
  using (auth.uid() = user_id);  -- Users can only view goals they created

-- INSERT policies
create policy "recurring_goals_insert_anon" on recurring_goals
  for insert to anon
  with check (false);  -- Anonymous users cannot create goals

create policy "recurring_goals_insert_authenticated" on recurring_goals
  for insert to authenticated
  with check (
    auth.uid() = user_id 
    and exists (
      select 1 from family_members 
      where family_member_id = recurring_goals.family_member_id 
      and user_id = auth.uid()
    )
  );  -- Users can only create goals for their own family members

-- UPDATE policies
create policy "recurring_goals_update_anon" on recurring_goals
  for update to anon
  using (false);  -- Anonymous users cannot update goals

create policy "recurring_goals_update_authenticated" on recurring_goals
  for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id 
    and exists (
      select 1 from family_members 
      where family_member_id = recurring_goals.family_member_id 
      and user_id = auth.uid()
    )
  );  -- Users can only update their own goals

-- DELETE policies
create policy "recurring_goals_delete_anon" on recurring_goals
  for delete to anon
  using (false);  -- Anonymous users cannot delete goals

create policy "recurring_goals_delete_authenticated" on recurring_goals
  for delete to authenticated
  using (auth.uid() = user_id);  -- Users can only delete their own goals

-- -------------------------------------------------------------------------------------
-- RLS for time_blocks
-- -------------------------------------------------------------------------------------
-- Policy: Users can only access blocks from their own schedules
-- -------------------------------------------------------------------------------------
alter table time_blocks enable row level security;

-- SELECT policies
create policy "time_blocks_select_anon" on time_blocks
  for select to anon
  using (false);  -- Anonymous users cannot view time blocks

create policy "time_blocks_select_authenticated" on time_blocks
  for select to authenticated
  using (
    exists (
      select 1 from weekly_schedules 
      where schedule_id = time_blocks.schedule_id 
      and user_id = auth.uid()
    )
  );  -- Users can only view blocks from their own schedules

-- INSERT policies
create policy "time_blocks_insert_anon" on time_blocks
  for insert to anon
  with check (false);  -- Anonymous users cannot create time blocks

create policy "time_blocks_insert_authenticated" on time_blocks
  for insert to authenticated
  with check (
    exists (
      select 1 from weekly_schedules 
      where schedule_id = time_blocks.schedule_id 
      and user_id = auth.uid()
    )
  );  -- Users can only create blocks in their own schedules

-- UPDATE policies
create policy "time_blocks_update_anon" on time_blocks
  for update to anon
  using (false);  -- Anonymous users cannot update time blocks

create policy "time_blocks_update_authenticated" on time_blocks
  for update to authenticated
  using (
    exists (
      select 1 from weekly_schedules 
      where schedule_id = time_blocks.schedule_id 
      and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from weekly_schedules 
      where schedule_id = time_blocks.schedule_id 
      and user_id = auth.uid()
    )
  );  -- Users can only update blocks from their own schedules

-- DELETE policies
create policy "time_blocks_delete_anon" on time_blocks
  for delete to anon
  using (false);  -- Anonymous users cannot delete time blocks

create policy "time_blocks_delete_authenticated" on time_blocks
  for delete to authenticated
  using (
    exists (
      select 1 from weekly_schedules 
      where schedule_id = time_blocks.schedule_id 
      and user_id = auth.uid()
    )
  );  -- Users can only delete blocks from their own schedules

-- -------------------------------------------------------------------------------------
-- RLS for feedback
-- -------------------------------------------------------------------------------------
-- Policy: Users can only access their own feedback
-- -------------------------------------------------------------------------------------
alter table feedback enable row level security;

-- SELECT policies
create policy "feedback_select_anon" on feedback
  for select to anon
  using (false);  -- Anonymous users cannot view feedback

create policy "feedback_select_authenticated" on feedback
  for select to authenticated
  using (auth.uid() = user_id);  -- Users can only view their own feedback

-- INSERT policies
create policy "feedback_insert_anon" on feedback
  for insert to anon
  with check (false);  -- Anonymous users cannot create feedback

create policy "feedback_insert_authenticated" on feedback
  for insert to authenticated
  with check (
    auth.uid() = user_id 
    and exists (
      select 1 from weekly_schedules 
      where schedule_id = feedback.schedule_id 
      and user_id = auth.uid()
    )
  );  -- Users can only create feedback for their own schedules

-- UPDATE policies
create policy "feedback_update_anon" on feedback
  for update to anon
  using (false);  -- Anonymous users cannot update feedback

create policy "feedback_update_authenticated" on feedback
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);  -- Users can only update their own feedback

-- DELETE policies
create policy "feedback_delete_anon" on feedback
  for delete to anon
  using (false);  -- Anonymous users cannot delete feedback

create policy "feedback_delete_authenticated" on feedback
  for delete to authenticated
  using (auth.uid() = user_id);  -- Users can only delete their own feedback

-- -------------------------------------------------------------------------------------
-- RLS for suggestions_cache
-- -------------------------------------------------------------------------------------
-- Policy: Users can only access their own cached suggestions
-- -------------------------------------------------------------------------------------
alter table suggestions_cache enable row level security;

-- SELECT policies
create policy "suggestions_cache_select_anon" on suggestions_cache
  for select to anon
  using (false);  -- Anonymous users cannot view cached suggestions

create policy "suggestions_cache_select_authenticated" on suggestions_cache
  for select to authenticated
  using (auth.uid() = user_id);  -- Users can only view their own cached suggestions

-- INSERT policies
create policy "suggestions_cache_insert_anon" on suggestions_cache
  for insert to anon
  with check (false);  -- Anonymous users cannot create cache entries

create policy "suggestions_cache_insert_authenticated" on suggestions_cache
  for insert to authenticated
  with check (auth.uid() = user_id);  -- Users can only create cache entries for themselves

-- UPDATE policies
create policy "suggestions_cache_update_anon" on suggestions_cache
  for update to anon
  using (false);  -- Anonymous users cannot update cache entries

create policy "suggestions_cache_update_authenticated" on suggestions_cache
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);  -- Users can only update their own cache entries

-- DELETE policies
create policy "suggestions_cache_delete_anon" on suggestions_cache
  for delete to anon
  using (false);  -- Anonymous users cannot delete cache entries

create policy "suggestions_cache_delete_authenticated" on suggestions_cache
  for delete to authenticated
  using (auth.uid() = user_id);  -- Users can only delete their own cache entries

-- -------------------------------------------------------------------------------------
-- RLS for usage_stats
-- -------------------------------------------------------------------------------------
-- Policy: Users can only access their own statistics
-- -------------------------------------------------------------------------------------
alter table usage_stats enable row level security;

-- SELECT policies
create policy "usage_stats_select_anon" on usage_stats
  for select to anon
  using (false);  -- Anonymous users cannot view statistics

create policy "usage_stats_select_authenticated" on usage_stats
  for select to authenticated
  using (auth.uid() = user_id);  -- Users can only view their own statistics

-- INSERT policies
create policy "usage_stats_insert_anon" on usage_stats
  for insert to anon
  with check (false);  -- Anonymous users cannot create statistics

create policy "usage_stats_insert_authenticated" on usage_stats
  for insert to authenticated
  with check (auth.uid() = user_id);  -- Users can only create statistics for themselves

-- UPDATE policies
create policy "usage_stats_update_anon" on usage_stats
  for update to anon
  using (false);  -- Anonymous users cannot update statistics

create policy "usage_stats_update_authenticated" on usage_stats
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);  -- Users can only update their own statistics

-- DELETE policies
create policy "usage_stats_delete_anon" on usage_stats
  for delete to anon
  using (false);  -- Anonymous users cannot delete statistics

create policy "usage_stats_delete_authenticated" on usage_stats
  for delete to authenticated
  using (auth.uid() = user_id);  -- Users can only delete their own statistics

-- =====================================================================================
-- SECTION 7: MATERIALIZED VIEWS
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- Materialized View: weekly_usage_stats
-- -------------------------------------------------------------------------------------
-- Purpose: Aggregate usage statistics by ISO week for efficient analytics
-- Refresh: Should be refreshed by pg_cron or scheduled task
-- -------------------------------------------------------------------------------------
create materialized view weekly_usage_stats as
select 
  user_id,
  extract(isoyear from stats_date)::integer as iso_year,
  extract(week from stats_date)::integer as iso_week,
  sum(generated_count) as generated_sum,
  sum(accepted_count) as accepted_sum
from usage_stats
group by user_id, iso_year, iso_week;

-- Create index on materialized view for fast lookups
create unique index weekly_usage_stats_unique_idx 
  on weekly_usage_stats(user_id, iso_year, iso_week);

comment on materialized view weekly_usage_stats is 
  'Aggregated usage statistics by ISO week, refreshed periodically by cron job';

-- =====================================================================================
-- SECTION 8: DISABLE RLS POLICIES
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- Drop all RLS policies for family_members
-- -------------------------------------------------------------------------------------
drop policy if exists "family_members_select_anon" on family_members;
drop policy if exists "family_members_select_authenticated" on family_members;
drop policy if exists "family_members_insert_anon" on family_members;
drop policy if exists "family_members_insert_authenticated" on family_members;
drop policy if exists "family_members_update_anon" on family_members;
drop policy if exists "family_members_update_authenticated" on family_members;
drop policy if exists "family_members_delete_anon" on family_members;
drop policy if exists "family_members_delete_authenticated" on family_members;

-- -------------------------------------------------------------------------------------
-- Drop all RLS policies for weekly_schedules
-- -------------------------------------------------------------------------------------
drop policy if exists "weekly_schedules_select_anon" on weekly_schedules;
drop policy if exists "weekly_schedules_select_authenticated" on weekly_schedules;
drop policy if exists "weekly_schedules_insert_anon" on weekly_schedules;
drop policy if exists "weekly_schedules_insert_authenticated" on weekly_schedules;
drop policy if exists "weekly_schedules_update_anon" on weekly_schedules;
drop policy if exists "weekly_schedules_update_authenticated" on weekly_schedules;
drop policy if exists "weekly_schedules_delete_anon" on weekly_schedules;
drop policy if exists "weekly_schedules_delete_authenticated" on weekly_schedules;

-- -------------------------------------------------------------------------------------
-- Drop all RLS policies for recurring_goals
-- -------------------------------------------------------------------------------------
drop policy if exists "recurring_goals_select_anon" on recurring_goals;
drop policy if exists "recurring_goals_select_authenticated" on recurring_goals;
drop policy if exists "recurring_goals_insert_anon" on recurring_goals;
drop policy if exists "recurring_goals_insert_authenticated" on recurring_goals;
drop policy if exists "recurring_goals_update_anon" on recurring_goals;
drop policy if exists "recurring_goals_update_authenticated" on recurring_goals;
drop policy if exists "recurring_goals_delete_anon" on recurring_goals;
drop policy if exists "recurring_goals_delete_authenticated" on recurring_goals;

-- -------------------------------------------------------------------------------------
-- Drop all RLS policies for time_blocks
-- -------------------------------------------------------------------------------------
drop policy if exists "time_blocks_select_anon" on time_blocks;
drop policy if exists "time_blocks_select_authenticated" on time_blocks;
drop policy if exists "time_blocks_insert_anon" on time_blocks;
drop policy if exists "time_blocks_insert_authenticated" on time_blocks;
drop policy if exists "time_blocks_update_anon" on time_blocks;
drop policy if exists "time_blocks_update_authenticated" on time_blocks;
drop policy if exists "time_blocks_delete_anon" on time_blocks;
drop policy if exists "time_blocks_delete_authenticated" on time_blocks;

-- -------------------------------------------------------------------------------------
-- Drop all RLS policies for feedback
-- -------------------------------------------------------------------------------------
drop policy if exists "feedback_select_anon" on feedback;
drop policy if exists "feedback_select_authenticated" on feedback;
drop policy if exists "feedback_insert_anon" on feedback;
drop policy if exists "feedback_insert_authenticated" on feedback;
drop policy if exists "feedback_update_anon" on feedback;
drop policy if exists "feedback_update_authenticated" on feedback;
drop policy if exists "feedback_delete_anon" on feedback;
drop policy if exists "feedback_delete_authenticated" on feedback;

-- -------------------------------------------------------------------------------------
-- Drop all RLS policies for suggestions_cache
-- -------------------------------------------------------------------------------------
drop policy if exists "suggestions_cache_select_anon" on suggestions_cache;
drop policy if exists "suggestions_cache_select_authenticated" on suggestions_cache;
drop policy if exists "suggestions_cache_insert_anon" on suggestions_cache;
drop policy if exists "suggestions_cache_insert_authenticated" on suggestions_cache;
drop policy if exists "suggestions_cache_update_anon" on suggestions_cache;
drop policy if exists "suggestions_cache_update_authenticated" on suggestions_cache;
drop policy if exists "suggestions_cache_delete_anon" on suggestions_cache;
drop policy if exists "suggestions_cache_delete_authenticated" on suggestions_cache;

-- -------------------------------------------------------------------------------------
-- Drop all RLS policies for usage_stats
-- -------------------------------------------------------------------------------------
drop policy if exists "usage_stats_select_anon" on usage_stats;
drop policy if exists "usage_stats_select_authenticated" on usage_stats;
drop policy if exists "usage_stats_insert_anon" on usage_stats;
drop policy if exists "usage_stats_insert_authenticated" on usage_stats;
drop policy if exists "usage_stats_update_anon" on usage_stats;
drop policy if exists "usage_stats_update_authenticated" on usage_stats;
drop policy if exists "usage_stats_delete_anon" on usage_stats;
drop policy if exists "usage_stats_delete_authenticated" on usage_stats;

-- -------------------------------------------------------------------------------------
-- Disable RLS on all tables
-- -------------------------------------------------------------------------------------
alter table family_members disable row level security;
alter table weekly_schedules disable row level security;
alter table recurring_goals disable row level security;
alter table time_blocks disable row level security;
alter table feedback disable row level security;
alter table suggestions_cache disable row level security;
alter table usage_stats disable row level security;

-- =====================================================================================
-- MIGRATION COMPLETE
-- =====================================================================================
-- The schema is now ready for use. Next steps:
-- 1. Set up pg_cron for periodic refresh of weekly_usage_stats
-- 2. Set up cleanup job for expired suggestions_cache entries
-- 3. Consider partitioning weekly_schedules and time_blocks by week_start_date for archival
-- 
-- NOTE: All RLS policies have been dropped and RLS has been disabled on all tables.
--       All authenticated and anonymous users will have full access to all data.
--       Re-enable RLS and create appropriate policies before deploying to production.
-- =====================================================================================
