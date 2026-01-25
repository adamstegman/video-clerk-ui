# Feature Spec: Group Sharing & Multi-User Support

**Status**: Implemented
**Date**: January 2026
**Related PRs**: #8 (4cb0d0c)

## Overview

Enable multiple users to share a single watchlist by organizing users into groups. Users can invite others to join their group via email invitation links, and all group members see the same list of entries and tags.

## Problem Statement

Video Clerk is designed to solve the "what do we watch?" problem for couples, roommates, and families. The application needs to:
- Support multiple users accessing the same watchlist
- Provide a secure way to invite others to join your list
- Maintain data privacy (groups can't see each other's data)
- Handle the lifecycle of a user (new user → solo → invited to group → group member)

## Requirements

### Functional Requirements

1. **Group Creation**
   - New users automatically get their own group on signup
   - Groups are created transparently (no explicit "create group" action)

2. **Group Membership**
   - Each user belongs to exactly one group at a time
   - Users see entries and tags for their group only
   - Group ownership tracked for future features (owner can manage group)

3. **Invitations**
   - Create invitation link for a specific email address
   - Invitation link contains unique invite ID
   - Invitations shown as "pending members" in settings
   - Invitation expires or can be revoked (future)

4. **Accepting Invitations**
   - User receives invitation link via email (external)
   - User opens link while signed in
   - Settings page detects invite parameter
   - User accepts invite with clear warning about losing current data
   - User moves to inviter's group
   - User's old group and data remain in database (could be cleaned up later)

5. **Group Visualization**
   - Settings page shows current group members
   - Shows pending invitations
   - Shows member email addresses

6. **Data Scoping**
   - Entries scoped to group
   - Custom tags scoped to group
   - TMDB genre tags shared globally

### Non-Functional Requirements

1. **Security**: Row-Level Security (RLS) enforces group boundaries
2. **Data Integrity**: Foreign key constraints prevent orphaned data
3. **Privacy**: Users cannot see other groups' data
4. **Performance**: Group membership lookup via efficient join
5. **Atomicity**: Group transitions are transactional

## Design Decisions

### Decision 1: Group Ownership Model

**Options Considered**:
- A) Flat groups (no owner concept)
- B) Owner + members (explicit roles)
- C) Democratic groups (vote on changes)
- D) Owner can transfer ownership

**Decision**: Option B - Owner + members

**Rationale**:
- Clear responsibility for group management
- Owner created the group (natural ownership)
- Enables future features (owner can remove members, delete group)
- Simple mental model
- Common pattern (Slack, Discord, etc.)
- Currently owner has no special powers (future-proofing)

### Decision 2: New User Group Assignment

**Options Considered**:
- A) No group until invited
- B) Auto-create personal group on signup
- C) Choose to create or join group on signup
- D) Default shared group for all users

**Decision**: Option B - Auto-create personal group

**Rationale**:
- Users can start using app immediately (no setup required)
- Avoids "group creation" UI complexity
- Natural progression: solo → invite friend → group of 2
- Matches mental model: "my list" → "our list"
- Database trigger creates group automatically on user creation

### Decision 3: Moving Between Groups

**Options Considered**:
- A) Cannot move between groups (locked in)
- B) Can accept invitation and move to new group
- C) Can belong to multiple groups simultaneously
- D) Can switch between groups

**Decision**: Option B - Accept invitation to move groups

**Rationale**:
- Simpler data model (one group per user)
- Matches primary use case (couples, not individuals in multiple groups)
- Clear what data you're seeing (no confusion about "which group am I in?")
- Can revisit multi-group support later if needed
- Warning message prevents accidental data loss

### Decision 4: Invitation Link Format

**Options Considered**:
- A) Email-based only (no link, just database record)
- B) Invitation code (6-digit code to enter)
- C) UUID in URL parameter
- D) Signed token in URL

**Decision**: Option C - UUID in URL parameter

**Rationale**:
- Easy to share (just copy/paste URL)
- No typing required (better UX than codes)
- UUID is unguessable (security)
- No need for signing complexity (invite ID lookup in DB is secure enough)
- Format: `/app/settings?invite=<uuid>`

### Decision 5: Invitation Validation

**Options Considered**:
- A) Anyone can accept any invitation
- B) Only specified email can accept
- C) Email verification required
- D) Check email on accept, but soft validation

**Decision**: Option D - Check email on accept (soft validation)

**Rationale**:
- Prevents accidents (wrong person accepting)
- Not strict security boundary (inviter trusts invitee to use right account)
- Allows flexibility (invitee can use different email if needed)
- Simple validation in RPC function
- Could add email verification later for stricter control

### Decision 6: Old Group Data Handling

**Options Considered**:
- A) Delete old group and all data when accepting invite
- B) Keep old group and data, orphaned
- C) Archive old data, accessible for export
- D) Merge data from old group into new group

**Decision**: Option B - Keep old group, orphaned

**Rationale**:
- Safer (no data loss)
- Can implement export/cleanup later
- Disk space is cheap
- Database constraints prevent issues
- Clearly warn user about losing access (not losing data)
- Future: Could add "export my old list" feature

### Decision 7: RPC Functions vs Client Queries

**Options Considered**:
- A) Client-side Supabase queries only
- B) RPC functions for all group operations
- C) RPC for complex operations, direct queries for simple reads
- D) GraphQL or similar abstraction

**Decision**: Option C - RPC for mutations, direct queries for reads

**Rationale**:
- **Create invite**: RPC ensures proper validation and return value
- **Accept invite**: RPC handles complex multi-table updates atomically
- **Get members**: RPC provides clean join (could be view, but RPC is flexible)
- **Get invites**: RPC for consistency
- Simple, no need for GraphQL overhead
- Type-safe with Supabase generated types

## Implementation Details

### Database Schema

**Tables**:

1. **groups**
   ```sql
   id BIGSERIAL PRIMARY KEY
   created_at TIMESTAMPTZ DEFAULT NOW()
   owner_user_id UUID REFERENCES auth.users(id)
   ```

2. **group_memberships**
   ```sql
   id BIGSERIAL PRIMARY KEY
   user_id UUID UNIQUE REFERENCES auth.users(id)
   group_id BIGINT REFERENCES groups(id)
   created_at TIMESTAMPTZ DEFAULT NOW()
   ```

3. **group_invites**
   ```sql
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
   group_id BIGINT REFERENCES groups(id)
   invited_email TEXT NOT NULL
   created_at TIMESTAMPTZ DEFAULT NOW()
   accepted_at TIMESTAMPTZ
   ```

4. **entries** (updated)
   ```sql
   group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE
   -- Unique constraint: (group_id, tmdb_id, media_type)
   ```

5. **tags** (updated)
   ```sql
   group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE
   is_custom BOOLEAN NOT NULL DEFAULT TRUE
   -- TMDB genre tags have group_id = NULL, is_custom = FALSE
   -- Custom tags have group_id = [user's group], is_custom = TRUE
   ```

### Triggers

1. **create_group_for_new_user**
   - Fires on INSERT to auth.users
   - Creates group with user as owner
   - Creates group_membership record

### RPC Functions

1. **create_group_invite(p_invited_email TEXT) → UUID**
   - Validates email format (basic)
   - Inserts invite record
   - Returns invite ID

2. **accept_group_invite(p_invite_id UUID) → VOID**
   - Validates invite exists and not yet accepted
   - Checks invited email matches current user
   - Updates group_membership to new group
   - Marks invite as accepted
   - All in transaction

3. **get_group_members() → TABLE(user_id UUID, email TEXT)**
   - Returns all members of current user's group
   - Joins group_memberships with auth.users

4. **get_pending_group_invites() → TABLE(id UUID, invited_email TEXT, created_at TIMESTAMPTZ)**
   - Returns all pending invites for current user's group
   - Filters where accepted_at IS NULL

### RLS Policies

1. **groups**: Users can read their own group
2. **group_memberships**: Users can read their own membership
3. **group_invites**:
   - Users can create invites for their group
   - Users can read invites for their group
   - Users can accept invites for their email
4. **entries**: Scoped to user's group (via group_id)
5. **tags**: Custom tags scoped to group, genre tags global

### UI Components

**Settings Page** (`app/settings/settings-page.tsx`):
- Account section (email display)
- Group section:
  - Accept invite banner (if `?invite=` param present)
  - Members list
  - Pending invites list
  - Create invite form (email input + button)
  - Generated invite link with copy button

**Reusable Components**:
- `SettingsSection` - Section with title
- `SettingsSubsection` - Subsection with description and error/success
- `TableView` - iOS-style table
- `TableViewRow` - Label + value row
- `TableViewActionButton` - Button with loading state

## Testing Strategy

### Integration Tests
- `group-invite.integration.test.ts`:
  - Create invite
  - Accept invite with correct email
  - Reject invite with wrong email
  - Verify group membership changes
  - Verify data scoping (can't see old group's data)

### Unit Tests
- `settings-page.test.tsx`:
  - Render members list
  - Render pending invites
  - Create invite flow
  - Copy invite link
  - Accept invite banner

### Manual Testing Checklist
- [ ] New user gets personal group automatically
- [ ] Can create invite for email
- [ ] Invite link is generated correctly
- [ ] Copy button copies invite link
- [ ] Invite shows in pending invites list
- [ ] Invite link opens settings page with banner
- [ ] Accept invite moves user to new group
- [ ] Accept invite shows warning about data loss
- [ ] Accepted invite disappears from pending list
- [ ] New member appears in members list
- [ ] New member sees inviter's entries
- [ ] New member cannot see old entries
- [ ] Wrong email cannot accept invite

## Dependencies

- **Database**: Supabase PostgreSQL with RLS
- **Auth**: Supabase Auth (for user_id and email)
- **Triggers**: PostgreSQL triggers for auto-group creation

## Security Considerations

### Data Isolation

- RLS policies enforce group boundaries
- Impossible to query other groups' data via Supabase client
- RPC functions validate user's group membership

### Invitation Security

- UUID invite IDs are unguessable (128-bit entropy)
- Email validation prevents wrong user accepting
- Invites cannot be reused (accepted_at timestamp)
- Future: Add expiration (created_at + 7 days)

### Privacy

- Group members can see each other's emails (intentional, for collaboration)
- No personal data beyond email is shared
- Entries and tags are group-scoped, not user-scoped

## Migration Strategy

**Database Migration** (`20260105174819_add_groups_and_group_scoped_entries.sql`):
1. Create groups table
2. Create group_memberships table
3. Create group_invites table
4. Add group_id to entries table
5. Add group_id to tags table
6. Create triggers for auto-group creation
7. Create RPC functions
8. Create RLS policies
9. Migrate existing data:
   - Create one group per existing user
   - Assign entries to user's group
   - Assign custom tags to user's group

**Rollout**:
- Deploy database migration
- Deploy application code
- Existing users automatically get personal groups
- New users get groups on signup
- Feature available immediately

## Future Enhancements

- **Remove Member**: Owner can remove members from group
- **Leave Group**: Member can leave group (creates new personal group)
- **Delete Group**: Owner can delete group (only if no other members)
- **Transfer Ownership**: Owner can transfer ownership to another member
- **Invite Expiration**: Invites expire after 7 days
- **Revoke Invite**: Owner can revoke pending invites
- **Invite History**: See all accepted invites (audit log)
- **Multiple Groups**: Allow users to belong to multiple groups
- **Switch Groups**: UI to switch between groups
- **Group Names**: Custom group names (default: "{owner}'s Group")
- **Group Settings**: Group-level settings (privacy, etc.)
- **Activity Feed**: See what group members are adding/watching
- **Notifications**: Email notifications for invites and updates
- **Anonymous Invites**: Generate invite link without specifying email

## Notes

- **Owner Powers**: Currently owner has no special powers; field is future-proofing
- **Data Cleanup**: Old groups are not automatically deleted (future: cleanup job)
- **Email Validation**: Basic validation only (format check, not deliverability)
- **Supabase Auth**: Uses Supabase auth.users table for user data
- **Group ID in Queries**: All queries must filter by group_id or join through group_memberships
