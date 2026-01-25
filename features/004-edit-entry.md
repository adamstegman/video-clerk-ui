# Feature Spec: Edit Entry (Entry Management)

**Status**: Implemented
**Date**: January 2026
**Related PRs**: #15 (f05ce1d), #19 (b922a21)

## Overview

Allow users to view and edit details of saved entries, including marking as watched, adding/removing tags, and deleting entries. This feature provides full CRUD operations on list entries.

## Problem Statement

After saving an entry, users need to:
- Mark it as watched when they finish it
- Organize it with custom tags
- Remove it if they change their mind
- View all associated metadata

The edit interface should be intuitive and mobile-friendly.

## Requirements

### Functional Requirements

1. **View Entry Details**
   - Display poster, title, release year
   - Show current watched status
   - Show current tags (both TMDB genres and custom tags)

2. **Mark as Watched**
   - Toggle watched status with a switch/checkbox
   - Persist watched timestamp
   - Visual feedback on save

3. **Tag Management**
   - View all tags associated with entry
   - Add existing tags from group's tag library
   - Create new custom tags
   - Remove tags from entry
   - Tag suggestions while typing
   - Normalize tag names (trim, lowercase)

4. **Delete Entry**
   - Delete button with confirmation context
   - Remove entry and all associations
   - Navigate back to list after deletion

5. **Save Changes**
   - Save button to persist changes
   - Loading state during save
   - Success/error feedback
   - Disable save during tag creation

### Non-Functional Requirements

1. **Performance**: Load entry details in < 1 second
2. **Data Integrity**: Atomic saves (all changes or none)
3. **UX**: Clear visual feedback for all actions
4. **Mobile-First**: Touch-friendly tag buttons and inputs

## Design Decisions

### Decision 1: Edit Page vs Modal

**Options Considered**:
- A) Modal/drawer overlay on list page
- B) Dedicated edit page (separate route)
- C) Inline editing in list view

**Decision**: Option B - Dedicated edit page

**Rationale**:
- More screen real estate for tag management
- Cleaner URL structure (`/app/list/:entryId`)
- Better deep linking and sharing
- Easier to implement with React Router
- Can show full entry details without cramping list view
- Mobile-friendly (full screen vs cramped modal)

### Decision 2: Watched Status Toggle

**Options Considered**:
- A) Checkbox
- B) Toggle switch
- C) Button with state
- D) Automatically mark watched when swiped to winner

**Decision**: Option B - Toggle switch (for manual control) + Option D (automatic)

**Rationale**:
- Toggle switch is clear and modern
- Immediate visual feedback
- Single click to toggle (efficient)
- Consistent with mobile app conventions
- Also auto-mark watched from winner page for convenience
- Manual toggle allows unmarking if needed

### Decision 3: Tag Management UI

**Options Considered**:
- A) Autocomplete dropdown
- B) Tag input with suggestions
- C) Checkbox list of all available tags
- D) Separate "available" and "selected" lists

**Decision**: Combination of B and D

**Rationale**:
- Shows selected tags prominently (easy to remove)
- Shows available tags for quick adding (no typing needed)
- Input with suggestions for creating new tags
- Intuitive flow: see what's available → add → or create new
- Mobile-friendly (large tap targets)

### Decision 4: Tag Creation UX

**Options Considered**:
- A) Create tag, then add to entry (two steps)
- B) Create and add in one action
- C) Create tag in separate settings page

**Decision**: Option B - Create and add in one action

**Rationale**:
- Reduces friction (user doesn't care about tag creation as separate concept)
- Context-aware: creating tag for THIS entry right now
- Shows "Create" button only when tag doesn't exist
- Clear what will happen when button is clicked
- Can still manage tags globally later if needed

### Decision 5: Tag Normalization

**Options Considered**:
- A) Store tags exactly as entered
- B) Normalize to lowercase
- C) Normalize to lowercase + trim whitespace
- D) Normalize + prevent duplicates

**Decision**: Option C - Lowercase + trim

**Rationale**:
- Prevents duplicate tags with different casing ("Action" vs "action")
- Trim prevents accidental spaces
- Lowercase is standard for tags (easier to search/filter)
- Case-insensitive comparison in suggestion matching
- Implemented in #15 database migration

### Decision 6: Component Decomposition

**Options Considered**:
- A) Single monolithic EditEntryPage component
- B) Extract into smaller composable components
- C) Use headless component library

**Decision**: Option B - Smaller composable components

**Rationale**:
- Easier to test individual sections
- Single responsibility principle
- Better code organization
- Easier to modify individual sections
- Reusable components (e.g., EditEntryTagButton)
- Implemented in #19 refactoring

## Implementation Details

### Component Structure (After #19 Refactor)

```
EditEntryPageContainer (data fetching, state management)
  ↓
EditEntryPage (layout, composition)
  ├─ EditEntryHeader (poster, title, year)
  ├─ EditEntryWatchedStatusSection (toggle switch)
  ├─ EditEntryTagsSection
  │   ├─ EditEntrySelectedTags (tags on this entry)
  │   │   └─ EditEntryTagButton (individual tag chip)
  │   ├─ EditEntryTagInput (search/create input)
  │   ├─ EditEntryTagSuggestions (filtered suggestions)
  │   └─ EditEntryAvailableTags (all available tags)
  │       └─ EditEntryTagButton
  └─ EditEntryDeleteSection (delete button)
```

### Data Model

```typescript
interface EditEntryTag {
  id: number;
  name: string;
  is_custom: boolean; // false for TMDB genres
}

interface EditEntryData {
  id: number;
  title: string;
  releaseYear: string;
  posterPath: string | null;
}
```

### Database Operations

1. **Load Entry**: Join `entries`, `tmdb_details`, `entry_tags`, `tags`
2. **Update Watched**: `UPDATE entries SET watched_at = NOW() WHERE id = ?`
3. **Add Tag**: Insert into `entry_tags` junction table
4. **Remove Tag**: Delete from `entry_tags`
5. **Create Tag**: Insert into `tags` (group-scoped), then add to entry
6. **Delete Entry**: `DELETE FROM entries WHERE id = ?` (cascades to entry_tags)

### Tag Suggestions Algorithm

```typescript
function getSuggestions(query: string, availableTags: Tag[], selectedTags: Tag[]): Tag[] {
  const lowerQuery = query.toLowerCase().trim();
  return availableTags
    .filter(tag => !selectedTags.some(selected => selected.id === tag.id))
    .filter(tag => tag.name.toLowerCase().includes(lowerQuery))
    .slice(0, 5); // Limit to 5 suggestions
}
```

### Save Operation Sequence

1. User modifies watched status and/or tags
2. User clicks "Save" button
3. Container disables save button, shows "Saving..."
4. Container makes multiple Supabase calls:
   - Update `watched_at` if changed
   - Delete removed tags from `entry_tags`
   - Insert added tags into `entry_tags`
5. On success: Show "Saved!" feedback, navigate back to list after delay
6. On error: Show error message, keep user on page to retry

## Testing Strategy

### Unit Tests
- `edit-entry-page.test.tsx`: Test presentation with mock props
- Test watched toggle renders correctly
- Test tag sections render
- Test delete section

### Integration Tests
- `edit-entry-page.integration.test.ts`: Test full edit flow
- Load entry from database
- Add custom tag
- Mark as watched
- Save changes
- Verify database updates
- Delete entry

### Manual Testing Checklist
- [ ] Entry details load correctly
- [ ] Watched toggle works
- [ ] Can add existing tag
- [ ] Can create new tag
- [ ] Tag suggestions appear while typing
- [ ] Can remove tag
- [ ] Save button shows loading/success states
- [ ] Delete button removes entry
- [ ] Error handling works (network failure)
- [ ] Navigation after save/delete
- [ ] Works on mobile (touch interactions)

## Dependencies

- **Database**: Supabase `entries`, `tags`, `entry_tags` tables
- **RLS Policies**: User can only modify their group's entries/tags
- **React Router**: Dynamic routing for `/app/list/:entryId`

## Component Refactoring (#19)

**Before**: Monolithic 293-line `EditEntryPage` component

**After**: Split into 9 focused components:
1. `EditEntryHeader` - Title and poster display
2. `EditEntryWatchedStatusSection` - Watched toggle
3. `EditEntryTagsSection` - Overall tag management layout
4. `EditEntrySelectedTags` - Display selected tags
5. `EditEntryAvailableTags` - Display available tags
6. `EditEntryTagInput` - Search/create input
7. `EditEntryTagSuggestions` - Filtered suggestions
8. `EditEntryTagButton` - Reusable tag chip button
9. `EditEntryDeleteSection` - Delete button

**Benefits**:
- Each component has single responsibility
- Easier to test individual pieces
- Better code organization
- Reusable components
- Clearer data flow

## Security Considerations

### Row-Level Security

1. Users can only edit entries in their group
2. Users can only add/remove tags in their group
3. Custom tags are group-scoped
4. TMDB genre tags are global (is_custom = false)

### Data Validation

- Entry ID must exist and belong to user's group
- Tag names must be non-empty after trimming
- Watched timestamp must be valid

## Future Enhancements

- **Undo/Redo**: Undo recent changes
- **Bulk Edit**: Edit multiple entries at once
- **Tag Colors**: Assign colors to tags
- **Tag Categories**: Group tags by category
- **Notes**: Add personal notes to entries
- **Rating**: Rate the entry (1-5 stars)
- **Rewatch**: Track multiple watches
- **History**: View edit history
- **Collaboration**: See who added/edited entry in group
- **Tag Merge**: Merge duplicate tags
- **Tag Rename**: Rename tags (updates all entries)

## Notes

- **Tag Normalization**: Tags are stored lowercase and trimmed (implemented in #15)
- **Cascade Delete**: Deleting entry also deletes entry_tags records (foreign key cascade)
- **Genre Tags**: TMDB genres are automatically created as tags when saving entries
- **Mobile Layout**: Delete button and Save button stacked on mobile, side-by-side on desktop
