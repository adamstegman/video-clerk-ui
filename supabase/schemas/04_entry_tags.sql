-- Table 4: entry_tags (The Join Table)
-- Many-to-many relationship between entries and tags
-- The composite primary key (entry_id, tag_id) ensures no duplicate tags for the same entry

CREATE TABLE IF NOT EXISTS entry_tags (
  entry_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (entry_id, tag_id),
  CONSTRAINT fk_entry FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Index for faster lookups by entry_id
CREATE INDEX IF NOT EXISTS idx_entry_tags_entry_id ON entry_tags(entry_id);

-- Index for faster lookups by tag_id
CREATE INDEX IF NOT EXISTS idx_entry_tags_tag_id ON entry_tags(tag_id);

-- Enable Row Level Security
ALTER TABLE entry_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Group members can only see entry_tags for their group entries
DROP POLICY IF EXISTS "Users can view entry_tags for their own entries" ON entry_tags;
CREATE POLICY "Group members can view entry_tags for group entries"
  ON entry_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_tags.entry_id
      AND entries.group_id = public.current_user_group_id()
    )
  );

-- Policy: Group members can only insert entry_tags for their group entries
DROP POLICY IF EXISTS "Users can insert entry_tags for their own entries" ON entry_tags;
CREATE POLICY "Group members can insert entry_tags for group entries"
  ON entry_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_tags.entry_id
      AND entries.group_id = public.current_user_group_id()
    )
  );

-- Policy: Group members can only delete entry_tags for their group entries
DROP POLICY IF EXISTS "Users can delete entry_tags for their own entries" ON entry_tags;
CREATE POLICY "Group members can delete entry_tags for group entries"
  ON entry_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_tags.entry_id
      AND entries.group_id = public.current_user_group_id()
    )
  );
