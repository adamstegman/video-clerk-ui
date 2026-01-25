# Feature Spec: Add to List (Save TMDB Results)

**Status**: Implemented
**Date**: January 2026
**Related PRs**: #2 (080e276)

## Overview

Allow users to save movies and TV shows from TMDB search results to their personal watchlist. This feature bridges content discovery (search) with content management (list).

## Problem Statement

After finding a movie or TV show via search, users need a way to save it for later decision-making. The saved list should persist across sessions and be accessible on any device.

## Requirements

### Functional Requirements

1. **Save Functionality**
   - Button to save each search result
   - Visual feedback during save operation (loading state)
   - Success/error feedback
   - Prevent duplicate saves (show "Saved" state for already-saved items)

2. **Data Persistence**
   - Save to Supabase database
   - Associate with authenticated user's group
   - Store TMDB metadata (ID, title, media type, release year, etc.)
   - Store poster path for later display
   - Store genres (IDs and names)
   - Fetch and store runtime if available

3. **Saved State Tracking**
   - Query user's existing entries on search page load
   - Track which search results are already saved
   - Update saved state immediately after successful save

4. **Error Handling**
   - Handle network failures gracefully
   - Display error messages to user
   - Allow retry on failure

### Non-Functional Requirements

1. **Performance**: Save operation should complete in < 2 seconds
2. **Data Integrity**: Use database constraints to prevent duplicates
3. **Security**: Enforce row-level security (RLS) policies
4. **Atomicity**: Save operation must be transactional (all-or-nothing)

## Design Decisions

### Decision 1: Database Schema

**Options Considered**:
- A) Store minimal data (just TMDB ID), fetch details on demand
- B) Store comprehensive metadata snapshot
- C) Hybrid: Store metadata but allow refresh from TMDB

**Decision**: Option B - Store comprehensive metadata snapshot

**Rationale**:
- Faster list loading (no need to call TMDB API)
- Works offline or if TMDB API is down
- TMDB metadata rarely changes for older titles
- Reduces API usage and associated costs
- Simplifies architecture (no background sync needed)

### Decision 2: Duplicate Prevention

**Options Considered**:
- A) Client-side check only
- B) Database unique constraint
- C) Both client-side and database constraint

**Decision**: Option C - Both client-side and database constraint

**Rationale**:
- Client-side check provides immediate UX feedback (shows "Saved" state)
- Database constraint is the source of truth (prevents race conditions)
- Defense in depth - handles edge cases like multiple devices
- Unique constraint: `(group_id, tmdb_id, media_type)`

### Decision 3: Save Operation Implementation

**Options Considered**:
- A) Direct INSERT query from client
- B) Supabase RPC function
- C) Backend API endpoint

**Decision**: Option B - Supabase RPC function

**Rationale**:
- Encapsulates complex logic (upsert, genre handling, etc.)
- Atomic operation (transaction within RPC)
- Can handle both tmdb_details and entries tables in one call
- Reduces round trips between client and database
- Type-safe with generated TypeScript types
- Easier to test and maintain complex SQL

### Decision 4: Genre Storage

**Options Considered**:
- A) Store genres in separate genre_tags junction table
- B) Store genres as JSON in entries table
- C) Store genres in tmdb_details as arrays

**Decision**: Combination of A and C

**Rationale**:
- Store in `tmdb_details.genre_ids` and `genre_names` as arrays for quick access
- Also create tags for genres and link via `entry_tags` table
- Allows filtering/searching by genre
- Consistent with custom tagging system
- PostgreSQL arrays are efficient for small datasets

### Decision 5: Runtime Fetching

**Options Considered**:
- A) Don't store runtime
- B) Store runtime from multi-search results
- C) Fetch runtime via separate details API call

**Decision**: Option C - Fetch runtime via separate details API call

**Rationale**:
- Multi-search results don't include runtime
- Runtime is valuable for decision-making ("do we have time for this?")
- Details API call is fast (<100ms typically)
- Only one extra call per save operation
- Alternative would be to fetch on demand in watch page, but that would be many calls

## Implementation Details

### Database Schema

**Tables**:
1. `tmdb_details` - TMDB metadata cache
2. `entries` - User's saved entries
3. `entry_tags` - Tags associated with entries

**RPC Function**: `save_tmdb_result_to_list`

```sql
CREATE OR REPLACE FUNCTION save_tmdb_result_to_list(
  p_tmdb_id INTEGER,
  p_media_type TEXT,
  p_title TEXT,
  p_release_date TEXT,
  p_poster_path TEXT,
  p_overview TEXT,
  p_runtime INTEGER,
  p_genre_ids INTEGER[],
  p_genre_names TEXT[]
) RETURNS BIGINT
```

### Component Flow

```
TMDBSearchContainer
  ↓ (fetches existing entries)
  ↓ (passes to children)
TMDBSearch
  ↓ (renders results)
TMDBSearchResultContainer
  ↓ (handles save logic)
TMDBSearchResult (presentation)
```

### Save Operation Sequence

1. User clicks "Add to List" button
2. Frontend shows loading state
3. Frontend calls TMDB details API to get runtime
4. Frontend calls Supabase RPC `save_tmdb_result_to_list`
5. RPC function:
   - Upserts `tmdb_details` record
   - Inserts `entries` record (or ignores if duplicate)
   - Creates genre tags if they don't exist
   - Links tags to entry via `entry_tags`
   - Returns entry ID
6. Frontend updates local state to show "Saved"
7. Frontend shows success feedback

### Button States

1. **Default**: "Add to List" (can click)
2. **Loading**: "Adding..." (disabled, spinner)
3. **Saved**: "Saved" (disabled, checkmark)
4. **Error**: "Failed - Retry" (can click)

## Testing Strategy

### Unit Tests
- `add-to-list-page.test.tsx`: Test search result save flow with mocked Supabase
- Mock button state transitions
- Test error handling

### Integration Tests
- `save-to-list.integration.test.ts`: Test full save operation with real Supabase
- Verify data persists correctly
- Test duplicate prevention
- Test RPC function with various inputs

### Manual Testing Checklist
- [ ] Save a movie successfully
- [ ] Save a TV show successfully
- [ ] Save button shows "Saved" after saving
- [ ] Reload page - previously saved items show "Saved"
- [ ] Try to save duplicate - shows "Saved" without error
- [ ] Save while offline - shows error
- [ ] Runtime is saved correctly
- [ ] Genres are saved as tags

## Dependencies

- **Database**: Supabase PostgreSQL
- **External API**: TMDB API (for runtime fetching)
- **Tables**: `tmdb_details`, `entries`, `tags`, `entry_tags`
- **RPC**: `save_tmdb_result_to_list`

## Security Considerations

### Row-Level Security (RLS) Policies

1. **entries table**: Users can only insert into their own group
2. **tmdb_details table**: Shared cache (any authenticated user can insert/read)
3. **tags table**: Group-scoped for custom tags, global for TMDB genre tags
4. **entry_tags table**: Users can only modify tags for their group's entries

### Data Validation

- TMDB ID must be positive integer
- Media type must be 'movie' or 'tv'
- Dates must be valid ISO format
- Genre IDs and names arrays must have matching lengths

## Rollout Plan

1. Initial implementation: Basic save without runtime
2. Add runtime fetching
3. Add genre storage and tagging
4. Optimize RPC function performance
5. Add duplicate detection UI

## Future Enhancements

- **Bulk Add**: Add entire lists (e.g., "Top 10 Action Movies")
- **Import**: Import from other services (Letterboxd, IMDb, etc.)
- **Notes**: Add personal notes when saving
- **Rating**: Rate expectations (how excited are you to watch this?)
- **Priority**: Mark as high/low priority
- **Recommended By**: Track who recommended each entry
- **Add from URL**: Paste TMDB URL to add directly
- **Browser Extension**: Add from any website with TMDB data

## Notes

- **Unique Constraint**: The `(group_id, tmdb_id, media_type)` unique constraint ensures no duplicates per group
- **Conflict Handling**: RPC uses `ON CONFLICT DO NOTHING` for idempotent saves
- **Genre Tags**: TMDB genres are marked as `is_custom = false` to distinguish from user tags
- **Performance**: Typical save operation takes 500-1000ms (mostly TMDB API call)
