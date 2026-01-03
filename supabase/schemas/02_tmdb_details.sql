-- Table 2: tmdb_details (The External Data)
-- Stores data from TMDB API. The updated_at field tracks when data was last fetched from TMDB
-- (TMDB requests no caching longer than 6 months)

CREATE TABLE IF NOT EXISTS tmdb_details (
  tmdb_id INTEGER UNIQUE NOT NULL PRIMARY KEY,
  media_type VARCHAR(20) NOT NULL,
  adult BOOLEAN NOT NULL,
  backdrop_path VARCHAR(255),
  poster_path VARCHAR(255),
  original_language VARCHAR(10) NOT NULL,
  overview TEXT,
  popularity NUMERIC(10, 2),
  vote_average NUMERIC(3, 1),
  vote_count INTEGER,
  name VARCHAR(255),
  original_name VARCHAR(255),
  release_date DATE,
  origin_country JSONB,
  runtime_minutes INTEGER,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for filtering by media type
CREATE INDEX IF NOT EXISTS idx_tmdb_details_media_type ON tmdb_details(media_type);

-- Index for filtering by release date
CREATE INDEX IF NOT EXISTS idx_tmdb_details_release_date ON tmdb_details(release_date);

-- Index for filtering by runtime
CREATE INDEX IF NOT EXISTS idx_tmdb_details_runtime ON tmdb_details(runtime_minutes);

-- Enable Row Level Security
ALTER TABLE tmdb_details ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read tmdb_details (public data)
CREATE POLICY "Everyone can view tmdb_details"
  ON tmdb_details FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert tmdb_details
CREATE POLICY "Authenticated users can insert tmdb_details"
  ON tmdb_details FOR INSERT
  WITH CHECK ((select auth.role()) = 'authenticated');

-- Policy: Authenticated users can update tmdb_details
CREATE POLICY "Authenticated users can update tmdb_details"
  ON tmdb_details FOR UPDATE
  USING ((select auth.role()) = 'authenticated')
  WITH CHECK ((select auth.role()) = 'authenticated');

-- Trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_tmdb_details_updated_at ON tmdb_details;
CREATE TRIGGER update_tmdb_details_updated_at
  BEFORE UPDATE ON tmdb_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
