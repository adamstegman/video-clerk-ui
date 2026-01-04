import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ListPageContainer } from "./list-page-container";
import { TMDBConfigurationContext } from "../tmdb-api/tmdb-configuration";
import type { TMDBConfig } from "../tmdb-api/tmdb-api";

const mockOrder = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn(() => ({ order: mockOrder })));
const mockFrom = vi.hoisted(() => vi.fn(() => ({ select: mockSelect })));

vi.mock("../lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

const mockConfig: TMDBConfig = {
  images: {
    base_url: "http://image.tmdb.org/t/p/",
    secure_base_url: "https://image.tmdb.org/t/p/",
    backdrop_sizes: ["w300", "w780", "w1280", "original"],
    logo_sizes: ["w45", "w92", "w154", "w185", "w300", "w500", "original"],
    poster_sizes: ["w92", "w154", "w185", "w300", "w500", "w780", "original"],
    profile_sizes: ["w45", "w185", "h632", "original"],
    still_sizes: ["w92", "w185", "w300", "original"],
  },
  change_keys: [],
};

const mockConfigurationState = {
  ...mockConfig,
  error: null,
};

function renderWithProviders(initialEntries: string[] = ["/app/list"]) {
  const router = createMemoryRouter(
    [
      {
        path: "/app/list",
        element: (
          <TMDBConfigurationContext value={mockConfigurationState}>
            <ListPageContainer />
          </TMDBConfigurationContext>
        ),
      },
    ],
    {
      initialEntries,
      future: {
        v7_startTransition: true,
      },
    }
  );

  return render(<RouterProvider router={router} />);
}

describe("ListPageContainer", () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockOrder.mockReset();
  });

  it("shows a loading state while fetching", async () => {
    mockOrder.mockReturnValue(new Promise(() => {}));
    renderWithProviders();

    expect(screen.getByText("List of Saved Items")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders saved entries and normalizes relationship shapes", async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 1,
          added_at: "2026-01-04T00:00:00Z",
          tmdb_details: {
            poster_path: "/poster.jpg",
            name: "Fight Club",
            release_date: "1999-10-15",
          },
          entry_tags: [{ tags: { name: "Drama" } }, { tags: [{ name: "Thriller" }] }],
        },
        {
          id: 2,
          added_at: "2026-01-03T00:00:00Z",
          tmdb_details: [
            {
              poster_path: null,
              name: "Some Show",
              release_date: "2022-01-01",
            },
          ],
          entry_tags: null,
        },
      ],
      error: null,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
      expect(screen.getByText("1999")).toBeInTheDocument();
      expect(screen.getByText("Drama, Thriller")).toBeInTheDocument();
      expect(screen.getByText("Some Show")).toBeInTheDocument();
      expect(screen.getByText("2022")).toBeInTheDocument();
    });
  });

  it("renders an empty state when there are no entries", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Your list is empty.")).toBeInTheDocument();
    });
  });

  it("renders an error when the query fails", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "Boom" } });
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Boom")).toBeInTheDocument();
    });
  });
});

