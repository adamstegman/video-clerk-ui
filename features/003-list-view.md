# Feature Spec: List View (Saved Entries Display)

**Status**: Implemented
**Date**: January 2026
**Related PRs**: #6 (5f2471a), #16 (10652a3), #22 (32d18c2)

## Overview

Display all saved movies and TV shows in a scrollable list, organized by watched status, with quick access to entry details and the ability to add new items.

## Problem Statement

Users need a way to view all their saved entries in one place. The list should be easy to scan, show relevant information at a glance, and distinguish between items they've already watched and items still to watch.

## Requirements

### Functional Requirements

1. **List Display**
   - Show all saved entries for the user's group
   - Display poster image, title, release year
   - Sort unwatched items by date added (newest first)
   - Sort watched items by date added (newest first)
   - Show unwatched items before watched items

2. **Visual Organization**
   - Section header for "Watched" items
   - Visual distinction for watched items (dimmed/grayed)
   - Responsive layout (adapts to mobile and desktop)

3. **Navigation**
   - Floating action button (FAB) to add new items
   - Tap/click entry to view details and edit

4. **Loading States**
   - Loading spinner while fetching data
   - Skeleton screens or loading indicators
   - Empty state when no entries exist

5. **Error Handling**
   - Display error message if fetch fails
   - Retry option for failed loads

### Non-Functional Requirements

1. **Performance**: List should load in < 2 seconds
2. **Responsiveness**: Smooth scrolling even with 100+ entries
3. **Accessibility**: Keyboard navigation, screen reader support
4. **Mobile-First**: Optimized for touch interactions

## Design Decisions

### Decision 1: List Layout

**Options Considered**:
- A) Grid view with large posters
- B) Compact list view with small posters
- C) Table view with rows
- D) Toggle between grid and list

**Decision**: Option B - Compact list view

**Rationale**:
- Maximizes number of visible entries (important for scanning)
- Faster scrolling and navigation
- Works better on mobile (less horizontal scrolling)
- Small posters are still recognizable
- Can show more metadata (tags, date) without crowding
- Grid view better suited for browsing (watch page), list for inventory

### Decision 2: Watched/Unwatched Organization

**Options Considered**:
- A) Separate tabs for watched/unwatched
- B) Filter dropdown to show/hide watched
- C) Mixed list with visual distinction
- D) Unwatched first, then watched section with header

**Decision**: Option D - Unwatched first, then watched section

**Rationale**:
- Primary use case is "what haven't we watched yet?"
- Watched items provide context but shouldn't dominate
- Section header clearly separates the two groups
- No need to switch tabs or apply filters
- Can still see full history at a glance
- Watched items dimmed to reinforce status visually

### Decision 3: Sort Order

**Options Considered**:
- A) Alphabetical by title
- B) By TMDB popularity/rating
- C) By date added (newest first)
- D) By date added (oldest first)
- E) User-configurable sort

**Decision**: Option C - By date added (newest first)

**Rationale**:
- Matches mental model: "what did I add recently?"
- Most recently added items are often top of mind
- Encourages clearing backlog (oldest aren't buried)
- Simple, predictable ordering
- No need for sort UI (fewer decisions for user)
- Can add custom sorting later if needed

### Decision 4: Data Fetching Strategy

**Options Considered**:
- A) Fetch on every page load
- B) Cache in React state
- C) Use React Query or SWR
- D) Fetch once, subscribe to real-time updates

**Decision**: Option A - Fetch on every page load

**Rationale**:
- Simple implementation (no cache invalidation logic)
- Always shows fresh data
- Fast enough with Supabase (< 500ms typically)
- List changes infrequently (user-driven actions)
- Can add caching/subscriptions later if needed
- Avoids stale data issues across tabs/devices

### Decision 5: Poster Image Sizing

**Options Considered**:
- A) Fixed size (e.g., 100x150px)
- B) Responsive (% of container)
- C) Multiple sizes for different breakpoints
- D) Square thumbnails

**Decision**: Option A - Fixed size (small for list)

**Rationale**:
- Consistent, predictable layout
- Avoids layout shift during image load
- TMDB provides optimized image sizes (w92 for list view)
- Faster loading (smaller images)
- Poster aspect ratio is standard (2:3)

### Decision 6: Horizontal Overflow Handling

**Options Considered**:
- A) Wrap text to multiple lines
- B) Truncate with ellipsis
- C) Hide overflow with `overflow-x-hidden`
- D) Allow horizontal scroll

**Decision**: Option C - Hide overflow with `overflow-x-hidden`

**Rationale**:
- Prevents horizontal scrollbar on mobile (better UX)
- Long titles are rare and can be read in detail view
- Cleaner, more polished appearance
- Consistent with mobile app conventions
- Implemented in #22 to fix mobile layout issues

## Implementation Details

### Component Structure

```
ListPageContainer (data fetching, state management)
  ↓
ListPage (presentation, layout)
  ↓
SavedEntryRow[] (individual entry cards)
```

### Data Model

```typescript
interface SavedEntryRowData {
  id: number;
  title: string;
  releaseYear: string;
  posterPath: string | null;
  isWatched: boolean;
  addedAt: string;
}
```

### Database Query

```sql
SELECT
  e.id,
  e.added_at,
  e.watched_at,
  td.title,
  td.release_date,
  td.poster_path
FROM entries e
JOIN tmdb_details td ON e.tmdb_id = td.tmdb_id AND e.media_type = td.media_type
WHERE e.group_id = [user's group_id]
ORDER BY
  CASE WHEN e.watched_at IS NULL THEN 0 ELSE 1 END,
  e.added_at DESC
```

### Responsive Layout

- **Mobile**: Single column, small posters (w92), compact spacing
- **Tablet**: Single column, medium posters (w154), more spacing
- **Desktop**: Single column (list view optimized), larger posters

### Floating Action Button (FAB)

- Position: Bottom-right corner (fixed)
- Icon: Plus sign
- Action: Navigate to `/app/list/add`
- Mobile-friendly (56x56px tap target)

## Testing Strategy

### Unit Tests
- `list-page.test.tsx`: Test rendering with different data states
- Test watched section header appears correctly
- Test empty state
- Test loading state
- Test error state

### Integration Tests
- Not needed (covered by container tests)

### Manual Testing Checklist
- [ ] List loads and displays all entries
- [ ] Unwatched entries appear first
- [ ] Watched section header appears when there are watched items
- [ ] Watched items are visually dimmed
- [ ] Empty state shows when no entries exist
- [ ] Loading spinner shows during fetch
- [ ] Error message shows on fetch failure
- [ ] FAB is accessible and clickable
- [ ] Click entry navigates to detail page
- [ ] No horizontal overflow on mobile (#22)
- [ ] Images lazy load correctly

## Dependencies

- **Database**: Supabase `entries` and `tmdb_details` tables
- **RLS Policies**: User can only read their group's entries
- **TMDB**: Image CDN for poster images

## Performance Optimizations

1. **Database Indexing**: Index on `(group_id, watched_at, added_at)` for fast queries
2. **Image Loading**: Use TMDB's smallest poster size (w92) for list view
3. **Virtual Scrolling**: Not implemented yet, but could improve performance for 500+ entries
4. **Skeleton Screens**: Could add to improve perceived performance

## Accessibility

- Semantic HTML (`<article>` for entries)
- Descriptive alt text for poster images
- Keyboard navigation support
- Focus states for interactive elements
- ARIA labels where appropriate

## Future Enhancements

- **Search/Filter**: Search by title, filter by genre/tags
- **Sort Options**: Allow user to change sort order
- **Bulk Actions**: Select multiple entries to mark watched/delete
- **Virtual Scrolling**: For better performance with large lists
- **Grid View Toggle**: Option to switch between list and grid
- **Watched Date**: Show when item was marked watched
- **Rating**: Display personal ratings
- **Notes Preview**: Show notes snippet in list view
- **Group By**: Group by genre, year, rating, etc.
- **Export**: Export list to CSV/JSON
- **Print View**: Printable list format

## Notes

- **Watched Status Logic**: An entry is considered watched if `watched_at IS NOT NULL`
- **Image Fallback**: Show placeholder if poster_path is null
- **Mobile Optimization**: Fixed horizontal overflow issue in #22 with `overflow-x-hidden`
- **Section Header**: Only shows "Watched" header if there are both watched and unwatched items
