-- =====================================================================================
-- Migration: Add Users Table for Custom Authentication
-- =====================================================================================
-- Purpose: Create users table for custom email/password authentication
--          alongside existing Supabase auth.users integration.
--
-- Note: This table stores users managed by the NestJS backend's custom auth system.
--       Existing tables continue to reference auth.users for Supabase Auth.
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- Table: users
-- -------------------------------------------------------------------------------------
-- Purpose: Store user accounts for custom authentication with email/password.
--          Separate from Supabase auth.users to allow backend-managed authentication.
-- -------------------------------------------------------------------------------------
create table if not exists users (
  user_id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  last_login_at timestamptz
);

-- Add comments
comment on table users is 'Custom user accounts managed by NestJS backend with bcrypt password hashing';
comment on column users.password_hash is 'Bcrypt hashed password (never store plaintext)';
comment on column users.deleted_at is 'Soft delete timestamp for GDPR compliance';
comment on column users.last_login_at is 'Timestamp of last successful login';

-- -------------------------------------------------------------------------------------
-- Indexes
-- -------------------------------------------------------------------------------------
-- Index for fast email lookups during login
create index users_email_idx 
  on users(email) 
  where deleted_at is null;

comment on index users_email_idx is 'Fast email lookup for authentication, excluding soft-deleted users';

-- Index for filtering active users
create index users_active_idx 
  on users(user_id) 
  where deleted_at is null;

comment on index users_active_idx is 'Quick lookup of active users';

-- -------------------------------------------------------------------------------------
-- Triggers
-- -------------------------------------------------------------------------------------
-- Auto-update updated_at timestamp
create trigger set_updated_at before update on users
  for each row execute function update_updated_at_column();

-- =====================================================================================
-- MIGRATION COMPLETE
-- =====================================================================================
-- The users table is now ready for custom authentication.
-- Existing tables continue using auth.users for Supabase Auth integration.
-- =====================================================================================
