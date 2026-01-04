-- Table 3: tags (The Vibe Labels)
-- Tags can be either TMDB genres (is_custom = false) or user-created custom tags (is_custom = true)
-- group_id is NULL for TMDB genres (shared), and set to the group's ID for custom tags

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  tmdb_id INTEGER,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  is_custom BOOLEAN NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Index for faster lookups by group_id (for custom tags)
CREATE INDEX IF NOT EXISTS idx_tags_group_id ON tags(group_id);

-- Index for filtering by custom vs TMDB tags
CREATE INDEX IF NOT EXISTS idx_tags_is_custom ON tags(is_custom);

-- Unique constraint: TMDB genres (is_custom = false) must have unique names globally
-- Custom tags (is_custom = true) must have unique names per group
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_unique_tmdb ON tags(name) WHERE is_custom = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_tmdb_id_unique_tmdb ON tags(tmdb_id) WHERE is_custom = false AND tmdb_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_group_unique_custom ON tags(name, group_id) WHERE is_custom = true;

-- Enable Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read TMDB tags; group members can read their group's custom tags
DROP POLICY IF EXISTS "Everyone can view tags" ON tags;
CREATE POLICY "Users can view TMDB tags and their group's custom tags"
  ON tags FOR SELECT
  USING (
    is_custom = false
    OR (is_custom = true AND group_id = public.current_user_group_id())
  );

-- Policy: Authenticated users can create custom tags (is_custom must be true)
DROP POLICY IF EXISTS "Authenticated users can create custom tags" ON tags;
CREATE POLICY "Group members can create custom tags"
  ON tags FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'authenticated' AND
    is_custom = true AND
    group_id = public.current_user_group_id()
  );

-- Policy: Users can only update their own custom tags
DROP POLICY IF EXISTS "Users can update their own custom tags" ON tags;
CREATE POLICY "Group members can update group custom tags"
  ON tags FOR UPDATE
  USING (group_id = public.current_user_group_id() AND is_custom = true)
  WITH CHECK (group_id = public.current_user_group_id() AND is_custom = true);

-- Policy: Users can only delete their own custom tags
DROP POLICY IF EXISTS "Users can delete their own custom tags" ON tags;
CREATE POLICY "Group members can delete group custom tags"
  ON tags FOR DELETE
  USING (group_id = public.current_user_group_id() AND is_custom = true);

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
