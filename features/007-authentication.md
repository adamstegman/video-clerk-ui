# Feature Spec: Authentication & User Management

**Status**: Implemented
**Date**: January 2026
**Related PRs**: f405e9e

## Overview

Secure user authentication system using Supabase Auth with email/password, email confirmation, password reset, and protected routes. Provides composable auth UI components for a consistent authentication experience.

## Problem Statement

Video Clerk requires user authentication to:
- Associate saved entries with specific users/groups
- Enforce data privacy and security
- Enable multi-user collaboration features
- Provide persistent data across devices

The auth system must be secure, user-friendly, and integrate seamlessly with the Supabase backend.

## Requirements

### Functional Requirements

1. **User Registration**
   - Email + password signup
   - Email confirmation via Supabase
   - Automatic group creation on signup (via trigger)
   - Redirect to app after confirmation

2. **User Login**
   - Email + password login
   - Remember login state across sessions
   - Redirect to app after login
   - Optional "return to" parameter for deep linking

3. **Password Reset**
   - "Forgot Password" flow
   - Email with reset link
   - New password entry
   - Redirect to app after reset

4. **Email Confirmation**
   - Confirmation email sent on signup
   - Confirmation link redirects to app
   - Handle confirmation errors gracefully

5. **Protected Routes**
   - All `/app/*` routes require authentication
   - Redirect to login if not authenticated
   - Preserve intended destination in returnTo parameter

6. **Logout**
   - Sign out current user
   - Clear session
   - Redirect to marketing page

7. **User Profile**
   - Display user email in settings
   - No profile editing yet (future)

### Non-Functional Requirements

1. **Security**: Passwords hashed by Supabase Auth
2. **Session Management**: HTTP-only cookies for session tokens
3. **Email Delivery**: Reliable email delivery via Supabase
4. **UX**: Clear error messages, loading states
5. **Mobile-Friendly**: Touch-friendly forms

## Design Decisions

### Decision 1: Auth Provider

**Options Considered**:
- A) Build custom auth system
- B) Firebase Auth
- C) Auth0
- D) Supabase Auth
- E) Clerk

**Decision**: Option D - Supabase Auth

**Rationale**:
- Already using Supabase for database
- Integrated auth + database (single service)
- Built-in email confirmation and password reset
- Row-Level Security integration
- No additional cost (included with Supabase)
- Good TypeScript SDK
- No need for third-party service

### Decision 2: Auth UI Components

**Options Considered**:
- A) Use Supabase Auth UI library
- B) Build custom components
- C) Use headless auth library
- D) Build composable component blocks

**Decision**: Option D - Composable component blocks

**Rationale**:
- Full control over styling and layout
- Composable blocks (AuthCard, AuthInput, AuthButton, etc.)
- Consistent with app design system
- No library overhead
- Easy to customize per page (login, signup, forgot password)
- Reusable across different auth flows

### Decision 3: Email Confirmation Strategy

**Options Considered**:
- A) No email confirmation (trust users)
- B) Optional email confirmation
- C) Required email confirmation
- D) Confirmation code (no email link)

**Decision**: Option C - Required email confirmation

**Rationale**:
- Prevents spam signups
- Verifies email for password reset
- Standard security practice
- Supabase provides out-of-the-box
- Can disable for development (Supabase setting)

### Decision 4: Session Persistence

**Options Considered**:
- A) In-memory only (lost on refresh)
- B) LocalStorage
- C) Cookies
- D) Supabase default (HTTP-only cookies)

**Decision**: Option D - Supabase default

**Rationale**:
- Secure (HTTP-only cookies not accessible to JS)
- Automatic refresh token rotation
- Works across tabs
- CSRF protection built-in
- No custom implementation needed

### Decision 5: Protected Route Implementation

**Options Considered**:
- A) Check auth in each page component
- B) Higher-order component wrapper
- C) Route-level loader (clientLoader)
- D) Middleware (not available in SPA mode)

**Decision**: Option C - clientLoader in parent route

**Rationale**:
- React Router 7 pattern (clientLoader)
- Runs before page renders (no flash of unauthorized content)
- Centralized in `/app/routes/app.tsx`
- Clean separation of concerns
- Can return redirect response
- Provides user data to all child routes via loader data

### Decision 6: Login Error Handling

**Options Considered**:
- A) Generic "Invalid credentials" message
- B) Specific errors ("Email not found", "Wrong password")
- C) Supabase error message as-is
- D) User-friendly message with error code

**Decision**: Option A - Generic message

**Rationale**:
- Security: Don't reveal which emails are registered
- Prevents user enumeration attacks
- Simpler UX (fewer messages to handle)
- Supabase errors can be cryptic, better to normalize

### Decision 7: Password Requirements

**Options Considered**:
- A) No requirements
- B) Minimum length only
- C) Complex requirements (uppercase, number, symbol)
- D) Supabase default

**Decision**: Option D - Supabase default (minimum 6 characters)

**Rationale**:
- Supabase enforces minimum 6 characters
- No need for overly complex requirements (reduces UX friction)
- Can add requirements later if needed
- Focus on email confirmation as primary security

## Implementation Details

### Composable Auth Components

**Base Components** (in `app/components/auth/`):

1. **AuthCard** - Container with padding and shadow
2. **AuthLogo** - App logo display
3. **AuthTitle** - Page title (e.g., "Sign In", "Create Account")
4. **AuthDescription** - Subtitle or description text
5. **AuthForm** - Form wrapper with onSubmit
6. **AuthInput** - Input field with label, error state, type
7. **AuthButton** - Submit button with loading state
8. **AuthLink** - Link to other auth pages
9. **AuthError** - Error message display

**Example Usage**:
```typescript
<AuthCard>
  <AuthLogo />
  <AuthTitle>Sign In</AuthTitle>
  <AuthDescription>Enter your credentials to continue</AuthDescription>
  <AuthForm onSubmit={handleSubmit}>
    <AuthInput
      label="Email"
      type="email"
      value={email}
      onChange={setEmail}
    />
    <AuthInput
      label="Password"
      type="password"
      value={password}
      onChange={setPassword}
    />
    <AuthError error={error} />
    <AuthButton loading={loading}>Sign In</AuthButton>
    <AuthLink to="/forgot-password">Forgot password?</AuthLink>
  </AuthForm>
</AuthCard>
```

### Auth Routes

1. **`/login`** - Login page
2. **`/forgot-password`** - Password reset request
3. **`/update-password`** - New password entry (from reset email)
4. **`/auth/confirm`** - Email confirmation handler
5. **`/auth/error`** - Auth error display
6. **`/logout`** - Logout handler (action)

### Protected Route Guard

**File**: `app/routes/app.tsx`

```typescript
export async function clientLoader({ request }: ClientLoaderArgs) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    const url = new URL(request.url);
    const returnTo = url.pathname + url.search;
    return redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return data;
}
```

All routes under `/app/*` inherit this loader, ensuring authentication.

### Supabase Client Factory

**File**: `app/lib/supabase/client.ts`

```typescript
export function createClient() {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );
}
```

### Login Flow

1. User enters email and password
2. Call `supabase.auth.signInWithPassword({ email, password })`
3. On success:
   - Session created automatically (cookie)
   - Redirect to `/app` (or `returnTo` URL)
4. On error:
   - Display error message
   - Keep user on login page

### Signup Flow

1. User enters email and password
2. Call `supabase.auth.signUp({ email, password })`
3. Supabase sends confirmation email
4. Show "Check your email" message
5. User clicks link in email
6. Redirect to `/auth/confirm`
7. Supabase confirms email automatically
8. Redirect to `/app`
9. Trigger creates group for new user

### Password Reset Flow

1. User enters email on `/forgot-password`
2. Call `supabase.auth.resetPasswordForEmail({ email })`
3. Show "Check your email" message
4. User clicks link in email
5. Redirect to `/update-password`
6. User enters new password
7. Call `supabase.auth.updateUser({ password })`
8. Redirect to `/app`

### Logout Flow

1. User clicks "Log Out" in settings
2. Navigate to `/logout`
3. Call `supabase.auth.signOut()`
4. Redirect to `/` (marketing page)

## Testing Strategy

### Unit Tests
- Mock Supabase auth methods
- Test component rendering
- Test form validation
- Test error states
- Test loading states

### Integration Tests
- Not implemented (would require test Supabase project)
- Could test with local Supabase instance

### Manual Testing Checklist
- [ ] Sign up with valid email/password
- [ ] Receive confirmation email
- [ ] Click confirmation link
- [ ] Redirect to app after confirmation
- [ ] Log in with confirmed account
- [ ] Wrong password shows error
- [ ] Unconfirmed account cannot log in
- [ ] Forgot password sends email
- [ ] Reset password link works
- [ ] New password is accepted
- [ ] Can log in with new password
- [ ] Protected routes redirect to login
- [ ] Return to URL preserved after login
- [ ] Logout clears session
- [ ] Cannot access app after logout

## Dependencies

- **Supabase Auth**: Authentication backend
- **@supabase/supabase-js**: Supabase JavaScript client
- **React Router**: Routing and loaders

## Email Configuration

**Supabase Email Templates**:
- **Confirm signup**: Sends link to `/auth/confirm`
- **Reset password**: Sends link to `/update-password`
- **Email change**: Sends link to confirm new email (future)

**Email Provider**:
- Development: Supabase built-in SMTP
- Production: Configure custom SMTP (SendGrid, AWS SES, etc.)

## Security Considerations

### Password Security
- Passwords hashed with bcrypt (Supabase default)
- Never stored in plain text
- Minimum 6 characters enforced

### Session Security
- HTTP-only cookies (not accessible to JavaScript)
- Secure flag in production (HTTPS only)
- SameSite=Lax for CSRF protection
- Automatic token refresh

### Email Security
- Email confirmation prevents fake signups
- Password reset requires email access
- No user enumeration (generic error messages)

### RLS Integration
- Supabase auth.uid() used in RLS policies
- Database enforces user/group boundaries
- Cannot access other users' data even with valid session

## Accessibility

- Semantic HTML (labels, form elements)
- Focus management (auto-focus email input)
- Error announcements for screen readers
- Keyboard navigation
- High contrast error states

## Future Enhancements

- **Social Login**: Google, GitHub, etc.
- **Two-Factor Authentication**: TOTP or SMS
- **Magic Links**: Passwordless login via email
- **Session Management**: View active sessions, revoke
- **Profile Editing**: Change email, display name
- **Account Deletion**: Delete account and all data
- **Email Change**: Update email address
- **Password Requirements**: Enforce stronger passwords
- **Rate Limiting**: Prevent brute force attacks
- **Account Recovery**: Additional recovery options
- **SSO**: Single sign-on for organizations

## Error Handling

### Common Errors

1. **Invalid credentials**: "Invalid email or password"
2. **Email not confirmed**: "Please confirm your email"
3. **Rate limit exceeded**: "Too many attempts, try again later"
4. **Network error**: "Connection failed, please try again"
5. **Invalid email format**: "Please enter a valid email"
6. **Password too short**: "Password must be at least 6 characters"

### Error Display
- Red text color
- Icon (alert triangle)
- Positioned below form fields
- Persists until next attempt
- Clear, actionable language

## Notes

- **Development**: Email confirmation can be disabled in Supabase settings for easier testing
- **Production**: Must configure custom SMTP for reliable email delivery
- **Session Duration**: Default 1 hour, auto-refresh extends indefinitely
- **Cookie Storage**: Cookies stored in browser (not LocalStorage for security)
- **CORS**: Supabase allows configured domains only
