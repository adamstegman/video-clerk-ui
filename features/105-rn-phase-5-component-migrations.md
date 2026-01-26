# Phase 5: Component Migrations

**Status**: Planned
**Estimated Effort**: 5-7 days
**Prerequisites**: Phase 1-4 complete

## Context

This phase migrates all remaining UI components and feature logic from the web React app to React Native. This is the largest phase, covering the List feature, Watch feature completion, Settings, and all shared components.

**Approach**: We'll migrate feature by feature, starting with the simpler ones (Settings, List) before completing the more complex Watch feature.

## Files to Migrate

### From `app/` (current) to `src/` (new)

| Current Location | New Location | Notes |
|-----------------|--------------|-------|
| `app/list/list-page-container.tsx` | `src/features/list/list-page-container.tsx` | Data fetching |
| `app/list/list-page.tsx` | `src/features/list/list-page.tsx` | Presentation |
| `app/list/saved-entry-row.tsx` | `src/features/list/entry-row.tsx` | Row component |
| `app/list/add-to-list-page.tsx` | `src/features/list/add-to-list.tsx` | Search & add |
| `app/list/edit-entry-page-container.tsx` | `src/features/list/edit-entry-container.tsx` | Edit data |
| `app/watch/watch-page-container.tsx` | `src/features/watch/watch-page-container.tsx` | Data fetching |
| `app/watch/watch-page.tsx` | Update existing | State machine |
| `app/watch/components/watch-picker-view.tsx` | `src/features/watch/components/picker-view.tsx` | Picker mode |
| `app/watch/components/watch-winner-view.tsx` | `src/features/watch/components/winner-view.tsx` | Winner mode |
| `app/settings/settings-page.tsx` | Update existing route | Already started |
| `app/tmdb-api/tmdb-api.ts` | `src/tmdb-api/tmdb-api.ts` | API class |
| `app/tmdb-api/tmdb-api-provider.tsx` | `src/tmdb-api/tmdb-api-provider.tsx` | Context |
| `app/tmdb-api/tmdb-configuration.tsx` | `src/tmdb-api/tmdb-configuration.tsx` | Config context |
| `app/tmdb-api/tmdb-genres.tsx` | `src/tmdb-api/tmdb-genres.tsx` | Genres context |
| `app/app-data/app-data-provider.tsx` | `src/contexts/app-data-context.tsx` | Update existing |

## Step-by-Step Instructions

### Part A: TMDB API Migration

#### Step A1: Migrate TMDB API Class

Copy and update `src/tmdb-api/tmdb-api.ts`:

```typescript
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export interface TMDBSearchResult {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  genre_ids: number[];
}

export interface TMDBSearchResponse {
  results: TMDBSearchResult[];
  total_results: number;
  total_pages: number;
}

export interface TMDBConfiguration {
  images: {
    base_url: string;
    secure_base_url: string;
    poster_sizes: string[];
    backdrop_sizes: string[];
  };
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBGenreList {
  genres: TMDBGenre[];
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  runtime: number;
  genres: TMDBGenre[];
}

export interface TMDBTVDetails {
  id: number;
  name: string;
  episode_run_time: number[];
  genres: TMDBGenre[];
}

export class TMDBAPI {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    return response.json();
  }

  async fetchConfiguration(): Promise<TMDBConfiguration> {
    return this.fetch<TMDBConfiguration>("/configuration");
  }

  async searchMulti(query: string): Promise<TMDBSearchResponse> {
    const encoded = encodeURIComponent(query);
    return this.fetch<TMDBSearchResponse>(`/search/multi?query=${encoded}`);
  }

  async fetchMovieGenres(): Promise<TMDBGenreList> {
    return this.fetch<TMDBGenreList>("/genre/movie/list");
  }

  async fetchTVGenres(): Promise<TMDBGenreList> {
    return this.fetch<TMDBGenreList>("/genre/tv/list");
  }

  async fetchMovieDetails(tmdbId: number): Promise<TMDBMovieDetails> {
    return this.fetch<TMDBMovieDetails>(`/movie/${tmdbId}`);
  }

  async fetchTVDetails(tmdbId: number): Promise<TMDBTVDetails> {
    return this.fetch<TMDBTVDetails>(`/tv/${tmdbId}`);
  }
}
```

#### Step A2: Update TMDB Provider

Update `src/tmdb-api/tmdb-api-provider.tsx`:

```typescript
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { TMDBAPI } from "./tmdb-api";

const TMDBAPIContext = createContext<TMDBAPI | null>(null);

export function TMDBAPIProvider({ children }: { children: ReactNode }) {
  const api = useMemo(() => {
    const token = process.env.EXPO_PUBLIC_TMDB_API_READ_TOKEN;
    if (!token) {
      console.warn("TMDB API token not configured");
      return null;
    }
    return new TMDBAPI(token);
  }, []);

  return (
    <TMDBAPIContext.Provider value={api}>{children}</TMDBAPIContext.Provider>
  );
}

export function useTMDBAPI(): TMDBAPI {
  const context = useContext(TMDBAPIContext);
  if (!context) {
    throw new Error("useTMDBAPI must be used within TMDBAPIProvider");
  }
  return context;
}
```

#### Step A3: Update TMDB Configuration Provider

Update `src/tmdb-api/tmdb-configuration.tsx`:

```typescript
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useTMDBAPI } from "./tmdb-api-provider";
import type { TMDBConfiguration } from "./tmdb-api";

interface TMDBConfigContextValue {
  config: TMDBConfiguration | null;
  loading: boolean;
  getPosterUrl: (path: string | null, size?: string) => string | undefined;
}

const TMDBConfigurationContext = createContext<TMDBConfigContextValue>({
  config: null,
  loading: true,
  getPosterUrl: () => undefined,
});

export function TMDBConfigurationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const api = useTMDBAPI();
  const [config, setConfig] = useState<TMDBConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await api.fetchConfiguration();
        if (!cancelled) {
          setConfig(data);
        }
      } catch (error) {
        console.error("Failed to load TMDB configuration:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const getPosterUrl = (path: string | null, size = "w500"): string | undefined => {
    if (!path || !config) return undefined;
    return `${config.images.secure_base_url}${size}${path}`;
  };

  return (
    <TMDBConfigurationContext.Provider value={{ config, loading, getPosterUrl }}>
      {children}
    </TMDBConfigurationContext.Provider>
  );
}

export function useTMDBConfiguration() {
  return useContext(TMDBConfigurationContext);
}
```

#### Step A4: Update TMDB Genres Provider

Update `src/tmdb-api/tmdb-genres.tsx`:

```typescript
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useTMDBAPI } from "./tmdb-api-provider";
import type { TMDBGenre } from "./tmdb-api";

interface TMDBGenresContextValue {
  genres: Map<number, string>;
  loading: boolean;
  getGenreNames: (ids: number[]) => string[];
}

const TMDBGenresContext = createContext<TMDBGenresContextValue>({
  genres: new Map(),
  loading: true,
  getGenreNames: () => [],
});

export function TMDBGenresProvider({ children }: { children: ReactNode }) {
  const api = useTMDBAPI();
  const [genres, setGenres] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [movieGenres, tvGenres] = await Promise.all([
          api.fetchMovieGenres(),
          api.fetchTVGenres(),
        ]);

        if (!cancelled) {
          const genreMap = new Map<number, string>();
          [...movieGenres.genres, ...tvGenres.genres].forEach((genre) => {
            genreMap.set(genre.id, genre.name);
          });
          setGenres(genreMap);
        }
      } catch (error) {
        console.error("Failed to load TMDB genres:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const getGenreNames = (ids: number[]): string[] => {
    return ids.map((id) => genres.get(id)).filter(Boolean) as string[];
  };

  return (
    <TMDBGenresContext.Provider value={{ genres, loading, getGenreNames }}>
      {children}
    </TMDBGenresContext.Provider>
  );
}

export function useTMDBGenres() {
  return useContext(TMDBGenresContext);
}
```

### Part B: List Feature Migration

#### Step B1: Create Entry Row Component

Create `src/features/list/entry-row.tsx`:

```typescript
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { ChevronRight, Check } from "lucide-react-native";
import { Link } from "expo-router";
import { useTMDBConfiguration } from "@/tmdb-api/tmdb-configuration";
import { cn } from "@/lib/utils";

export interface EntryRowData {
  id: number;
  title: string;
  releaseYear?: string;
  posterPath?: string | null;
  watched: boolean;
  mediaType: "movie" | "tv";
}

interface EntryRowProps {
  entry: EntryRowData;
}

export function EntryRow({ entry }: EntryRowProps) {
  const { getPosterUrl } = useTMDBConfiguration();
  const posterUrl = getPosterUrl(entry.posterPath, "w92");

  return (
    <Link href={`/(app)/(tabs)/list/${entry.id}`} asChild>
      <Pressable
        className={cn(
          "flex-row items-center gap-3 rounded-lg p-3 active:bg-zinc-800",
          entry.watched ? "opacity-60" : ""
        )}
      >
        {/* Poster */}
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            className="h-16 w-11 rounded-md"
            contentFit="cover"
          />
        ) : (
          <View className="h-16 w-11 items-center justify-center rounded-md bg-zinc-800">
            <Text className="text-xs text-zinc-500">No img</Text>
          </View>
        )}

        {/* Info */}
        <View className="flex-1">
          <Text
            className={cn("font-semibold", entry.watched ? "text-zinc-400" : "text-white")}
            numberOfLines={1}
          >
            {entry.title}
          </Text>
          <View className="flex-row items-center gap-2">
            {entry.releaseYear && (
              <Text className="text-sm text-zinc-500">{entry.releaseYear}</Text>
            )}
            <Text className="text-xs text-zinc-600">
              {entry.mediaType === "movie" ? "Movie" : "TV"}
            </Text>
          </View>
        </View>

        {/* Watched indicator or chevron */}
        {entry.watched ? (
          <Check color="#22c55e" size={20} />
        ) : (
          <ChevronRight color="#71717a" size={20} />
        )}
      </Pressable>
    </Link>
  );
}
```

#### Step B2: Create List Page Container

Create `src/features/list/list-page-container.tsx`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ListPage } from "./list-page";
import type { EntryRowData } from "./entry-row";

export function ListPageContainer() {
  const [entries, setEntries] = useState<EntryRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("entries")
        .select(
          `
          id,
          watched_at,
          tmdb_details (
            title,
            release_date,
            poster_path,
            media_type
          )
        `
        )
        .order("added_at", { ascending: false });

      if (error) throw error;

      // Normalize data
      const normalized: EntryRowData[] = (data ?? []).map((entry) => {
        const details = Array.isArray(entry.tmdb_details)
          ? entry.tmdb_details[0]
          : entry.tmdb_details;

        return {
          id: entry.id,
          title: details?.title ?? "Unknown",
          releaseYear: details?.release_date?.split("-")[0],
          posterPath: details?.poster_path,
          watched: !!entry.watched_at,
          mediaType: details?.media_type ?? "movie",
        };
      });

      setEntries(normalized);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load entries";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return (
    <ListPage
      entries={entries}
      loading={loading}
      error={error}
      onRefresh={loadEntries}
    />
  );
}
```

#### Step B3: Create List Page

Create `src/features/list/list-page.tsx`:

```typescript
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { Link } from "expo-router";
import { Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EntryRow, type EntryRowData } from "./entry-row";
import { Spinner } from "@/components/spinner";

interface ListPageProps {
  entries: EntryRowData[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function ListPage({ entries, loading, error, onRefresh }: ListPageProps) {
  const insets = useSafeAreaInsets();

  const unwatched = entries.filter((e) => !e.watched);
  const watched = entries.filter((e) => e.watched);

  if (loading && entries.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <Spinner size={32} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950 px-6">
        <Text className="text-red-500">{error}</Text>
        <Pressable
          className="mt-4 rounded-lg bg-zinc-800 px-4 py-2"
          onPress={onRefresh}
        >
          <Text className="text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold text-white">My List</Text>
        <Link href="/(app)/add" asChild>
          <Pressable className="rounded-full bg-indigo-600 p-2 active:bg-indigo-500">
            <Plus color="white" size={24} />
          </Pressable>
        </Link>
      </View>

      <FlatList
        data={[
          { type: "section", title: "To Watch", data: unwatched },
          { type: "section", title: "Watched", data: watched },
        ]}
        keyExtractor={(item, index) => `section-${index}`}
        renderItem={({ item }) => (
          <View className="px-4">
            {item.data.length > 0 && (
              <>
                <Text className="mb-2 mt-4 text-sm font-semibold uppercase text-zinc-500">
                  {item.title} ({item.data.length})
                </Text>
                {item.data.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-zinc-400">No entries yet</Text>
            <Link href="/(app)/add" asChild>
              <Pressable className="mt-4">
                <Text className="text-indigo-400">Add your first entry</Text>
              </Pressable>
            </Link>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}
```

#### Step B4: Update List Route

Update `app/(app)/(tabs)/list/index.tsx`:

```typescript
import { ListPageContainer } from "@/features/list/list-page-container";

export default function ListScreen() {
  return <ListPageContainer />;
}
```

#### Step B5: Create Add to List Screen

Create `src/features/list/add-to-list.tsx`:

```typescript
import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { X, Plus, Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTMDBAPI } from "@/tmdb-api/tmdb-api-provider";
import { useTMDBConfiguration } from "@/tmdb-api/tmdb-configuration";
import { createClient } from "@/lib/supabase/client";
import type { TMDBSearchResult } from "@/tmdb-api/tmdb-api";

export function AddToListScreen() {
  const insets = useSafeAreaInsets();
  const api = useTMDBAPI();
  const { getPosterUrl } = useTMDBConfiguration();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const search = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.searchMulti(query);
      // Filter to only movies and TV shows
      const filtered = response.results.filter(
        (r) => r.media_type === "movie" || r.media_type === "tv"
      );
      setResults(filtered);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  }, [api, query]);

  const saveToList = async (item: TMDBSearchResult) => {
    setSaving(item.id);
    try {
      const supabase = createClient();
      const title = item.title ?? item.name ?? "Unknown";
      const releaseDate = item.release_date ?? item.first_air_date;

      // Use RPC to save (handles tmdb_details upsert)
      const { error } = await supabase.rpc("save_tmdb_result_to_list", {
        p_tmdb_id: item.id,
        p_media_type: item.media_type,
        p_title: title,
        p_release_date: releaseDate ?? null,
        p_poster_path: item.poster_path,
        p_overview: item.overview,
        p_genre_ids: item.genre_ids,
      });

      if (error) throw error;

      setSaved((prev) => new Set(prev).add(item.id));
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(null);
    }
  };

  const renderResult = ({ item }: { item: TMDBSearchResult }) => {
    const title = item.title ?? item.name ?? "Unknown";
    const year = (item.release_date ?? item.first_air_date)?.split("-")[0];
    const posterUrl = getPosterUrl(item.poster_path, "w92");
    const isSaved = saved.has(item.id);
    const isSaving = saving === item.id;

    return (
      <View className="flex-row items-center gap-3 border-b border-zinc-800 py-3">
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            className="h-16 w-11 rounded-md"
            contentFit="cover"
          />
        ) : (
          <View className="h-16 w-11 items-center justify-center rounded-md bg-zinc-800">
            <Text className="text-xs text-zinc-500">No img</Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="font-semibold text-white" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-sm text-zinc-500">
            {year} • {item.media_type === "movie" ? "Movie" : "TV"}
          </Text>
        </View>

        <Pressable
          onPress={() => saveToList(item)}
          disabled={isSaved || isSaving}
          className="rounded-full bg-zinc-800 p-2 active:bg-zinc-700 disabled:opacity-50"
        >
          {isSaving ? (
            <ActivityIndicator size={20} color="#6366f1" />
          ) : isSaved ? (
            <Check color="#22c55e" size={20} />
          ) : (
            <Plus color="white" size={20} />
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-zinc-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-2 pt-4">
        <Text className="text-xl font-bold text-white">Add to List</Text>
        <Pressable onPress={() => router.back()}>
          <X color="white" size={24} />
        </Pressable>
      </View>

      {/* Search input */}
      <View className="px-4 py-2">
        <TextInput
          className="rounded-lg bg-zinc-800 px-4 py-3 text-white"
          placeholder="Search movies and TV shows..."
          placeholderTextColor="#71717a"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
          autoFocus
        />
      </View>

      {/* Results */}
      {searching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          renderItem={renderResult}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={
            query ? (
              <Text className="py-8 text-center text-zinc-500">
                No results found
              </Text>
            ) : (
              <Text className="py-8 text-center text-zinc-500">
                Search for movies and TV shows
              </Text>
            )
          }
        />
      )}
    </View>
  );
}
```

#### Step B6: Update Add Route

Update `app/(app)/add.tsx`:

```typescript
import { AddToListScreen } from "@/features/list/add-to-list";

export default function AddModal() {
  return <AddToListScreen />;
}
```

### Part C: Edit Entry Migration

#### Step C1: Create Edit Entry Screen

Create `src/features/list/edit-entry.tsx`:

```typescript
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Trash2, Check, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createClient } from "@/lib/supabase/client";
import { useTMDBConfiguration } from "@/tmdb-api/tmdb-configuration";
import { ActionButton } from "@/components/action-button";

interface EntryDetails {
  id: number;
  watchedAt: string | null;
  title: string;
  releaseDate?: string;
  posterPath?: string | null;
  overview?: string;
  runtime?: number;
  mediaType: "movie" | "tv";
  tags: Array<{ id: number; name: string }>;
}

export function EditEntryScreen() {
  const insets = useSafeAreaInsets();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { getPosterUrl } = useTMDBConfiguration();
  const [entry, setEntry] = useState<EntryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  const loadEntry = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("entries")
        .select(
          `
          id,
          watched_at,
          tmdb_details (
            title,
            release_date,
            poster_path,
            overview,
            runtime,
            media_type
          ),
          entry_tags (
            tag_id,
            tags (id, name)
          )
        `
        )
        .eq("id", entryId)
        .single();

      if (error) throw error;

      const details = Array.isArray(data.tmdb_details)
        ? data.tmdb_details[0]
        : data.tmdb_details;

      setEntry({
        id: data.id,
        watchedAt: data.watched_at,
        title: details?.title ?? "Unknown",
        releaseDate: details?.release_date,
        posterPath: details?.poster_path,
        overview: details?.overview,
        runtime: details?.runtime,
        mediaType: details?.media_type ?? "movie",
        tags: (data.entry_tags ?? []).map((et: any) => ({
          id: et.tags?.id ?? et.tag_id,
          name: et.tags?.name ?? "Unknown",
        })),
      });
    } catch (error) {
      console.error("Failed to load entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatched = async () => {
    if (!entry) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const newWatchedAt = entry.watchedAt ? null : new Date().toISOString();

      const { error } = await supabase
        .from("entries")
        .update({ watched_at: newWatchedAt })
        .eq("id", entry.id);

      if (error) throw error;

      setEntry({ ...entry, watchedAt: newWatchedAt });
    } catch (error) {
      console.error("Failed to update:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to remove this from your list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const supabase = createClient();
              await supabase.from("entries").delete().eq("id", entryId);
              router.back();
            } catch (error) {
              console.error("Failed to delete:", error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <Text className="text-red-500">Entry not found</Text>
      </View>
    );
  }

  const posterUrl = getPosterUrl(entry.posterPath, "w342");

  return (
    <View className="flex-1 bg-zinc-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-2 pt-4">
        <Pressable onPress={() => router.back()} className="p-1">
          <ArrowLeft color="white" size={24} />
        </Pressable>
        <Pressable onPress={deleteEntry} className="p-1">
          <Trash2 color="#ef4444" size={24} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Poster and title */}
        <View className="flex-row gap-4">
          {posterUrl ? (
            <Image
              source={{ uri: posterUrl }}
              className="h-48 w-32 rounded-lg"
              contentFit="cover"
            />
          ) : (
            <View className="h-48 w-32 items-center justify-center rounded-lg bg-zinc-800">
              <Text className="text-zinc-500">No poster</Text>
            </View>
          )}

          <View className="flex-1 justify-center">
            <Text className="text-xl font-bold text-white">{entry.title}</Text>
            {entry.releaseDate && (
              <Text className="mt-1 text-zinc-400">
                {entry.releaseDate.split("-")[0]}
              </Text>
            )}
            {entry.runtime && (
              <Text className="text-sm text-zinc-500">
                {Math.floor(entry.runtime / 60)}h {entry.runtime % 60}m
              </Text>
            )}

            {/* Tags */}
            {entry.tags.length > 0 && (
              <View className="mt-3 flex-row flex-wrap gap-1">
                {entry.tags.map((tag) => (
                  <View
                    key={tag.id}
                    className="rounded-full bg-zinc-800 px-2 py-1"
                  >
                    <Text className="text-xs text-zinc-300">{tag.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Overview */}
        {entry.overview && (
          <Text className="mt-6 text-zinc-400">{entry.overview}</Text>
        )}

        {/* Actions */}
        <View className="mt-8 gap-3">
          <ActionButton
            onPress={toggleWatched}
            loading={saving}
            variant={entry.watchedAt ? "secondary" : "primary"}
          >
            <View className="flex-row items-center justify-center gap-2">
              {entry.watchedAt ? (
                <>
                  <X color="white" size={20} />
                  <Text className="font-semibold text-white">
                    Mark as Unwatched
                  </Text>
                </>
              ) : (
                <>
                  <Check color="white" size={20} />
                  <Text className="font-semibold text-white">
                    Mark as Watched
                  </Text>
                </>
              )}
            </View>
          </ActionButton>
        </View>
      </ScrollView>
    </View>
  );
}
```

#### Step C2: Update Edit Route

Update `app/(app)/(tabs)/list/[entryId].tsx`:

```typescript
import { EditEntryScreen } from "@/features/list/edit-entry";

export default function EditEntryRoute() {
  return <EditEntryScreen />;
}
```

### Part D: Complete Watch Feature

#### Step D1: Create Watch Page Container

Create `src/features/watch/watch-page-container.tsx`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTMDBConfiguration } from "@/tmdb-api/tmdb-configuration";
import { useTMDBGenres } from "@/tmdb-api/tmdb-genres";
import { WatchPage } from "./watch-page";
import type { WatchCardEntry } from "./components/watch-card";

export function WatchPageContainer() {
  const { getPosterUrl } = useTMDBConfiguration();
  const { getGenreNames } = useTMDBGenres();
  const [entries, setEntries] = useState<WatchCardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("entries")
        .select(
          `
          id,
          tmdb_details (
            title,
            release_date,
            poster_path,
            genre_ids,
            runtime,
            media_type
          )
        `
        )
        .is("watched_at", null)
        .order("added_at", { ascending: false });

      if (error) throw error;

      const normalized: WatchCardEntry[] = (data ?? []).map((entry) => {
        const details = Array.isArray(entry.tmdb_details)
          ? entry.tmdb_details[0]
          : entry.tmdb_details;

        return {
          id: entry.id,
          title: details?.title ?? "Unknown",
          releaseYear: details?.release_date?.split("-")[0],
          posterUrl: getPosterUrl(details?.poster_path),
          genres: getGenreNames(details?.genre_ids ?? []),
          runtime: details?.runtime,
        };
      });

      setEntries(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [getPosterUrl, getGenreNames]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return (
    <WatchPage
      initialEntries={entries}
      loading={loading}
      error={error}
      onRefresh={loadEntries}
    />
  );
}
```

#### Step D2: Create Complete Watch Page

Create/update `src/features/watch/watch-page.tsx`:

```typescript
import { useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CardStack } from "./components/card-stack";
import { SwipeButtons } from "./components/swipe-buttons";
import { PickerView } from "./components/picker-view";
import { Spinner } from "@/components/spinner";
import type { WatchCardEntry } from "./components/watch-card";
import type { SwipeDirection } from "./hooks/use-card-swipe";

type WatchMode = "deck" | "picker" | "winner";

interface WatchPageProps {
  initialEntries: WatchCardEntry[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function WatchPage({
  initialEntries,
  loading,
  error,
  onRefresh,
}: WatchPageProps) {
  const insets = useSafeAreaInsets();
  const [deck, setDeck] = useState<WatchCardEntry[]>([]);
  const [liked, setLiked] = useState<WatchCardEntry[]>([]);
  const [mode, setMode] = useState<WatchMode>("deck");

  // Initialize deck when entries load
  useState(() => {
    if (initialEntries.length > 0 && deck.length === 0) {
      setDeck(initialEntries);
    }
  });

  // Calculate like goal
  const likeGoal = initialEntries.length <= 3 ? 1 : 3;

  const handleSwipe = useCallback(
    (direction: SwipeDirection, entry: WatchCardEntry) => {
      setDeck((prev) => prev.filter((e) => e.id !== entry.id));

      if (direction === "right") {
        setLiked((prev) => {
          const newLiked = [...prev, entry];
          // Check if goal reached
          if (newLiked.length >= likeGoal) {
            setMode("picker");
          }
          return newLiked;
        });
      }

      // Check if deck exhausted with some likes
      if (deck.length === 1 && liked.length > 0) {
        setMode("picker");
      }
    },
    [deck.length, liked.length, likeGoal]
  );

  const handleSelectWinner = (entry: WatchCardEntry) => {
    router.push(`/(app)/(tabs)/watch/${entry.id}`);
  };

  const handleStartOver = () => {
    setDeck(initialEntries);
    setLiked([]);
    setMode("deck");
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <Spinner size={32} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950 px-6">
        <Text className="text-red-500">{error}</Text>
        <Pressable
          className="mt-4 rounded-lg bg-zinc-800 px-4 py-2"
          onPress={onRefresh}
        >
          <Text className="text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (initialEntries.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center bg-zinc-950 px-6"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-xl font-bold text-white">Nothing to watch!</Text>
        <Text className="mt-2 text-center text-zinc-400">
          Add some movies or TV shows to your list first.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold text-white">What to Watch?</Text>
        <Text className="text-sm text-zinc-400">
          {liked.length}/{likeGoal} liked • {deck.length} remaining
        </Text>
      </View>

      {mode === "deck" && deck.length > 0 && (
        <>
          <View className="flex-1 items-center justify-center">
            <CardStack entries={deck} onSwipe={handleSwipe} />
          </View>
          <SwipeButtons
            onNope={() => handleSwipe("left", deck[0])}
            onLike={() => handleSwipe("right", deck[0])}
          />
        </>
      )}

      {mode === "deck" && deck.length === 0 && liked.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-zinc-400">No more cards</Text>
          <Pressable
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2"
            onPress={handleStartOver}
          >
            <Text className="text-white">Start Over</Text>
          </Pressable>
        </View>
      )}

      {mode === "picker" && (
        <PickerView
          entries={liked}
          onSelect={handleSelectWinner}
          onStartOver={handleStartOver}
        />
      )}
    </View>
  );
}
```

#### Step D3: Create Picker View

Create `src/features/watch/components/picker-view.tsx`:

```typescript
import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Check } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/action-button";
import type { WatchCardEntry } from "./watch-card";

interface PickerViewProps {
  entries: WatchCardEntry[];
  onSelect: (entry: WatchCardEntry) => void;
  onStartOver: () => void;
}

export function PickerView({ entries, onSelect, onStartOver }: PickerViewProps) {
  const [selected, setSelected] = useState<WatchCardEntry | null>(null);

  return (
    <View className="flex-1">
      <View className="px-4 py-2">
        <Text className="text-lg font-semibold text-white">
          Pick your winner!
        </Text>
        <Text className="text-sm text-zinc-400">
          Select one from your {entries.length} liked entries
        </Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="flex-row flex-wrap gap-3 py-4">
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => setSelected(entry)}
              className={cn(
                "w-[30%] overflow-hidden rounded-lg",
                selected?.id === entry.id && "ring-2 ring-indigo-500"
              )}
            >
              {entry.posterUrl ? (
                <Image
                  source={{ uri: entry.posterUrl }}
                  className="aspect-[2/3] w-full"
                  contentFit="cover"
                />
              ) : (
                <View className="aspect-[2/3] w-full items-center justify-center bg-zinc-800">
                  <Text className="text-xs text-zinc-500">No poster</Text>
                </View>
              )}

              {/* Selection indicator */}
              {selected?.id === entry.id && (
                <View className="absolute right-1 top-1 rounded-full bg-indigo-600 p-1">
                  <Check color="white" size={16} />
                </View>
              )}

              <View className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                <Text className="text-xs text-white" numberOfLines={1}>
                  {entry.title}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View className="gap-2 px-4 pb-8 pt-4">
        <ActionButton
          onPress={() => selected && onSelect(selected)}
          disabled={!selected}
        >
          Choose Winner
        </ActionButton>
        <ActionButton onPress={onStartOver} variant="ghost">
          Start Over
        </ActionButton>
      </View>
    </View>
  );
}
```

#### Step D4: Create Winner View

Create `src/features/watch/components/winner-view.tsx`:

```typescript
import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check, RotateCcw } from "lucide-react-native";
import { ActionButton } from "@/components/action-button";
import { createClient } from "@/lib/supabase/client";
import { useTMDBConfiguration } from "@/tmdb-api/tmdb-configuration";
import { Spinner } from "@/components/spinner";
import { useEffect } from "react";

interface WinnerDetails {
  id: number;
  title: string;
  releaseDate?: string;
  posterPath?: string | null;
  overview?: string;
  runtime?: number;
}

export function WinnerScreen() {
  const insets = useSafeAreaInsets();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { getPosterUrl } = useTMDBConfiguration();
  const [entry, setEntry] = useState<WinnerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  const loadEntry = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("entries")
        .select(
          `
          id,
          tmdb_details (
            title,
            release_date,
            poster_path,
            overview,
            runtime
          )
        `
        )
        .eq("id", entryId)
        .single();

      if (error) throw error;

      const details = Array.isArray(data.tmdb_details)
        ? data.tmdb_details[0]
        : data.tmdb_details;

      setEntry({
        id: data.id,
        title: details?.title ?? "Unknown",
        releaseDate: details?.release_date,
        posterPath: details?.poster_path,
        overview: details?.overview,
        runtime: details?.runtime,
      });
    } catch (error) {
      console.error("Failed to load winner:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsWatched = async () => {
    if (!entry) return;

    setMarking(true);
    try {
      const supabase = createClient();
      await supabase
        .from("entries")
        .update({ watched_at: new Date().toISOString() })
        .eq("id", entry.id);

      router.replace("/(app)/(tabs)/list");
    } catch (error) {
      console.error("Failed to mark watched:", error);
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <Spinner size={32} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <Text className="text-red-500">Entry not found</Text>
      </View>
    );
  }

  const posterUrl = getPosterUrl(entry.posterPath, "w500");

  return (
    <View className="flex-1 bg-zinc-950" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1">
        <View className="items-center px-4 py-8">
          <Text className="mb-4 text-2xl font-bold text-white">
            Tonight's Winner!
          </Text>

          {posterUrl && (
            <Image
              source={{ uri: posterUrl }}
              className="aspect-[2/3] w-64 rounded-xl"
              contentFit="cover"
            />
          )}

          <Text className="mt-4 text-center text-xl font-bold text-white">
            {entry.title}
          </Text>

          {entry.releaseDate && (
            <Text className="text-zinc-400">
              {entry.releaseDate.split("-")[0]}
              {entry.runtime && ` • ${Math.floor(entry.runtime / 60)}h ${entry.runtime % 60}m`}
            </Text>
          )}

          {entry.overview && (
            <Text className="mt-4 text-center text-zinc-400">
              {entry.overview}
            </Text>
          )}
        </View>
      </ScrollView>

      <View className="gap-2 px-4 pb-8 pt-4">
        <ActionButton onPress={markAsWatched} loading={marking}>
          <View className="flex-row items-center justify-center gap-2">
            <Check color="white" size={20} />
            <Text className="font-semibold text-white">Mark as Watched</Text>
          </View>
        </ActionButton>

        <ActionButton
          onPress={() => router.replace("/(app)/(tabs)/watch")}
          variant="secondary"
        >
          <View className="flex-row items-center justify-center gap-2">
            <RotateCcw color="white" size={20} />
            <Text className="font-semibold text-white">Back to Cards</Text>
          </View>
        </ActionButton>
      </View>
    </View>
  );
}
```

#### Step D5: Update Watch Routes

Update `app/(app)/(tabs)/watch/index.tsx`:
```typescript
import { WatchPageContainer } from "@/features/watch/watch-page-container";

export default function WatchScreen() {
  return <WatchPageContainer />;
}
```

Update `app/(app)/(tabs)/watch/[entryId].tsx`:
```typescript
import { WinnerScreen } from "@/features/watch/components/winner-view";

export default function WinnerRoute() {
  return <WinnerScreen />;
}
```

## Test Guidance

### Feature-by-Feature Testing

1. **TMDB Integration**:
   - Search for "Matrix" → Should return results
   - Posters should load with correct URLs
   - Genre names should map correctly

2. **List Feature**:
   - View list → Should show entries sorted by date
   - Pull to refresh → Should reload data
   - Tap entry → Should navigate to edit screen

3. **Add to List**:
   - Search → Should show results
   - Add entry → Should show checkmark
   - Close modal → Added entry should appear in list

4. **Edit Entry**:
   - View details → Poster, title, year visible
   - Mark watched → Should update and show checkmark
   - Delete → Should remove and navigate back

5. **Watch Feature**:
   - Swipe cards → Like/nope stamps appear
   - Reach goal → Picker view shows
   - Select winner → Winner screen shows
   - Mark watched → Navigates to list

## Acceptance Criteria

Complete this phase when ALL of the following are true:

- [ ] TMDB API class migrated and functional
- [ ] TMDB providers (API, Config, Genres) working
- [ ] List page shows entries from database
- [ ] Pull-to-refresh works on list
- [ ] Add modal searches TMDB and saves entries
- [ ] Edit screen shows entry details
- [ ] Mark as watched toggles correctly
- [ ] Delete entry works
- [ ] Watch page loads unwatched entries
- [ ] Card swiping works with real data
- [ ] Picker mode shows after like goal
- [ ] Winner screen displays and marks watched
- [ ] All navigation flows work correctly
- [ ] No TypeScript errors
- [ ] Works on both web and iOS

---

**Next Phase**: [Phase 6: Supabase & Auth Updates](106-rn-phase-6-supabase-auth.md)
