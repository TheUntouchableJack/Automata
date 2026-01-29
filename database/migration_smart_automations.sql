-- Smart Automations Feature Migration
-- Run this in Supabase SQL Editor

-- Add icon column to automations table
ALTER TABLE automations ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'workflow';

-- Add target_segment column for customer group targeting
ALTER TABLE automations ADD COLUMN IF NOT EXISTS target_segment TEXT;

-- Add template_id for tracking which template was used
ALTER TABLE automations ADD COLUMN IF NOT EXISTS template_id TEXT;

-- Add is_archived column for soft delete functionality
ALTER TABLE automations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Index for icon lookups
CREATE INDEX IF NOT EXISTS idx_automations_icon ON automations(icon);

-- Index for archived automations
CREATE INDEX IF NOT EXISTS idx_automations_archived ON automations(is_archived);
