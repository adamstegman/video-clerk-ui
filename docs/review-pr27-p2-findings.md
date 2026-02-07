# PR #27 Review — P2 Findings (Fix Soon After Merge)

## 4. Memory leak: debounce timer not cleaned on unmount

**File**: `app/(app)/list/add/index.tsx:39,122-132`

The `searchTimeoutRef` is never cleared when the component unmounts. If a user
navigates away while a timeout is pending, `setState` fires on an unmounted
component. The `fetchSavedIds` effect (line 42-67) also lacks a cancellation
flag, unlike `list-page-container.tsx` which correctly uses one.

**Fix**: Add a cleanup effect:
```typescript
useEffect(() => {
  return () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };
}, []);
```
Add a `cancelled` flag to `fetchSavedIds` following the pattern in
`list-page-container.tsx`.

---

## 5. Side effect during render: `onChooseWinner`

**File**: `app/(app)/watch/components/watch-page.tsx:109-112`

```typescript
if (isInPickMode && liked.length === 1) {
  onChooseWinner(liked[0]);  // calls setState in parent during render
  return null;
}
```

This is a React anti-pattern — calling a state-updating callback during the
render phase. It will produce warnings in development and unpredictable behavior
in React 18+ concurrent mode.

**Fix**: Move this logic to a `useEffect` or handle auto-selection in the
container before passing props.

---

## 6. `TMDBAPIProvider` creates a new API instance every render

**File**: `lib/tmdb-api/tmdb-api-provider.tsx:13`

```typescript
const api = new TMDBAPI(apiToken);  // new instance every render
```

Since `TMDBConfiguration` and `TMDBGenres` have `[api]` in their `useEffect`
dependency arrays, a new reference triggers re-fetching config and genre data on
every provider re-render. Same issue in `tmdb-configuration.tsx:55` and
`tmdb-genres.tsx:58` where context values create new object references via
spread.

**Fix**:
```typescript
const api = useMemo(() => new TMDBAPI(apiToken), [apiToken]);
```
Also wrap context values in `useMemo` in `tmdb-configuration.tsx` and
`tmdb-genres.tsx`.

---

## 7. Duplicate normalization functions with different behavior

**File**: `app/(app)/list/components/edit-entry-page-container.tsx:41-67`

This file re-declares `getReleaseYear`, `normalizeDetails`, `normalizeTagKey`,
`normalizeTagName` locally instead of importing from `lib/utils/normalize.ts`.

Critically, the local `normalizeTagKey` uses
`.trim().toLowerCase().replace(/\s+/g, ' ')` while the shared version uses
`.toLowerCase().trim()` — different order and the local one also collapses
whitespace. Tag comparison behaves differently depending on which code path runs.

**Fix**: Delete local copies and import from `lib/utils/normalize.ts`. Reconcile
the differing `normalizeTagKey` implementations — pick one canonical behavior.

---

## 8. Duplicate initial fetch in `ListPageContainer`

**File**: `app/(app)/list/components/list-page-container.tsx:108-128`

Both `useEffect` (line 108) and `useFocusEffect` (line 124) call `load()` on
initial mount, causing two concurrent Supabase queries for the same data.
`useFocusEffect` fires on initial focus too, making the `useEffect` redundant.
`WatchPageContainer` gets this right by using only `useFocusEffect`.

**Fix**: Remove the `useEffect` on lines 108-121. Let `useFocusEffect` handle
all loading.

---

## 9. OTP type not validated

**File**: `app/auth/confirm.tsx:45`

The `type` URL parameter is cast to `'email' | 'magiclink'` without validation.
Supabase accepts other types like `'recovery'`, `'signup'`, `'invite'`.

**Fix**: Add a whitelist check:
```typescript
const validTypes = ['email', 'magiclink'];
if (!validTypes.includes(type)) {
  setError('Invalid confirmation type');
  return;
}
```

---

## 10. `Dimensions.get('window')` at module scope

**File**: `app/(app)/watch/components/watch-card.tsx:22-25`

Captures screen size once at import time. On web with window resize, or iPad
split view, card dimensions become stale.

**Fix**: Use the `useWindowDimensions` hook inside the component:
```typescript
import { useWindowDimensions } from 'react-native';

export function WatchCard({ entry }: WatchCardProps) {
  const { width, height } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 600);
  const cardHeight = height * 0.7;
  // ...
}
```

---

## 11. `handleMarkWatched` doesn't check Supabase error

**File**: `app/(app)/watch/components/watch-page-container.tsx:229-245`

Every other Supabase call in the codebase destructures and checks `{ error }`.
This one silently ignores failures.

**Fix**: Destructure and check the error:
```typescript
const { error } = await supabase
  .from('entries')
  .update({ watched_at: new Date().toISOString() })
  .eq('id', entryId);

if (error) {
  console.error('Failed to mark as watched:', error);
  // show error to user
}
```
