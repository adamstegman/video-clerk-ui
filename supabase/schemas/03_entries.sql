-- Table 1: entries (The Watchlist)
-- Represents items in the group's watchlist (shared by all group members)

CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type VARCHAR(20) NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  watched_at TIMESTAMP,
  CONSTRAINT fk_tmdb_details FOREIGN KEY (tmdb_id, media_type) REFERENCES tmdb_details(tmdb_id, media_type) ON DELETE CASCADE,
  CONSTRAINT entries_group_tmdb_unique UNIQUE (group_id, tmdb_id, media_type)
);

-- Index for faster lookups by group_id (most common query)
CREATE INDEX IF NOT EXISTS idx_entries_group_id ON entries(group_id);

-- Index for faster lookups by tmdb_id
CREATE INDEX IF NOT EXISTS idx_entries_tmdb_id ON entries(tmdb_id);

-- Index for filtering by media type
CREATE INDEX IF NOT EXISTS idx_entries_media_type ON entries(media_type);

-- Index for filtering by added date
CREATE INDEX IF NOT EXISTS idx_entries_added_at ON entries(added_at);

-- Index for filtering watched vs unwatched
CREATE INDEX IF NOT EXISTS idx_entries_watched_at ON entries(watched_at);

-- Enable Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Policy: Group members can only see their group's entries
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
CREATE POLICY "Group members can view group entries"
  ON entries FOR SELECT
  USING (group_id = public.current_user_group_id());

-- Policy: Group members can only insert into their group
DROP POLICY IF EXISTS "Users can insert their own entries" ON entries;
CREATE POLICY "Group members can insert group entries"
  ON entries FOR INSERT
  WITH CHECK (group_id = public.current_user_group_id());

-- Policy: Group members can update their group's entries
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
CREATE POLICY "Group members can update group entries"
  ON entries FOR UPDATE
  USING (group_id = public.current_user_group_id())
  WITH CHECK (group_id = public.current_user_group_id());

-- Policy: Group members can delete their group's entries
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;
CREATE POLICY "Group members can delete group entries"
  ON entries FOR DELETE
  USING (group_id = public.current_user_group_id());
