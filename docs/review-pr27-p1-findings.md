# PR #27 Review — P1 Findings (Fix Before Merge)

> All findings resolved in commit on migrate-to-expo branch.

## 1. `EXPO_PUBLIC_SUPABASE_SECRET_KEY` could leak into client bundle

**File**: `lib/test-utils/supabase.ts:5`
**Also**: `.github/workflows/tests.yml:71`

The Supabase service role key uses the `EXPO_PUBLIC_` prefix. Metro inlines any
`EXPO_PUBLIC_*` variable into the client bundle. If this test utility file is
ever accidentally imported from a non-test file, the secret key ships to users.

**Fix**: Rename to `SUPABASE_SECRET_KEY` (drop the `EXPO_PUBLIC_` prefix).
Update `.github/workflows/tests.yml` to match.

---

## 2. `detectSessionInUrl: false` may break magic link auth on web

**File**: `lib/supabase/client.ts:28`

This disables Supabase's automatic token extraction from URL fragments. The app
has an `/auth/confirm` route that calls `verifyOtp()` manually, but this only
works if Supabase email templates are configured to redirect to that route with
query parameters instead of the default hash-based redirect.

**Fix**: Either:
- Verify email templates point to `/auth/confirm?token_hash=...&type=...`, or
- Change to `detectSessionInUrl: Platform.OS === 'web'`

---

## 3. `as unknown as` casts bypass Supabase's generated types

**Files**:
- `app/(app)/list/components/list-page-container.tsx:69`
- `app/(app)/list/components/edit-entry-page-container.tsx:145`
- `app/(app)/watch/components/watch-page-container.tsx:128`

All three containers cast Supabase results through `as unknown as EntriesQueryRow`,
completely discarding the generated types. Each file also defines its own
`EntriesQueryRow` type manually. If the schema changes, these silently drift with
no compiler warning — defeating the purpose of `supabase gen types`.

**Fix**: Remove the casts and let Supabase's generated types flow through. Use
the `normalizeDetails` utility to handle the union shapes Supabase returns for
joins.
