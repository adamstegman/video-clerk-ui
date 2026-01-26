# Phase 6: Supabase & Authentication Updates

**Status**: Planned
**Estimated Effort**: 2-3 days
**Prerequisites**: Phase 1-5 complete

## Context

This phase finalizes the Supabase client configuration for React Native and ensures authentication works correctly on both web and iOS platforms. The key challenges are:
- Session persistence using AsyncStorage (instead of localStorage)
- Deep linking for OAuth callbacks and magic links
- Proper handling of auth state across app lifecycle

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/supabase/client.ts` | Finalize RN-compatible client |
| `src/contexts/auth-context.tsx` | Add session refresh and deep link handling |
| `app.json` | Add deep link scheme |
| `app/(app)/_layout.tsx` | Handle auth state properly |

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/supabase/auth-helpers.ts` | Auth utility functions |
| `app/auth/callback.tsx` | Handle OAuth/magic link callbacks |

## Step-by-Step Instructions

### Step 1: Finalize Supabase Client

Update `src/lib/supabase/client.ts`:

```typescript
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Platform, AppState, type AppStateStatus } from "react-native";
import type { Database } from "./database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
  );
}

// Create the Supabase client with platform-specific configuration
export const supabase = createSupabaseClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Use AsyncStorage for native, default for web
      storage: Platform.OS === "web" ? undefined : AsyncStorage,
      // Auto refresh token before expiry
      autoRefreshToken: true,
      // Persist session across app restarts
      persistSession: true,
      // Only detect session in URL on web (for OAuth callbacks)
      detectSessionInUrl: Platform.OS === "web",
      // Flow type for OAuth
      flowType: "pkce",
    },
  }
);

// Set up automatic token refresh when app comes to foreground (native only)
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

/**
 * Factory function for compatibility with existing code patterns.
 * Returns the singleton Supabase client.
 */
export function createClient() {
  return supabase;
}

/**
 * Get the current session, refreshing if needed.
 */
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session:", error.message);
    return null;
  }
  return session;
}

/**
 * Get the current user.
 */
export async function getUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error.message);
    return null;
  }
  return user;
}
```

### Step 2: Create Auth Helpers

Create `src/lib/supabase/auth-helpers.ts`:

```typescript
import { supabase } from "./client";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

/**
 * Get the redirect URL for OAuth callbacks.
 * On web, use the current origin. On native, use the app scheme.
 */
export function getRedirectUrl(): string {
  if (Platform.OS === "web") {
    return `${window.location.origin}/auth/callback`;
  }
  // Native: use the app's URL scheme
  return Linking.createURL("/auth/callback");
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data?.user ?? null, error };
}

/**
 * Sign up with email and password.
 */
export async function signUpWithEmail(email: string, password: string) {
  const redirectUrl = getRedirectUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });
  return { user: data?.user ?? null, error };
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Send a password reset email.
 */
export async function resetPassword(email: string) {
  const redirectUrl = getRedirectUrl().replace("/callback", "/update-password");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  return { error };
}

/**
 * Update the user's password.
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
}

/**
 * Sign in with OAuth provider (Google, Apple, etc.).
 * Opens a browser for the OAuth flow.
 */
export async function signInWithOAuth(
  provider: "google" | "apple" | "github"
) {
  const redirectUrl = getRedirectUrl();

  if (Platform.OS === "web") {
    // On web, use standard OAuth redirect
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  }

  // On native, use WebBrowser to open OAuth URL
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return { error: error ?? new Error("Failed to get OAuth URL") };
  }

  // Open the OAuth URL in a browser
  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectUrl
  );

  if (result.type === "success" && result.url) {
    // Extract the session from the callback URL
    const url = new URL(result.url);
    const params = new URLSearchParams(url.hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return { error: sessionError };
    }
  }

  return { error: null };
}

/**
 * Handle a deep link URL (for OAuth callbacks).
 */
export async function handleDeepLink(url: string) {
  // Check if this is an auth callback
  if (url.includes("/auth/callback") || url.includes("#access_token")) {
    // Extract tokens from URL
    const urlObj = new URL(url);

    // Handle hash-based tokens (OAuth)
    if (urlObj.hash) {
      const params = new URLSearchParams(urlObj.hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        return { type: "session" as const };
      }
    }

    // Handle query-based tokens (magic links, email confirmation)
    const tokenHash = urlObj.searchParams.get("token_hash");
    const type = urlObj.searchParams.get("type");

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "signup" | "recovery" | "email",
      });

      if (error) {
        return { type: "error" as const, error };
      }
      return { type: type as "signup" | "recovery" | "email" };
    }
  }

  return { type: "unknown" as const };
}
```

### Step 3: Update Auth Context

Update `src/contexts/auth-context.tsx`:

```typescript
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase/client";
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  handleDeepLink,
} from "@/lib/supabase/auth-helpers";
import type { User, Session, AuthError } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle deep links for auth callbacks (native only)
  useEffect(() => {
    if (Platform.OS === "web") return;

    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle URLs while app is open
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await signInWithEmail(email, password);
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await signUpWithEmail(email, password);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await authResetPassword(email);
    return { error };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

### Step 4: Create Auth Callback Route

Create `app/auth/callback.tsx`:

```typescript
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle different callback types
        const tokenHash = params.token_hash as string | undefined;
        const type = params.type as string | undefined;
        const errorDescription = params.error_description as string | undefined;

        if (errorDescription) {
          setError(decodeURIComponent(errorDescription));
          return;
        }

        if (tokenHash && type) {
          // Email confirmation or password recovery
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "signup" | "recovery" | "email",
          });

          if (error) {
            setError(error.message);
            return;
          }

          // Redirect based on type
          if (type === "recovery") {
            router.replace("/update-password");
          } else {
            router.replace("/(app)/(tabs)/list");
          }
        } else {
          // No valid params, redirect to home
          router.replace("/");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Authentication failed"
        );
      }
    };

    handleCallback();
  }, [params]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950 px-6">
        <Text className="text-xl font-bold text-red-500">
          Authentication Error
        </Text>
        <Text className="mt-4 text-center text-zinc-400">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-zinc-950">
      <ActivityIndicator size="large" color="#6366f1" />
      <Text className="mt-4 text-zinc-400">Authenticating...</Text>
    </View>
  );
}
```

### Step 5: Update app.json for Deep Linking

Ensure `app.json` has the correct scheme configuration:

```json
{
  "expo": {
    "name": "Video Clerk",
    "slug": "video-clerk",
    "scheme": "videoclerk",
    "ios": {
      "bundleIdentifier": "com.videoclerk.app",
      "supportsTablet": true,
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["videoclerk"]
          }
        ]
      }
    },
    "android": {
      "package": "com.videoclerk.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "videoclerk"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-linking",
        {
          "scheme": "videoclerk"
        }
      ]
    ]
  }
}
```

### Step 6: Update Login Screen

Update `app/login.tsx` to use the new auth helpers:

```typescript
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (isSignUp) {
      setMessage("Check your email to confirm your account");
    } else {
      router.replace("/(app)/(tabs)/list");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-zinc-950"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="mb-8 text-center text-3xl font-bold text-white">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>

        {error && (
          <View className="mb-4 rounded-lg bg-red-900/50 p-3">
            <Text className="text-center text-red-200">{error}</Text>
          </View>
        )}

        {message && (
          <View className="mb-4 rounded-lg bg-green-900/50 p-3">
            <Text className="text-center text-green-200">{message}</Text>
          </View>
        )}

        <View className="gap-4">
          <TextInput
            className="rounded-lg bg-zinc-800 px-4 py-4 text-white"
            placeholder="Email"
            placeholderTextColor="#71717a"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            autoCorrect={false}
          />

          <TextInput
            className="rounded-lg bg-zinc-800 px-4 py-4 text-white"
            placeholder="Password"
            placeholderTextColor="#71717a"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secureTextEntry
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />

          <Pressable
            className="mt-2 rounded-lg bg-indigo-600 px-6 py-4 active:bg-indigo-500 disabled:opacity-50"
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-lg font-semibold text-white">
                {isSignUp ? "Sign Up" : "Sign In"}
              </Text>
            )}
          </Pressable>
        </View>

        <View className="mt-6 flex-row justify-center gap-1">
          <Text className="text-zinc-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </Text>
          <Pressable
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
          >
            <Text className="font-semibold text-indigo-400">
              {isSignUp ? "Sign In" : "Sign Up"}
            </Text>
          </Pressable>
        </View>

        {!isSignUp && (
          <Link href="/forgot-password" asChild>
            <Pressable className="mt-4">
              <Text className="text-center text-zinc-400">
                Forgot password?
              </Text>
            </Pressable>
          </Link>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
```

### Step 7: Update Supabase Dashboard Settings

Configure your Supabase project to allow the new redirect URLs:

1. Go to **Authentication > URL Configuration**
2. Add redirect URLs:
   - Web: `https://your-domain.com/auth/callback`
   - iOS: `videoclerk://auth/callback`
3. Add site URL for each platform

### Step 8: Test Deep Link Handling

Create a test utility at `src/lib/supabase/__tests__/auth-helpers.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { getRedirectUrl } from "../auth-helpers";

describe("getRedirectUrl", () => {
  it("returns web URL on web platform", () => {
    vi.mock("react-native", () => ({
      Platform: { OS: "web" },
    }));

    // On web, should use window.location.origin
    const url = getRedirectUrl();
    expect(url).toContain("/auth/callback");
  });
});
```

## Test Guidance

### Manual Testing

1. **Email Sign Up**:
   - Enter email and password → Tap Sign Up
   - Should show "Check your email" message
   - Click email link → Should confirm and redirect to app

2. **Email Sign In**:
   - Enter existing credentials → Tap Sign In
   - Should navigate to list screen
   - Close and reopen app → Should still be signed in

3. **Password Reset**:
   - Tap "Forgot password?" → Enter email
   - Click email link → Should open update password screen
   - Enter new password → Should redirect to app

4. **Session Persistence**:
   - Sign in → Force close app completely
   - Reopen app → Should still be signed in
   - Works on both iOS and web

5. **Sign Out**:
   - Go to Settings → Tap Sign Out
   - Confirm → Should redirect to login
   - Reopen app → Should show login screen

6. **Deep Link Handling (iOS)**:
   - Test with: `npx uri-scheme open videoclerk://auth/callback?token_hash=xxx --ios`
   - Should handle the callback appropriately

### Integration Tests

Create `__tests__/auth/auth-flow.integration.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createAdminClient, createTestUser, cleanupTestUser } from "~/test-utils/supabase";

describe("Auth Flow", () => {
  let adminClient: ReturnType<typeof createAdminClient>;

  beforeEach(() => {
    adminClient = createAdminClient();
  });

  it("can create and authenticate a user", async () => {
    const email = `test-${Date.now()}@example.com`;
    const password = "testpassword123";

    // Create user via admin
    const { data: user, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    expect(createError).toBeNull();
    expect(user.user).toBeDefined();

    // Clean up
    if (user.user) {
      await adminClient.auth.admin.deleteUser(user.user.id);
    }
  });
});
```

## Acceptance Criteria

Complete this phase when ALL of the following are true:

- [ ] Supabase client configured with AsyncStorage for native
- [ ] Auto token refresh on app foreground (native)
- [ ] Auth context provides user, session, and auth methods
- [ ] Sign in with email works on web and iOS
- [ ] Sign up with email works and sends confirmation
- [ ] Password reset flow works end-to-end
- [ ] Deep links handled for auth callbacks (native)
- [ ] Session persists across app restarts
- [ ] Sign out clears session completely
- [ ] Protected routes redirect when not authenticated
- [ ] Auth errors display user-friendly messages
- [ ] No TypeScript errors
- [ ] Works on both web and iOS

## Troubleshooting

### Session not persisting on iOS
1. Verify AsyncStorage is properly installed: `npx expo install @react-native-async-storage/async-storage`
2. Clear app data and try again
3. Check Supabase client has `persistSession: true`

### Deep links not working
1. Verify app.json has correct scheme
2. Run `npx expo prebuild` to regenerate native config
3. Test with: `npx uri-scheme open videoclerk:// --ios`

### OAuth callback fails
1. Check redirect URLs in Supabase dashboard
2. Ensure expo-web-browser is installed
3. Verify scheme matches in app.json and redirect URL

### "Invalid Refresh Token" error
1. Sign out completely
2. Clear AsyncStorage: `AsyncStorage.clear()`
3. Sign in again

---

**Next Phase**: [Phase 7: Build & Deployment](107-rn-phase-7-build-deployment.md)
