-- Apply once to karin-notepad D1 before deploying the 2026-10-30 Worker.
-- Non-destructive: existing content, revisions, deleted flags and history remain unchanged.
ALTER TABLE documents ADD COLUMN original_name TEXT;
UPDATE documents SET original_name = name WHERE original_name IS NULL;
