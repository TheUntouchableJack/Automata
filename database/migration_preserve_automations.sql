-- Migration: Preserve Automations as Templates (Soft Delete Architecture)
-- Run this in Supabase SQL Editor

-- =====================================================
-- AUTOMATIONS TABLE UPDATES
-- =====================================================

-- Step 1: Make project_id nullable (for templates without active projects)
ALTER TABLE automations ALTER COLUMN project_id DROP NOT NULL;

-- Step 2: Add organization_id for org-level ownership
ALTER TABLE automations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Step 3: Add template, archive, and soft-delete fields
ALTER TABLE automations ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE automations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE automations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE automations ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- Step 4: Backfill organization_id from existing projects
UPDATE automations
SET organization_id = projects.organization_id
FROM projects
WHERE automations.project_id = projects.id
AND automations.organization_id IS NULL;

-- Step 5: Drop existing foreign key constraint
ALTER TABLE automations DROP CONSTRAINT IF EXISTS automations_project_id_fkey;

-- Step 6: Re-add foreign key with SET NULL (don't cascade delete)
ALTER TABLE automations
    ADD CONSTRAINT automations_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE SET NULL;

-- Step 7: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automations_org_id ON automations(organization_id);
CREATE INDEX IF NOT EXISTS idx_automations_deleted_at ON automations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_automations_is_template ON automations(is_template);
CREATE INDEX IF NOT EXISTS idx_automations_is_archived ON automations(is_archived);

-- =====================================================
-- TRIGGER: Auto-preserve automation data on project delete
-- =====================================================

CREATE OR REPLACE FUNCTION preserve_automation_on_project_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Set organization_id and mark as template before project is deleted
    UPDATE automations
    SET
        organization_id = OLD.organization_id,
        is_template = true
    WHERE project_id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS preserve_automations_trigger ON projects;
CREATE TRIGGER preserve_automations_trigger
    BEFORE DELETE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION preserve_automation_on_project_delete();

-- =====================================================
-- RLS POLICIES: Updated for soft delete + templates
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view org automations" ON automations;
DROP POLICY IF EXISTS "Users can create org automations" ON automations;
DROP POLICY IF EXISTS "Users can update org automations" ON automations;
DROP POLICY IF EXISTS "Users can delete org automations" ON automations;

-- Users can view automations:
-- 1. In their projects (not soft-deleted)
-- 2. Templates in their organization (not soft-deleted)
CREATE POLICY "Users can view org automations" ON automations
    FOR SELECT USING (
        deleted_at IS NULL  -- Not soft-deleted
        AND (
            -- Automations in projects they can access
            EXISTS (
                SELECT 1 FROM projects
                JOIN organization_members ON organization_members.organization_id = projects.organization_id
                WHERE projects.id = automations.project_id
                AND organization_members.user_id = auth.uid()
            )
            OR
            -- Templates in their organization
            EXISTS (
                SELECT 1 FROM organization_members
                WHERE organization_members.organization_id = automations.organization_id
                AND organization_members.user_id = auth.uid()
            )
        )
    );

-- Users can create automations in their projects
CREATE POLICY "Users can create org automations" ON automations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            JOIN organization_members ON organization_members.organization_id = projects.organization_id
            WHERE projects.id = automations.project_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- Users can update automations in their projects
CREATE POLICY "Users can update org automations" ON automations
    FOR UPDATE USING (
        deleted_at IS NULL  -- Can't update soft-deleted
        AND EXISTS (
            SELECT 1 FROM projects
            JOIN organization_members ON organization_members.organization_id = projects.organization_id
            WHERE projects.id = automations.project_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- Users can soft-delete (update deleted_at) but not hard delete
CREATE POLICY "Users can soft delete org automations" ON automations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            JOIN organization_members ON organization_members.organization_id = projects.organization_id
            WHERE projects.id = automations.project_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin')
        )
    );

-- =====================================================
-- SUPER ADMIN POLICIES
-- =====================================================

-- Super admins can see ALL automations (including soft-deleted templates)
CREATE POLICY "Super admins can view all automations" ON automations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Super admins can update any automation
CREATE POLICY "Super admins can update all automations" ON automations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Super admins can hard delete (if needed)
CREATE POLICY "Super admins can delete automations" ON automations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- =====================================================
-- FUNCTION: Soft delete automation (for client use)
-- =====================================================

CREATE OR REPLACE FUNCTION soft_delete_automation(automation_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE automations
    SET
        deleted_at = NOW(),
        deleted_by = auth.uid(),
        is_template = true  -- Preserve as template
    WHERE id = automation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEW: Templates (for super admin dashboard)
-- =====================================================

CREATE OR REPLACE VIEW automation_templates AS
SELECT
    a.*,
    o.name as organization_name,
    p.name as original_project_name,
    p.industry as original_industry
FROM automations a
LEFT JOIN organizations o ON o.id = a.organization_id
LEFT JOIN projects p ON p.id = a.project_id
WHERE a.is_template = true OR a.deleted_at IS NOT NULL;

-- =====================================================
-- SUMMARY
-- =====================================================
-- After running this migration:
--
-- 1. When a client deletes an automation:
--    - Call: SELECT soft_delete_automation('automation-uuid');
--    - Automation is hidden from client (deleted_at is set)
--    - Automation becomes a template (is_template = true)
--
-- 2. When a project is deleted:
--    - Automations keep their organization_id
--    - Automations become templates (is_template = true)
--    - project_id is set to NULL
--
-- 3. Super admins (profiles.is_admin = true):
--    - Can see all automations including soft-deleted
--    - Can query automation_templates view
--    - Can duplicate templates for other organizations
--
-- 4. Regular users:
--    - Only see non-deleted automations
--    - Can create/update automations in their projects
