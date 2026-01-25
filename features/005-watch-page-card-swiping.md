# Feature Spec: Watch Page (Card Swiping & Winner Selection)

**Status**: Implemented
**Date**: January 2026
**Related PRs**: #9 (9d4a76f), #12 (41410d0), #13 (4d08080), #14 (145ad13), #17 (9f38d46), #20 (22d7c98), #21 (1037f48)

## Overview

Interactive card-swiping interface for choosing what to watch from saved entries. Users swipe right to "like" entries and left to skip them, then pick a winner from their likes. This feature solves the decision paralysis problem when choosing what to watch.

## Problem Statement

Deciding what to watch from a large list is overwhelming. Users need:
- A fun, engaging way to narrow down options quickly
- Ability to filter by mood without complex UI
- Clear winner selection after narrowing choices
- No commitment until final decision

The solution should feel like a game, not a chore.

## Requirements

### Functional Requirements

1. **Card Deck Display**
   - Show unwatched entries as a stack of cards
   - Display poster, title, release year, genres
   - Stacked visual effect (up to 4 cards visible)
   - Cards animate in and out smoothly

2. **Swipe Interaction**
   - Swipe right to "like" (add to liked pool)
   - Swipe left to "skip" (remove from deck)
   - Touch/mouse drag support
   - Visual feedback during drag (card follows finger/mouse)
   - Threshold-based decision (must swipe past threshold)
   - Snap back if released before threshold

3. **Button Controls**
   - Nope button (equivalent to swipe left)
   - Like button (equivalent to swipe right)
   - Buttons show on larger screens alongside cards

4. **Like Goal System**
   - Goal: Collect 3 likes (or 1 like if only 3 entries total)
   - Progress indicator (e.g., "2/3 likes")
   - Enter picker mode when goal reached
   - Early picker mode if deck exhausted with 1-2 likes

5. **Picker Mode**
   - Show all liked entries as selectable grid
   - Radio button or visual selection
   - "Start Over" option to reset and start again
   - "Choose Winner" button to confirm selection

6. **Winner Mode**
   - Show selected winner with poster and details
   - "Mark as Watched" button
   - "Back to Cards" button to start over

7. **Empty/Error States**
   - Show message if no unwatched entries
   - Reload button to refresh
   - Error message for load failures

### Non-Functional Requirements

1. **Performance**: Smooth 60fps animations on mobile
2. **Touch Responsiveness**: < 16ms input latency
3. **Accessibility**: Keyboard support for buttons
4. **Mobile-First**: Optimized for touch, works on desktop

## Design Decisions

### Decision 1: Swiping UI Pattern

**Options Considered**:
- A) Grid with checkboxes
- B) Tinder-style card swiping
- C) Drag-to-reorder list
- D) Multiple choice quiz

**Decision**: Option B - Tinder-style card swiping

**Rationale**:
- Fun, engaging interaction (gamification)
- Forces focus on one option at a time (reduces analysis paralysis)
- Natural on mobile (swipe is native gesture)
- Fast decision-making (swipe vs multiple clicks)
- Familiar pattern (used by many dating/shopping apps)
- Visual feedback makes it satisfying to use

### Decision 2: Like Goal Threshold

**Options Considered**:
- A) Fixed goal (e.g., always 3 likes)
- B) Percentage-based (e.g., 10% of deck)
- C) Adaptive goal based on deck size
- D) User-configurable goal

**Decision**: Option C - Adaptive goal (3 likes, or 1 if ≤3 entries)

**Rationale**:
- 3 is manageable (not too few, not too many)
- Gives real choice without overwhelming
- Special case for small lists (≤3 entries → goal is 1)
- Allows early picking if deck exhausts with fewer likes
- Can always start over if not satisfied
- Implemented in #20 to fix edge cases

### Decision 3: Animation Library

**Options Considered**:
- A) CSS transitions only
- B) React Spring
- C) Framer Motion
- D) Motion (Framer Motion successor)
- E) Custom animation hooks

**Decision**: Option D - Motion library

**Rationale**:
- Smooth, performant animations
- Declarative API (easier to reason about)
- Built-in gesture support (drag, swipe)
- Lightweight (Framer Motion successor)
- TypeScript support
- Active maintenance

### Decision 4: Drag Input Handling

**Options Considered**:
- A) Touch events only (mobile-first)
- B) Mouse events only (desktop)
- C) Pointer events (unified)
- D) Combination of touch + pointer events

**Decision**: Option D - Both touch and pointer events

**Rationale**:
- Touch events for iOS (better control, prevent scrolling)
- Pointer events for desktop (mouse + touch on Windows)
- Separate handling for each to avoid conflicts
- Track active input type to prevent dual activation
- Provides best experience on all devices
- Fixed type issues in #21

### Decision 5: Winner Selection Flow

**Options Considered**:
- A) Auto-select winner when goal reached
- B) Show picker immediately when goal reached
- C) Continue swiping until deck exhausted
- D) Allow picker mode early if 1-2 likes and deck exhausted

**Decision**: Combination of B and D

**Rationale**:
- B: User hits goal → sees picker → picks favorite of 3
- D: User exhausts deck with 1-2 likes → can still pick
- Option A is too aggressive (user may want to swipe more)
- Option C forces swiping through entire deck (tedious)
- Gives user control while preventing stuck states
- Implemented in #14 to handle edge case

### Decision 6: Layout Responsiveness

**Options Considered**:
- A) Mobile-only layout
- B) Desktop-only layout with large cards
- C) Adaptive layout (mobile = stacked, desktop = side-by-side)
- D) Same layout on all screens

**Decision**: Option C - Adaptive layout

**Rationale**:
- Mobile (sm): Card + buttons stacked vertically
- Desktop (md+): Card + buttons side-by-side
- Better use of screen real estate on desktop
- Maintains mobile-first touch experience
- Buttons on side for desktop mouse users
- Implemented in #13 and #17

### Decision 7: Card Stack Depth

**Options Considered**:
- A) Show only top card
- B) Show 2 cards (current + next)
- C) Show 4 cards (stacked effect)
- D) Show all cards

**Decision**: Option C - Show 4 cards

**Rationale**:
- Creates visual depth and interest
- Hints at what's coming next
- 4 is enough for effect without clutter
- Performance-friendly (only animate 4 cards)
- Standard pattern in card-swipe UIs

## Implementation Details

### Component Structure (After #12 Refactor)

```
WatchPageContainer (data fetching, state management)
  ↓
WatchPage (swipe logic, state machine)
  ├─ WatchHeader (title, subtitle)
  ├─ WatchLoadingState
  ├─ WatchEmptyState
  ├─ WatchDeckView (card swiping mode)
  │   ├─ WatchCard (individual card)
  │   └─ Action buttons (Like, Nope)
  ├─ WatchPickerView (selection mode)
  │   └─ WatchCard[] (selectable grid)
  └─ WatchWinnerView (winner display mode)
      └─ WatchCard (winner)
```

### State Machine

```
States:
1. Loading - Fetching entries from database
2. Deck Mode - Swiping through cards
3. Picker Mode - Selecting from likes (when goal reached or deck exhausted)
4. Winner Mode - Viewing selected winner

Transitions:
- Loading → Deck (on load success)
- Loading → Empty (no unwatched entries)
- Deck → Picker (goal reached OR deck exhausted with 1-2 likes)
- Picker → Winner (user selects winner)
- Winner → Deck (back to cards, reset state)
- Picker → Deck (start over)
```

### Drag Interaction Flow

1. **Pointer Down** (mouse) or **Touch Start**:
   - Record start position (x, y)
   - Record pointer/touch ID
   - Mark as dragging
   - Capture pointer (prevents scrolling)

2. **Pointer Move** or **Touch Move**:
   - Calculate dx, dy from start
   - Update card position (animate: { x: dx, y: dy, rotate: dx/14 })
   - Update like/nope opacity based on dx

3. **Pointer Up** or **Touch End**:
   - Check if dx exceeds threshold (110px)
   - If yes: Animate out (like or nope)
   - If no: Snap back to center
   - Release pointer capture

4. **Animate Out**:
   - Set decision (like or nope)
   - Animate card off screen (x = ±420)
   - After animation (220ms):
     - Remove card from deck
     - Add to liked array if decision = like
     - Reset drag state

### Swipe Threshold

```typescript
const swipeThreshold = 110; // pixels
const likeGoal = initialEntries.length <= 3 ? 1 : 3;
```

### Performance Optimizations

1. **Limit visible cards**: Only render/animate top 4 cards
2. **Transition duration**: 220ms for swipe-out (feels snappy)
3. **Spring animation**: Smooth snap-back with physics-based easing
4. **Prevent scroll**: Block touch events during drag to avoid jank
5. **Debounced renders**: State updates batched by React

### Touch Handling Edge Cases (#21)

**Problem**: TypeScript errors with Touch vs React.Touch types

**Solution**:
- Use `React.Touch` type from `react` package
- Handle `TouchList` properly with item() method
- Find touch by identifier for multi-touch scenarios
- Cast types where necessary for compatibility

### Small List Edge Case (#20)

**Problem**: Like goal (3) impossible to reach with only 3 entries

**Solution**:
- Adjust goal dynamically: `likeGoal = entries.length <= 3 ? 1 : 3`
- Skip picker view if only 1 liked entry (auto-select as winner)
- Show picker early if deck exhausts with 1-2 likes

### Winner View Layout (#20)

**Problem**: Winner view layout didn't match deck view on desktop

**Solution**:
- Use same responsive classes as deck view
- Side-by-side on medium+ screens
- Stacked on mobile
- Consistent button positioning

## Testing Strategy

### Unit Tests
- `watch-page.test.tsx`: Test state machine transitions
- Test goal reaching
- Test picker mode entry
- Test winner selection
- Test start over functionality
- Test button interactions
- Mock drag events

### Integration Tests
- `watch.integration.test.tsx`: Test full flow with real database
- Create test entries
- Simulate swiping
- Verify database updates on mark watched
- Test navigation

### Manual Testing Checklist
- [ ] Cards swipe smoothly on mobile
- [ ] Cards snap back if not swiped far enough
- [ ] Like/Nope buttons work
- [ ] Progress indicator updates correctly
- [ ] Picker mode shows after goal reached
- [ ] Winner can be selected from picker
- [ ] Mark as watched updates database
- [ ] Back to cards resets state
- [ ] Start over in picker resets state
- [ ] Empty state shows when no entries
- [ ] Reload button works
- [ ] Layout adapts to screen size (#13, #17)
- [ ] Works with 3 or fewer entries (#20)
- [ ] Touch types compile correctly (#21)

## Dependencies

- **Database**: Supabase `entries` table
- **Animation**: `motion` (Framer Motion successor)
- **Icons**: `lucide-react`
- **Routing**: React Router (for winner page)

## Accessibility

- **Keyboard Navigation**: Buttons are focusable and activatable with Enter/Space
- **Screen Readers**: ARIA labels on buttons
- **Reduced Motion**: Could add `prefers-reduced-motion` support
- **Focus Management**: Focus returns appropriately after transitions

## Future Enhancements

- **Filters**: Filter deck by genre, year, etc. before swiping
- **Undo**: Undo last swipe
- **Super Like**: Add a "super like" gesture (swipe up)
- **Swipe History**: Show what was swiped away (can bring back)
- **Collaboration**: Real-time swiping with group members
- **Queue**: Save liked items as queue for future sessions
- **Statistics**: Track swipe patterns (what gets liked most)
- **Animations**: More elaborate card animations (3D flips, etc.)
- **Haptic Feedback**: Vibration on swipe threshold reached
- **Sound Effects**: Optional swipe sound effects
- **Keyboard Shortcuts**: Arrow keys to swipe

## Performance Notes

- **60fps Target**: Animations maintain 60fps on modern mobile devices
- **Memory**: Deck limited to visible cards (4) to minimize memory
- **Network**: Only loads unwatched entries (watched entries filtered in query)
- **Bundle Size**: Motion library adds ~60kb gzipped

## Mobile-Specific Considerations

- **Safe Area**: Header and nav respect safe area insets
- **Scroll Prevention**: Touch move prevented during drag
- **Viewport Height**: Uses `svh` units for consistent height on iOS
- **Touch Targets**: Buttons are 44x44px minimum (Apple HIG)
- **Landscape Mode**: Works in both portrait and landscape

## Notes

- **Winner Routing**: Winner page accessible at `/app/watch/:entryId`
- **Deck Exhaustion**: If user swipes through all cards without liking any, empty state shows with reload option
- **State Persistence**: Deck state does NOT persist across page reloads (intentional - fresh start)
- **Auto-Select Winner**: If only 1 liked entry, skip picker and go straight to winner (#20)
