-- Table 3: tags (The Vibe Labels)
-- Tags can be either TMDB genres (is_custom = false) or user-created custom tags (is_custom = true)
-- user_id is NULL for TMDB genres (shared), and set to the user's ID for custom tags

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  tmdb_id INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_custom BOOLEAN NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Index for faster lookups by user_id (for custom tags)
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- Index for filtering by custom vs TMDB tags
CREATE INDEX IF NOT EXISTS idx_tags_is_custom ON tags(is_custom);

-- Unique constraint: TMDB genres (is_custom = false) must have unique names globally
-- Custom tags (is_custom = true) must have unique names per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_unique_tmdb ON tags(name) WHERE is_custom = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_tmdb_id_unique_tmdb ON tags(tmdb_id) WHERE is_custom = false AND tmdb_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_user_unique_custom ON tags(name, user_id) WHERE is_custom = true;

-- Enable Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read all tags (both TMDB genres and custom tags)
CREATE POLICY "Everyone can view tags"
  ON tags FOR SELECT
  USING (true);

-- Policy: Authenticated users can create custom tags (is_custom must be true)
CREATE POLICY "Authenticated users can create custom tags"
  ON tags FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'authenticated' AND
    is_custom = true AND
    (select auth.uid()) = user_id
  );

-- Policy: Users can only update their own custom tags
CREATE POLICY "Users can update their own custom tags"
  ON tags FOR UPDATE
  USING ((select auth.uid()) = user_id AND is_custom = true)
  WITH CHECK ((select auth.uid()) = user_id AND is_custom = true);

-- Policy: Users can only delete their own custom tags
CREATE POLICY "Users can delete their own custom tags"
  ON tags FOR DELETE
  USING ((select auth.uid()) = user_id AND is_custom = true);

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
