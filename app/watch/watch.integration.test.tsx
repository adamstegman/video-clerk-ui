import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { WatchPageContainer } from "./watch-page-container";
import {
  cleanupTestUser,
  createAdminClient,
  createTestUser,
  getGroupId,
  hasSupabaseEnv,
} from "~/test-utils/supabase";
import { TMDBConfigurationContext } from "../tmdb-api/tmdb-configuration";
import type { TMDBConfig } from "../tmdb-api/tmdb-api";

// Use real Supabase (local docker) when env is available; otherwise skip.
const describeIf = hasSupabaseEnv ? describe : describe.skip;

let authedClient: any;
vi.mock("../lib/supabase/client", () => ({
  createClient: () => authedClient,
}));

const mockConfig: TMDBConfig = {
  images: {
    base_url: null,
    secure_base_url: null,
    backdrop_sizes: [],
    logo_sizes: [],
    poster_sizes: [],
    profile_sizes: [],
    still_sizes: [],
  },
  change_keys: [],
};
const mockConfigurationState = { ...mockConfig, error: null };

async function seedEntry(authed: any, tmdbId: number, title: string) {
  const { error } = await authed.rpc("save_tmdb_result_to_list", {
    p_tmdb_id: tmdbId,
    p_media_type: "movie",
    p_title: title,
    p_adult: false,
    p_backdrop_path: null,
    p_poster_path: null,
    p_original_language: "en",
    p_overview: `Overview ${title}`,
    p_popularity: 1.23,
    p_vote_average: 8.8,
    p_vote_count: 123,
    p_original_name: null,
    p_release_date: "1999-10-15",
    p_origin_country: null,
    p_genre_ids: [18],
    p_genre_names: ["Drama"],
    p_runtime: 139,
  });
  expect(error).toBeNull();
}

async function getEntryIdByTmdb(authed: any, groupId: string, tmdbId: number) {
  const { data, error } = await authed
    .from("entries")
    .select("id")
    .eq("group_id", groupId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", "movie")
    .single();
  expect(error).toBeNull();
  return data!.id as number;
}

describeIf("Integration (UI + Supabase): watch flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function advanceSwipeAnimation() {
    // WatchPage uses a 220ms timeout to pop the card off the deck
    await act(async () => {
      await new Promise((r) => setTimeout(r, 260));
    });
  }

  function renderWatchRouter(initialEntries: string[]) {
    const router = createMemoryRouter(
      [
        {
          path: "/app/watch",
          element: (
            <TMDBConfigurationContext value={mockConfigurationState}>
              <WatchPageContainer />
            </TMDBConfigurationContext>
          ),
        },
        {
          path: "/app/watch/:entryId",
          element: (
            <TMDBConfigurationContext value={mockConfigurationState}>
              <WatchPageContainer />
            </TMDBConfigurationContext>
          ),
        },
      ],
      {
        initialEntries,
        future: { v7_startTransition: true },
      }
    );

    const view = render(<RouterProvider router={router} />);
    return { router, ...view };
  }

  it("main flow: like 3, choose winner, mark watched, return to /app/watch", async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    authedClient = testUser.client;

    const { userId } = testUser;

    try {
      const groupId = await getGroupId(authedClient);
      const base = Math.floor(Math.random() * 1_000_000) + 50_000;

      await seedEntry(authedClient, base + 1, "A");
      await seedEntry(authedClient, base + 2, "B");
      await seedEntry(authedClient, base + 3, "C");

      const idA = await getEntryIdByTmdb(authedClient, groupId, base + 1);

      const user = userEvent.setup();
      const { router } = renderWatchRouter(["/app/watch"]);

      // Wait for deck to load
      await waitFor(() => {
        expect(screen.getByText("Watch")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument();
      });

      // Like three to reach picker
      await user.click(screen.getByRole("button", { name: "Like" }));
      await advanceSwipeAnimation();
      await user.click(screen.getByRole("button", { name: "Like" }));
      await advanceSwipeAnimation();
      await user.click(screen.getByRole("button", { name: "Like" }));
      await advanceSwipeAnimation();

      // "You liked 3. Pick one to watch:" is split across text nodes, so match by full textContent.
      expect(
        screen.getByText((_, node) => (node?.textContent ?? "").includes("You liked 3") && (node?.textContent ?? "").includes("Pick one to watch"))
      ).toBeInTheDocument();

      // Pick one of the liked entries (accessible name includes title + year + overview).
      const pick =
        screen.queryByRole("button", { name: /^A\b/i }) ??
        screen.queryByRole("button", { name: /^B\b/i }) ??
        screen.queryByRole("button", { name: /^C\b/i });
      expect(pick).toBeTruthy();
      await user.click(pick!);

      // Ensure choose button enables after selection
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Choose winner" })).not.toBeDisabled();
      });

      await user.click(screen.getByRole("button", { name: "Choose winner" }));

      let winnerId: number | null = null;
      await waitFor(() => {
        expect(router.state.location.pathname).toMatch(/^\/app\/watch\/\d+$/);
        expect(screen.getByText(/Selected to watch/i)).toBeInTheDocument();
      });
      winnerId = Number(router.state.location.pathname.split("/").pop());
      expect(Number.isFinite(winnerId)).toBe(true);

      // Mark watched
      await user.click(screen.getByRole("button", { name: "Mark as Watched" }));

      // Should navigate back to /app/watch
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/app/watch");
      });

      // Winner entry should be marked watched in DB
      const { data: rowA, error: rowErr } = await authedClient
        .from("entries")
        .select("id, watched_at")
        .eq("id", idA)
        .single();
      expect(rowErr).toBeNull();
      const { data: chosenRow, error: chosenErr } = await authedClient
        .from("entries")
        .select("watched_at")
        .eq("id", winnerId)
        .single();
      expect(chosenErr).toBeNull();
      expect(chosenRow!.watched_at).toBeTruthy();

      // A might or might not be chosen; just keep this assertion loose.
      expect(rowA!.id).toBe(idA);
    } finally {
      await cleanupTestUser(admin, userId);
    }
  }, 30_000);

  it("only-one-entry flow: picker after 1 like, then mark watched", async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    authedClient = testUser.client;
    const { userId } = testUser;

    try {
      const groupId = await getGroupId(authedClient);
      const tmdbId = Math.floor(Math.random() * 1_000_000) + 80_000;
      await seedEntry(authedClient, tmdbId, "Solo");
      const entryId = await getEntryIdByTmdb(authedClient, groupId, tmdbId);

      const user = userEvent.setup();
      const { router } = renderWatchRouter(["/app/watch"]);

      await waitFor(() => expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: "Like" }));
      await advanceSwipeAnimation();

      expect(
        screen.getByText((_, node) => (node?.textContent ?? "").includes("You liked 1") && (node?.textContent ?? "").includes("Pick one to watch"))
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /^Solo\b/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Choose winner" })).not.toBeDisabled();
      });
      await user.click(screen.getByRole("button", { name: "Choose winner" }));

      await waitFor(() => expect(router.state.location.pathname).toBe(`/app/watch/${entryId}`));
      await user.click(screen.getByRole("button", { name: "Mark as Watched" }));

      await waitFor(() => expect(router.state.location.pathname).toBe("/app/watch"));

      const { data, error } = await authedClient.from("entries").select("watched_at").eq("id", entryId).single();
      expect(error).toBeNull();
      expect(data!.watched_at).toBeTruthy();
    } finally {
      await cleanupTestUser(admin, userId);
    }
  }, 30_000);

  it("only-two-entries flow: picker after 1 like, choose winner, mark watched", async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    authedClient = testUser.client;
    const { userId } = testUser;

    try {
      const groupId = await getGroupId(authedClient);
      const base = Math.floor(Math.random() * 1_000_000) + 110_000;
      await seedEntry(authedClient, base + 1, "One");
      await seedEntry(authedClient, base + 2, "Two");
      const entryId1 = await getEntryIdByTmdb(authedClient, groupId, base + 1);

      const user = userEvent.setup();
      const { router } = renderWatchRouter(["/app/watch"]);

      await waitFor(() => expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: "Like" }));
      await advanceSwipeAnimation();

      expect(
        screen.getByText((_, node) => (node?.textContent ?? "").includes("You liked 1") && (node?.textContent ?? "").includes("Pick one to watch"))
      ).toBeInTheDocument();

      // Choose "One" if present; otherwise choose whatever is present
      const onePick = screen.queryByRole("button", { name: /^One\b/i });
      if (onePick) await user.click(onePick);
      else await user.click(screen.getByRole("button", { name: /^Two\b/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Choose winner" })).not.toBeDisabled();
      });

      await user.click(screen.getByRole("button", { name: "Choose winner" }));

      await waitFor(() => {
        expect(router.state.location.pathname).toMatch(/^\/app\/watch\/\d+$/);
        expect(screen.getByRole("button", { name: "Mark as Watched" })).toBeInTheDocument();
      });

      const winnerId = Number(router.state.location.pathname.split("/").pop());
      await user.click(screen.getByRole("button", { name: "Mark as Watched" }));
      await waitFor(() => expect(router.state.location.pathname).toBe("/app/watch"));

      const { data: row, error } = await authedClient.from("entries").select("watched_at").eq("id", winnerId).single();
      expect(error).toBeNull();
      expect(row!.watched_at).toBeTruthy();

      // Ensure at least one known row still exists
      const { data: row1, error: row1Err } = await authedClient.from("entries").select("id").eq("id", entryId1).single();
      expect(row1Err).toBeNull();
      expect(row1!.id).toBe(entryId1);
    } finally {
      await cleanupTestUser(admin, userId);
    }
  }, 30_000);
});

