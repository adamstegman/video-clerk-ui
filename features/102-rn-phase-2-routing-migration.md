# Phase 2: Routing Migration

**Status**: Planned
**Estimated Effort**: 2-3 days
**Prerequisites**: Phase 1 complete (project setup)

## Context

This phase migrates the navigation system from React Router 7 to Expo Router. The current app uses file-system based routing with React Router's convention (`app.list.tsx` → `/app/list`). Expo Router also uses file-system routing but with a different convention (`app/list/index.tsx` → `/app/list`).

**Key Concepts**:
- **Layouts**: `_layout.tsx` files define shared UI (headers, tabs)
- **Groups**: Directories in `(parentheses)` group routes without affecting URL
- **Dynamic Routes**: `[param].tsx` files capture URL parameters
- **Protected Routes**: Auth guards implemented in layout files

## Current Route Structure

| Current File | URL Path | Purpose |
|--------------|----------|---------|
| `routes/_index.tsx` | `/` | Landing page |
| `routes/login.tsx` | `/login` | Auth screen |
| `routes/logout.tsx` | `/logout` | Logout action |
| `routes/forgot-password.tsx` | `/forgot-password` | Password reset |
| `routes/update-password.tsx` | `/update-password` | Password update |
| `routes/auth.confirm.tsx` | `/auth/confirm` | Email confirmation |
| `routes/auth.error.tsx` | `/auth/error` | Auth error |
| `routes/app.tsx` | `/app/*` | Protected layout |
| `routes/app._index.tsx` | `/app` | App index (redirect) |
| `routes/app.list.tsx` | `/app/list` | List layout |
| `routes/app.list._index.tsx` | `/app/list` | List view |
| `routes/app.list.$entryId.tsx` | `/app/list/:entryId` | Edit entry |
| `routes/app.list_.add.tsx` | `/app/add` | Add entry |
| `routes/app.watch.tsx` | `/app/watch` | Watch layout |
| `routes/app.watch._index.tsx` | `/app/watch` | Watch/swipe view |
| `routes/app.watch.$entryId.tsx` | `/app/watch/:entryId` | Winner view |
| `routes/app.settings.tsx` | `/app/settings` | Settings |

## Target Route Structure

```
app/
├── _layout.tsx                   # Root layout (providers)
├── index.tsx                     # Landing page (/)
├── login.tsx                     # Login (/login)
├── logout.tsx                    # Logout (/logout)
├── forgot-password.tsx           # Forgot password (/forgot-password)
├── update-password.tsx           # Update password (/update-password)
├── auth/
│   ├── confirm.tsx               # Email confirm (/auth/confirm)
│   └── error.tsx                 # Auth error (/auth/error)
└── (app)/                        # Protected group (URL: /app/*)
    ├── _layout.tsx               # Auth guard + providers
    ├── add.tsx                   # Add entry (/app/add) - modal
    └── (tabs)/                   # Tab navigator group
        ├── _layout.tsx           # Bottom tabs config
        ├── list/
        │   ├── _layout.tsx       # List stack
        │   ├── index.tsx         # List view (/app/list)
        │   └── [entryId].tsx     # Edit entry (/app/list/:entryId)
        ├── watch/
        │   ├── _layout.tsx       # Watch stack
        │   ├── index.tsx         # Watch view (/app/watch)
        │   └── [entryId].tsx     # Winner (/app/watch/:entryId)
        └── settings.tsx          # Settings (/app/settings)
```

## Files to Create

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout (update from Phase 1) |
| `app/index.tsx` | Landing page |
| `app/login.tsx` | Login screen |
| `app/logout.tsx` | Logout action |
| `app/forgot-password.tsx` | Password reset screen |
| `app/update-password.tsx` | Password update screen |
| `app/auth/confirm.tsx` | Email confirmation |
| `app/auth/error.tsx` | Auth error |
| `app/(app)/_layout.tsx` | Protected layout with auth guard |
| `app/(app)/add.tsx` | Add entry modal |
| `app/(app)/(tabs)/_layout.tsx` | Bottom tab navigator |
| `app/(app)/(tabs)/list/_layout.tsx` | List stack |
| `app/(app)/(tabs)/list/index.tsx` | List view |
| `app/(app)/(tabs)/list/[entryId].tsx` | Edit entry |
| `app/(app)/(tabs)/watch/_layout.tsx` | Watch stack |
| `app/(app)/(tabs)/watch/index.tsx` | Watch view |
| `app/(app)/(tabs)/watch/[entryId].tsx` | Winner view |
| `app/(app)/(tabs)/settings.tsx` | Settings |
| `src/contexts/auth-context.tsx` | Auth state management |

## Files to Reference

These existing files contain logic to extract:

| Current File | Extract |
|--------------|---------|
| `app/routes/app.tsx` | Auth guard logic (clientLoader) |
| `app/routes/login.tsx` | Login form and handlers |
| `app/app-data/app-data-provider.tsx` | User context pattern |
| `app/components/nav-bar/nav-bar.tsx` | Tab navigation items |

## Step-by-Step Instructions

### Step 1: Create Auth Context

Create `src/contexts/auth-context.tsx`:

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error ? new Error(error.message) : null };
  };

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

### Step 2: Update Root Layout

Update `app/_layout.tsx`:

```tsx
import "../global.css";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/auth-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Slot />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

**Note**: Using `<Slot />` instead of `<Stack />` at root allows more flexible layouts.

### Step 3: Create Landing Page

Create `app/index.tsx`:

```tsx
import { View, Text, Pressable } from "react-native";
import { Link, Redirect } from "expo-router";
import { useAuth } from "@/contexts/auth-context";

export default function LandingPage() {
  const { user, loading } = useAuth();

  // Redirect authenticated users to app
  if (!loading && user) {
    return <Redirect href="/(app)/(tabs)/list" />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-zinc-950 px-6">
      <Text className="text-4xl font-bold text-white">Video Clerk</Text>
      <Text className="mt-4 text-center text-lg text-zinc-400">
        Decide what to watch without the endless scrolling
      </Text>

      <View className="mt-12 w-full max-w-sm gap-4">
        <Link href="/login" asChild>
          <Pressable className="rounded-lg bg-indigo-600 px-6 py-4">
            <Text className="text-center text-lg font-semibold text-white">
              Get Started
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
```

### Step 4: Create Login Screen

Create `app/login.tsx`:

```tsx
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

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (!isSignUp) {
      router.replace("/(app)/(tabs)/list");
    } else {
      // Sign up successful - show confirmation message
      setError("Check your email to confirm your account");
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

        <View className="gap-4">
          <TextInput
            className="rounded-lg bg-zinc-800 px-4 py-4 text-white"
            placeholder="Email"
            placeholderTextColor="#71717a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            className="rounded-lg bg-zinc-800 px-4 py-4 text-white"
            placeholder="Password"
            placeholderTextColor="#71717a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />

          <Pressable
            className="mt-2 rounded-lg bg-indigo-600 px-6 py-4 disabled:opacity-50"
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
          <Pressable onPress={() => setIsSignUp(!isSignUp)}>
            <Text className="font-semibold text-indigo-400">
              {isSignUp ? "Sign In" : "Sign Up"}
            </Text>
          </Pressable>
        </View>

        {!isSignUp && (
          <Link href="/forgot-password" asChild>
            <Pressable className="mt-4">
              <Text className="text-center text-zinc-400">Forgot password?</Text>
            </Pressable>
          </Link>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
```

### Step 5: Create Protected Layout

Create `app/(app)/_layout.tsx`:

```tsx
import { Redirect, Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/contexts/auth-context";
import { AppDataProvider } from "@/contexts/app-data-context";
import { TMDBAPIProvider } from "@/tmdb-api/tmdb-api-provider";
import { TMDBConfigurationProvider } from "@/tmdb-api/tmdb-configuration";
import { TMDBGenresProvider } from "@/tmdb-api/tmdb-genres";

export default function AppLayout() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect href="/login" />;
  }

  // Wrap authenticated routes with providers
  return (
    <AppDataProvider user={user}>
      <TMDBAPIProvider>
        <TMDBConfigurationProvider>
          <TMDBGenresProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="add"
                options={{
                  presentation: "modal",
                  animation: "slide_from_bottom",
                }}
              />
            </Stack>
          </TMDBGenresProvider>
        </TMDBConfigurationProvider>
      </TMDBAPIProvider>
    </AppDataProvider>
  );
}
```

### Step 6: Create Tab Navigator

Create `app/(app)/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from "expo-router";
import { List, Play, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#18181b",
          borderTopColor: "#27272a",
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#71717a",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="list"
        options={{
          title: "List",
          tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="watch"
        options={{
          title: "Watch",
          tabBarIcon: ({ color, size }) => <Play color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### Step 7: Create List Stack

Create `app/(app)/(tabs)/list/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function ListLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[entryId]" />
    </Stack>
  );
}
```

### Step 8: Create List Placeholder

Create `app/(app)/(tabs)/list/index.tsx`:

```tsx
import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ListScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-zinc-950"
      style={{ paddingTop: insets.top + 16 }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-4">
        <Text className="text-2xl font-bold text-white">My List</Text>
        <Link href="/(app)/add" asChild>
          <Pressable className="rounded-full bg-indigo-600 p-2">
            <Plus color="white" size={24} />
          </Pressable>
        </Link>
      </View>

      {/* Placeholder content */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-zinc-400">List content will go here</Text>
        <Text className="mt-2 text-sm text-zinc-500">
          (Phase 5 will implement full list view)
        </Text>
      </View>
    </View>
  );
}
```

### Step 9: Create Edit Entry Placeholder

Create `app/(app)/(tabs)/list/[entryId].tsx`:

```tsx
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EditEntryScreen() {
  const insets = useSafeAreaInsets();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();

  return (
    <View
      className="flex-1 bg-zinc-950"
      style={{ paddingTop: insets.top + 16 }}
    >
      {/* Header */}
      <View className="flex-row items-center gap-4 px-4 pb-4">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color="white" size={24} />
        </Pressable>
        <Text className="text-xl font-bold text-white">Edit Entry</Text>
      </View>

      {/* Placeholder */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-zinc-400">Entry ID: {entryId}</Text>
        <Text className="mt-2 text-sm text-zinc-500">
          (Phase 5 will implement edit entry view)
        </Text>
      </View>
    </View>
  );
}
```

### Step 10: Create Watch Stack

Create `app/(app)/(tabs)/watch/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function WatchLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[entryId]" />
    </Stack>
  );
}
```

### Step 11: Create Watch Placeholder

Create `app/(app)/(tabs)/watch/index.tsx`:

```tsx
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WatchScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-zinc-950"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="px-4 pb-4">
        <Text className="text-2xl font-bold text-white">What to Watch?</Text>
      </View>

      <View className="flex-1 items-center justify-center">
        <Text className="text-zinc-400">Card swiping will go here</Text>
        <Text className="mt-2 text-sm text-zinc-500">
          (Phase 4 & 5 will implement swipe cards)
        </Text>
      </View>
    </View>
  );
}
```

### Step 12: Create Winner Placeholder

Create `app/(app)/(tabs)/watch/[entryId].tsx`:

```tsx
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WinnerScreen() {
  const insets = useSafeAreaInsets();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();

  return (
    <View
      className="flex-1 bg-zinc-950"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center gap-4 px-4 pb-4">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color="white" size={24} />
        </Pressable>
        <Text className="text-xl font-bold text-white">Winner!</Text>
      </View>

      <View className="flex-1 items-center justify-center">
        <Text className="text-zinc-400">Winner entry ID: {entryId}</Text>
        <Text className="mt-2 text-sm text-zinc-500">
          (Phase 5 will implement winner view)
        </Text>
      </View>
    </View>
  );
}
```

### Step 13: Create Settings Screen

Create `app/(app)/(tabs)/settings.tsx`:

```tsx
import { View, Text, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { LogOut, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View
      className="flex-1 bg-zinc-950"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="px-4 pb-4">
        <Text className="text-2xl font-bold text-white">Settings</Text>
      </View>

      <View className="px-4">
        {/* User info */}
        <View className="flex-row items-center gap-4 rounded-lg bg-zinc-900 p-4">
          <View className="rounded-full bg-zinc-800 p-3">
            <User color="#a1a1aa" size={24} />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-white">
              {user?.email ?? "User"}
            </Text>
            <Text className="text-sm text-zinc-400">Signed in</Text>
          </View>
        </View>

        {/* Sign out button */}
        <Pressable
          className="mt-4 flex-row items-center gap-3 rounded-lg bg-zinc-900 p-4"
          onPress={handleSignOut}
        >
          <LogOut color="#ef4444" size={20} />
          <Text className="text-red-500">Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

### Step 14: Create Add Entry Modal

Create `app/(app)/add.tsx`:

```tsx
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddEntryModal() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-zinc-950"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center justify-between px-4 pb-4">
        <Text className="text-xl font-bold text-white">Add to List</Text>
        <Pressable onPress={() => router.back()}>
          <X color="white" size={24} />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center">
        <Text className="text-zinc-400">Search will go here</Text>
        <Text className="mt-2 text-sm text-zinc-500">
          (Phase 5 will implement TMDB search)
        </Text>
      </View>
    </View>
  );
}
```

### Step 15: Create Logout Route

Create `app/logout.tsx`:

```tsx
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth-context";

export default function LogoutScreen() {
  const { signOut } = useAuth();

  useEffect(() => {
    const logout = async () => {
      await signOut();
      router.replace("/login");
    };
    logout();
  }, [signOut]);

  return (
    <View className="flex-1 items-center justify-center bg-zinc-950">
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}
```

### Step 16: Create Forgot Password Screen

Create `app/forgot-password.tsx`:

```tsx
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
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await resetPassword(email);

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for a password reset link");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-zinc-950"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center gap-4 px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color="white" size={24} />
        </Pressable>
        <Text className="text-xl font-bold text-white">Reset Password</Text>
      </View>

      <View className="flex-1 justify-center px-6">
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

        <Text className="mb-4 text-zinc-400">
          Enter your email address and we'll send you a link to reset your
          password.
        </Text>

        <TextInput
          className="rounded-lg bg-zinc-800 px-4 py-4 text-white"
          placeholder="Email"
          placeholderTextColor="#71717a"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Pressable
          className="mt-4 rounded-lg bg-indigo-600 px-6 py-4 disabled:opacity-50"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center text-lg font-semibold text-white">
              Send Reset Link
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
```

### Step 17: Create Auth Confirmation Routes

Create `app/auth/confirm.tsx`:

```tsx
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase/client";

export default function AuthConfirmScreen() {
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmAuth = async () => {
      // Handle token from URL (for web)
      const token_hash = params.token_hash as string | undefined;
      const type = params.type as string | undefined;

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "signup" | "recovery",
        });

        if (error) {
          setError(error.message);
        } else {
          router.replace("/(app)/(tabs)/list");
        }
      } else {
        setError("Invalid confirmation link");
      }
    };

    confirmAuth();
  }, [params]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950 px-6">
        <Text className="text-xl font-bold text-red-500">Error</Text>
        <Text className="mt-2 text-center text-zinc-400">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-zinc-950">
      <ActivityIndicator size="large" color="#6366f1" />
      <Text className="mt-4 text-zinc-400">Confirming...</Text>
    </View>
  );
}
```

Create `app/auth/error.tsx`:

```tsx
import { View, Text, Pressable } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";

export default function AuthErrorScreen() {
  const { message } = useLocalSearchParams<{ message?: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-zinc-950 px-6">
      <Text className="text-2xl font-bold text-red-500">
        Authentication Error
      </Text>
      <Text className="mt-4 text-center text-zinc-400">
        {message ?? "An error occurred during authentication"}
      </Text>

      <Link href="/login" asChild>
        <Pressable className="mt-8 rounded-lg bg-indigo-600 px-6 py-3">
          <Text className="font-semibold text-white">Back to Login</Text>
        </Pressable>
      </Link>
    </View>
  );
}
```

### Step 18: Create update-password.tsx

Create `app/update-password.tsx`:

```tsx
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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase/client";

export default function UpdatePasswordScreen() {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
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
          Update Password
        </Text>

        {error && (
          <View className="mb-4 rounded-lg bg-red-900/50 p-3">
            <Text className="text-center text-red-200">{error}</Text>
          </View>
        )}

        <View className="gap-4">
          <TextInput
            className="rounded-lg bg-zinc-800 px-4 py-4 text-white"
            placeholder="New Password"
            placeholderTextColor="#71717a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <TextInput
            className="rounded-lg bg-zinc-800 px-4 py-4 text-white"
            placeholder="Confirm New Password"
            placeholderTextColor="#71717a"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <Pressable
            className="mt-2 rounded-lg bg-indigo-600 px-6 py-4 disabled:opacity-50"
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-lg font-semibold text-white">
                Update Password
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
```

### Step 19: Create Stub Context Files

The protected layout references context providers. Create stubs until Phase 5:

Create `src/contexts/app-data-context.tsx`:

```tsx
import { createContext, useContext, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

interface AppData {
  user: User;
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  return (
    <AppDataContext.Provider value={{ user }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
```

Create stub files for TMDB providers (until Phase 5):

`src/tmdb-api/tmdb-api-provider.tsx`:
```tsx
import { createContext, type ReactNode } from "react";

export const TMDBAPIContext = createContext(null);

export function TMDBAPIProvider({ children }: { children: ReactNode }) {
  return <TMDBAPIContext.Provider value={null}>{children}</TMDBAPIContext.Provider>;
}
```

`src/tmdb-api/tmdb-configuration.tsx`:
```tsx
import { type ReactNode } from "react";

export function TMDBConfigurationProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

`src/tmdb-api/tmdb-genres.tsx`:
```tsx
import { type ReactNode } from "react";

export function TMDBGenresProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

## Test Guidance

### Manual Navigation Tests

1. **Landing page**:
   - Open app → Should show landing page with "Get Started" button
   - Click "Get Started" → Should navigate to login

2. **Authentication flow**:
   - On login page, enter credentials → Should redirect to list
   - Click "Sign Up" toggle → Form should switch modes
   - Click "Forgot password?" → Should go to reset page

3. **Protected routes**:
   - Try to access `/app/list` directly when logged out → Should redirect to login
   - Log in → Should access list page
   - Check all tabs work (List, Watch, Settings)

4. **Tab navigation**:
   - Click each tab → Should navigate to correct screen
   - Tab bar should show active state

5. **Modal navigation**:
   - From list, tap + button → Should open add modal from bottom
   - Tap X → Should close modal

6. **Dynamic routes**:
   - Navigate to `/app/list/123` → Should show entry ID
   - Back button should work

### Automated Tests

Create `__tests__/navigation.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { renderRouter } from "expo-router/testing-library";

// Mock auth context
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

describe("Navigation", () => {
  it("redirects to login when not authenticated", async () => {
    const { getByText } = renderRouter({
      initialUrl: "/(app)/(tabs)/list",
    });

    // Should redirect to login
    expect(getByText("Welcome Back")).toBeTruthy();
  });
});
```

## Acceptance Criteria

Complete this phase when ALL of the following are true:

- [ ] All route files created in correct locations
- [ ] `npx expo start --web` shows working navigation
- [ ] Landing page redirects authenticated users
- [ ] Login screen handles sign in/sign up
- [ ] Protected routes redirect unauthenticated users
- [ ] Bottom tabs navigate between List, Watch, Settings
- [ ] Add button opens modal
- [ ] Dynamic routes receive parameters (`[entryId]`)
- [ ] Back navigation works throughout app
- [ ] Auth context provides user state
- [ ] Settings shows user email and sign out works
- [ ] Forgot password flow works
- [ ] No TypeScript errors (`npm run typecheck`)

## Troubleshooting

### "Unable to resolve module"
Ensure all import paths use `@/` alias and files exist in `src/` directory.

### Tab bar not showing
Check that `(tabs)` directory has `_layout.tsx` with `<Tabs>` component.

### Auth redirect loop
Verify auth context properly initializes and `loading` state is handled.

### Modal not sliding up
Ensure `presentation: "modal"` is set in Stack.Screen options.

---

**Next Phase**: [Phase 3: Styling Migration](103-rn-phase-3-styling-migration.md)
