# Feature Spec: TMDB Search Integration

**Status**: Implemented
**Date**: January 2026
**Related PRs**: Initial commit, ed17608

## Overview

Integrate The Movie Database (TMDB) API to allow users to search for movies and TV shows, view metadata, and display poster images. This feature serves as the foundation for content discovery in Video Clerk.

## Problem Statement

Users need a way to discover and identify movies and TV shows they want to watch. Manually entering metadata is error-prone and time-consuming. TMDB provides comprehensive, high-quality metadata for movies and TV shows that we can leverage.

## Requirements

### Functional Requirements

1. **Search Interface**
   - Search bar accepting text queries
   - Real-time search results as user types (debounced)
   - Support for both movies and TV shows in a single search (multi-search)
   - Display search results with title, release year, and poster image

2. **TMDB API Integration**
   - Multi-search endpoint integration (`/search/multi`)
   - Configuration endpoint for image base URLs and sizes
   - Genre endpoint for mapping genre IDs to names
   - Detail endpoints for movies and TV shows to fetch runtime

3. **Data Display**
   - Movie/TV show titles
   - Release year (from `release_date` or `first_air_date`)
   - Poster images (using TMDB image configuration)
   - Genre tags

4. **Performance**
   - Search debouncing (300ms delay)
   - Image optimization using TMDB's responsive image sizes
   - Client-side caching of configuration and genre data

### Non-Functional Requirements

1. **API Key Management**: Store API key securely in environment variables
2. **Error Handling**: Graceful degradation if API is unavailable
3. **Attribution**: Display TMDB attribution per API terms of service
4. **Type Safety**: Full TypeScript types for API responses

## Design Decisions

### Decision 1: Multi-Search vs Separate Searches

**Options Considered**:
- A) Separate search endpoints for movies and TV shows with tabs
- B) Single multi-search endpoint showing both types
- C) User selects type before searching

**Decision**: Option B - Multi-search endpoint

**Rationale**:
- Users often don't know or care about the distinction between movies and TV shows
- Simpler UX - no need to switch tabs or select a type
- TMDB multi-search is designed for this use case
- Reduces API calls compared to dual searches

### Decision 2: Search Debouncing

**Options Considered**:
- A) Search on every keystroke
- B) Search button to trigger search
- C) Debounced search (300ms delay)

**Decision**: Option C - Debounced search

**Rationale**:
- Reduces API calls and associated costs
- Better performance and perceived responsiveness
- 300ms is long enough to batch keystrokes but short enough to feel instant
- Search button would add friction to UX

### Decision 3: Image Handling

**Options Considered**:
- A) Download and store images locally
- B) Direct links to TMDB images
- C) Proxy through our backend

**Decision**: Option B - Direct links to TMDB images

**Rationale**:
- TMDB CDN is fast and reliable
- No storage costs on our side
- TMDB allows hotlinking per their terms
- Images are served at appropriate resolutions via configuration API
- Reduces backend complexity

### Decision 4: API Client Architecture

**Options Considered**:
- A) Direct fetch calls in components
- B) React Query or similar data-fetching library
- C) Custom TMDBAPI class with React Context

**Decision**: Option C - Custom TMDBAPI class

**Rationale**:
- Simple, lightweight solution without adding large dependencies
- Configuration and genres can be fetched once and cached in context
- API class provides type-safe methods
- Easy to test and mock
- Gives full control over caching and error handling

### Decision 5: Genre Handling

**Options Considered**:
- A) Store genre names in database when saving entries
- B) Store only genre IDs and look up names on display
- C) Store both IDs and names

**Decision**: Option C - Store both IDs and names

**Rationale**:
- Redundancy ensures data consistency if TMDB changes genres
- Faster queries - no need to join with genre lookup table
- Names can be displayed immediately without API calls
- Minimal storage overhead (genre_ids and genre_names are TEXT arrays)
- Future-proof if TMDB API becomes unavailable

## Implementation Details

### TMDB API Client (`app/tmdb-api/tmdb-api.ts`)

```typescript
class TMDBAPI {
  private baseUrl = 'https://api.themoviedb.org/3';
  private readAccessToken: string;

  async searchMulti(query: string): Promise<TMDBSearchResult[]>
  async getMovieDetails(id: number): Promise<TMDBMovieDetails>
  async getTVDetails(id: number): Promise<TMDBTVDetails>
  async getConfiguration(): Promise<TMDBConfiguration>
  async getGenres(): Promise<TMDBGenres>
}
```

### React Context Providers

1. **TMDBAPIProvider** - Provides TMDBAPI instance
2. **TMDBConfiguration** - Fetches and caches image configuration
3. **TMDBGenres** - Fetches and caches genre mappings

### Search Component Flow

```
TMDBSearchContainer (data fetching)
  ↓
TMDBSearch (presentation)
  ↓
TMDBSearchResult[] (individual results)
```

## Testing Strategy

### Unit Tests
- `tmdb-api.test.ts`: Test API client methods with mocked fetch
- `add-to-list-page.test.tsx`: Test search UI with mocked API

### Integration Tests
- Not applicable (external API dependency)

### Manual Testing Checklist
- [ ] Search returns results for valid queries
- [ ] Search handles empty queries gracefully
- [ ] Poster images load correctly
- [ ] Release years display correctly for movies and TV shows
- [ ] Genre names display correctly
- [ ] Search handles API errors gracefully
- [ ] Attribution is visible

## Dependencies

- **External**: TMDB API (requires API key)
- **Environment Variables**: `VITE_TMDB_API_READ_TOKEN`
- **NPM Packages**: None (uses native fetch)

## Rollout Plan

1. Initial implementation with basic search
2. Add configuration and genre support
3. Add debouncing optimization
4. Add runtime fetching for saved entries

## Future Enhancements

- **Search Filters**: Filter by year, genre, rating
- **Trending/Popular**: Show popular content without search
- **Detailed View**: Expand search results to show cast, ratings, synopsis
- **Local Search**: Search within saved list
- **Caching**: Cache search results locally
- **Pagination**: Load more results on scroll
- **Similar Titles**: "More like this" recommendations

## Notes

- TMDB API terms require attribution: "This product uses the TMDB API but is not endorsed or certified by TMDB"
- API rate limits: TMDB enforces rate limits (40 requests per 10 seconds for free tier)
- Image URLs: Must use configuration API to get correct base URLs (they can change)
