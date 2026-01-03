-- Table 1: entries (The Watchlist)
-- Represents items in the user's watchlist

CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  tmdb_id INTEGER NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  watched_at TIMESTAMP,
  CONSTRAINT fk_tmdb_details FOREIGN KEY (tmdb_id) REFERENCES tmdb_details(tmdb_id) ON DELETE CASCADE,
  CONSTRAINT entries_user_tmdb_unique UNIQUE (user_id, tmdb_id)
);

-- Index for faster lookups by user_id (most common query)
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);

-- Index for faster lookups by tmdb_id
CREATE INDEX IF NOT EXISTS idx_entries_tmdb_id ON entries(tmdb_id);

-- Index for filtering by added date
CREATE INDEX IF NOT EXISTS idx_entries_added_at ON entries(added_at);

-- Index for filtering watched vs unwatched
CREATE INDEX IF NOT EXISTS idx_entries_watched_at ON entries(watched_at);

-- Enable Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own entries
CREATE POLICY "Users can view their own entries"
  ON entries FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Policy: Users can only insert their own entries
CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can only update their own entries
CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can only delete their own entries
CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE
  USING ((select auth.uid()) = user_id);
