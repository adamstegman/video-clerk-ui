import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { EditEntryPageContainer } from "./edit-entry-page-container";
import {
  cleanupTestUser,
  createAdminClient,
  createTestUser,
  getGroupId,
  hasSupabaseEnv,
} from "~/test-utils/supabase";
import { TMDBConfigurationContext } from "../tmdb-api/tmdb-configuration";
import type { TMDBConfig } from "../tmdb-api/tmdb-api";

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

function renderEditEntryRouter(initialEntries: string[]) {
  const router = createMemoryRouter(
    [
      {
        path: "/app/list/:entryId",
        element: (
          <TMDBConfigurationContext value={mockConfigurationState}>
            <EditEntryPageContainer />
          </TMDBConfigurationContext>
        ),
      },
      {
        path: "/app/list",
        element: <div>List view</div>,
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

describeIf("Integration (UI + Supabase): edit entry page", () => {
  it("updates tags and deletes an entry", async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);
    authedClient = testUser.client;

    const { userId } = testUser;

    try {
      const groupId = await getGroupId(authedClient);
      const tmdbId = Math.floor(Math.random() * 1_000_000) + 200_000;
      await seedEntry(authedClient, tmdbId, "Edit Target");
      const entryId = await getEntryIdByTmdb(authedClient, groupId, tmdbId);

      const user = userEvent.setup();
      const { router } = renderEditEntryRouter([`/app/list/${entryId}`]);

      await waitFor(() => {
        expect(screen.getByText("Edit entry")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Remove tag Drama" })).toBeInTheDocument();
      });
      const tagsInput = await screen.findByLabelText("Add tag");
      const customTag = `Custom-${Math.floor(Math.random() * 1_000_000)}`;
      await user.type(tagsInput, `${customTag}{enter}`);
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: `Remove tag ${customTag}` })
        ).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(
        () => {
          expect(router.state.location.pathname).toBe("/app/list");
          expect(screen.getByText("List view")).toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      const { data: entryTags, error: tagsError } = await authedClient
        .from("entry_tags")
        .select("tags(name)")
        .eq("entry_id", entryId);
      expect(tagsError).toBeNull();

      const tagNames =
        entryTags
          ?.map((row: any) => {
            if (!row.tags) return null;
            if (Array.isArray(row.tags)) return row.tags[0]?.name ?? null;
            return row.tags.name ?? null;
          })
          .filter(Boolean) ?? [];
      expect(tagNames).toEqual(expect.arrayContaining(["Drama", customTag]));

      await router.navigate(`/app/list/${entryId}`);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Delete entry" })).toBeInTheDocument();
      });

      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
      await user.click(screen.getByRole("button", { name: "Delete entry" }));

      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/app/list");
        expect(screen.getByText("List view")).toBeInTheDocument();
      });
      confirmSpy.mockRestore();

      const { data: remaining, error: remainingError } = await authedClient
        .from("entries")
        .select("id")
        .eq("id", entryId);
      expect(remainingError).toBeNull();
      expect(remaining).toHaveLength(0);
    } finally {
      await cleanupTestUser(admin, userId);
    }
  }, 30_000);
});
