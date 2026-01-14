-- =====================================================================================
-- Migration: Fix User Foreign Keys
-- =====================================================================================
-- Purpose: Update all tables to reference the correct users table instead of auth.users
-- =====================================================================================

-- Drop existing foreign key constraints
ALTER TABLE recurring_goals DROP CONSTRAINT IF EXISTS recurring_goals_user_id_fkey;
ALTER TABLE recurring_commitments DROP CONSTRAINT IF EXISTS recurring_commitments_user_id_fkey;

-- Add new foreign key constraints referencing users table
ALTER TABLE recurring_goals
  ADD CONSTRAINT recurring_goals_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(user_id)
  ON DELETE CASCADE;

ALTER TABLE recurring_commitments
  ADD CONSTRAINT recurring_commitments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(user_id)
  ON DELETE CASCADE;

-- =====================================================================================
-- MIGRATION COMPLETE
-- =====================================================================================
-- All tables now correctly reference the custom users table instead of auth.users
-- =====================================================================================
