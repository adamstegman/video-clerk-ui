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
    // Keep as a fallback, but prefer waiting on UI conditions below.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
  }

  function getPrimaryLikeButton() {
    return screen.getAllByRole("button", { name: "Like" })[0];
  }

  function getLikedCountFromCardsView() {
    const likedLabel = screen.getAllByText(/Liked:/i)[0];
    const span = likedLabel.querySelector("span");
    const n = span ? Number(span.textContent) : NaN;
    return n;
  }

  async function waitForCardsViewReady(expectedGoalText: RegExp) {
    await waitFor(() => {
      // Ensure a card is present (deck loaded)
      expect(screen.getByRole("group", { name: /Swipe card for/i })).toBeInTheDocument();
      // Ensure the liked counter is visible and has the expected goal (e.g. "/3")
      const likedLabels = screen.getAllByText(/Liked:/i);
      expect(
        likedLabels.some((label) => (label.textContent || "").match(expectedGoalText))
      ).toBe(true);
    });
  }

  async function clickLikeAndWaitForCardsCount(
    user: ReturnType<typeof userEvent.setup>,
    expected: number
  ) {
    await user.click(getPrimaryLikeButton());
    await waitFor(() => {
      expect(getLikedCountFromCardsView()).toBe(expected);
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
      await seedEntry(authedClient, base + 4, "D");

      const idA = await getEntryIdByTmdb(authedClient, groupId, base + 1);

      const user = userEvent.setup();
      const { router } = renderWatchRouter(["/app/watch"]);

      // Wait for deck to load
      await waitFor(() => {
        expect(screen.getByText("Watch")).toBeInTheDocument();
        expect(getPrimaryLikeButton()).toBeInTheDocument();
      });
      await waitForCardsViewReady(/\/\s*3/);

      // Like three to reach picker.
      await clickLikeAndWaitForCardsCount(user, 1);
      await clickLikeAndWaitForCardsCount(user, 2);
      await user.click(getPrimaryLikeButton());

      // Wait for pick mode to appear.
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Choose winner" })).toBeInTheDocument();
      });

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
      await user.click(screen.getAllByRole("button", { name: "Mark as Watched" })[0]);

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

  it("only-one-entry flow: auto-selects winner after 1 like, then mark watched", async () => {
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

      await waitFor(() => expect(getPrimaryLikeButton()).toBeInTheDocument());
      await waitForCardsViewReady(/\/\s*\d+/);

      // Like the only entry - should auto-select and skip picker
      await user.click(getPrimaryLikeButton());

      // Should go straight to winner view (no picker)
      await waitFor(() => {
        expect(router.state.location.pathname).toBe(`/app/watch/${entryId}`);
        expect(screen.getByText(/Selected to watch/i)).toBeInTheDocument();
      });

      await user.click(screen.getAllByRole("button", { name: "Mark as Watched" })[0]);

      await waitFor(() => expect(router.state.location.pathname).toBe("/app/watch"));

      const { data, error } = await authedClient.from("entries").select("watched_at").eq("id", entryId).single();
      expect(error).toBeNull();
      expect(data!.watched_at).toBeTruthy();
    } finally {
      await cleanupTestUser(admin, userId);
    }
  }, 30_000);

  it("only-two-entries flow: auto-selects winner after 1 like, mark watched", async () => {
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

      await waitFor(() => expect(getPrimaryLikeButton()).toBeInTheDocument());
      await waitForCardsViewReady(/\/\s*\d+/);

      // Like 1 of 2 entries - should auto-select and skip picker
      await user.click(getPrimaryLikeButton());

      // Should go straight to winner view (no picker)
      await waitFor(() => {
        expect(router.state.location.pathname).toMatch(/^\/app\/watch\/\d+$/);
        expect(screen.getByText(/Selected to watch/i)).toBeInTheDocument();
      });

      const winnerId = Number(router.state.location.pathname.split("/").pop());
      await user.click(screen.getAllByRole("button", { name: "Mark as Watched" })[0]);
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

