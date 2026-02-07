# PR #27 Review — P3 Findings (Nice to Have)

## 12. Settings page doesn't follow Container/Presenter pattern

**File**: `app/(app)/settings.tsx` (625 lines)

Every other feature uses Container/Presenter (`ListPageContainer`/`ListPage`,
`WatchPageContainer`/`WatchPage`, `EditEntryPageContainer`/`EditEntryPage`). The
settings page combines data fetching, mutations, and rendering in one file.

---

## 13. `docs/architecture.md` duplicates CLAUDE.md

**File**: `docs/architecture.md` (862 lines)

Largely duplicates `CLAUDE.md` (999 lines). Contains speculative YAGNI sections:
- "Scalability Considerations" (Feature Flags, i18n, Real-Time — none exist)
- "Future Architecture Improvements" (7 items for v2, 4 "Not Planned")
- "Why Not Redux/MobX?" and "Why Not NativeWind/Tailwind?" (defensive
  justification for decisions nobody questioned)

Consider deleting entirely — everything useful is already in CLAUDE.md.

---

## 14. Unused styles in settings

**File**: `app/(app)/settings.tsx`

~65 lines of dead styles: `styles.section`, `styles.row`, `styles.rowPressed`,
`styles.rowText`, `styles.rowTextDanger`, `styles.memberRow`,
`styles.memberAvatar`, `styles.memberAvatarText`, `styles.memberInfo`,
`styles.memberEmail`, `styles.memberBadge`, `styles.pendingAvatar`,
`styles.pendingBadge`.

---

## 15. Poster URL construction duplicated 6+ times

**Files**: `saved-entry-row.tsx`, `edit-entry-page.tsx`, `watch-card.tsx`,
`watch-winner-view.tsx`, `watch-picker-view.tsx`, `add/index.tsx`

Each manually selects a poster size index and constructs the URL. Extract a
shared `buildImageUrl(config, path, size)` utility.

---

## 16. Loading/Error state UI duplicated 4+ times

**Files**: `list-page.tsx`, `watch-page.tsx`, `edit-entry-page.tsx`,
`add/index.tsx`

Identical `ActivityIndicator` + `Text` patterns. Extract shared `LoadingView`
and `ErrorView` components.

---

## 17. Redundant `GestureHandlerRootView` in list-page.tsx

**File**: `app/(app)/list/components/list-page.tsx:67`

Already wrapped at root in `app/_layout.tsx`. The nested one is unnecessary.

---

## 18. `WatchCardEntry.mediaType` typed as `string`

**File**: `app/(app)/watch/components/watch-card.tsx:14`

Should be `'movie' | 'tv'` for exhaustiveness checking. The codebase
consistently checks `mediaType === 'movie'` or `mediaType === 'tv'` — a union
type would catch missing branches at compile time.

---

## 19. Hardcoded hex colors throughout

Hundreds of occurrences of `#4f46e5`, `#6b7280`, `#1f2937`, `#f4f4f5`, etc.
scattered across all StyleSheet files. Extract to a `lib/theme/colors.ts` for
maintainability and future dark mode support.

---

## 20. CLAUDE.md doesn't match actual code structure

CLAUDE.md says business logic lives in `lib/feature-name/` but it actually lives
in `app/(app)/feature-name/components/`. Also references `vitest/globals` in
tsconfig despite the migration to Jest. The Supabase client docs describe a
factory function pattern but the actual code uses a module singleton.

---

## 21. `FlatList` `ItemSeparatorComponent` uses inline arrow functions

**Files**: `list-page.tsx:73`, `add/index.tsx:256`

```typescript
ItemSeparatorComponent={() => <View style={styles.separator} />}
```

Creates a new component reference every render, defeating FlatList's internal
memoization. Extract to a named component.

---

## 22. Console logging visible in production on web

**Files**: `settings.tsx`, `add/index.tsx`, `edit-entry-page-container.tsx`,
`watch-page-container.tsx`

`console.error` calls may expose Supabase error details (table names, RLS policy
messages) in browser dev tools. Consider a logging utility that silences output
in production web builds.
