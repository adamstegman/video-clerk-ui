import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { WatchPage } from "./watch-page";
import type { WatchCardEntry } from "./components/watch-card";
import { TMDBConfigurationContext } from "../tmdb-api/tmdb-configuration";
import type { TMDBConfig } from "../tmdb-api/tmdb-api";

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

function makeEntry(id: number, title: string): WatchCardEntry {
  return {
    id,
    title,
    overview: `Overview ${title}`,
    releaseYear: "2024",
    posterPath: null,
    backdropPath: null,
    mediaType: "movie",
    runtime: null,
    tags: [],
  };
}

function renderWatchPage(opts: {
  initialEntries: WatchCardEntry[];
  winnerEntryId?: number | null;
  winnerEntry?: WatchCardEntry | null;
  winnerLoading?: boolean;
  winnerError?: string | null;
  onGoToWinner?: (e: WatchCardEntry) => void;
  onMarkWatched?: (id: number) => Promise<void>;
  onBackToCards?: () => void;
}) {
  const onGoToWinner = opts.onGoToWinner ?? vi.fn();
  const onMarkWatched = opts.onMarkWatched ?? vi.fn(async () => {});
  const onBackToCards = opts.onBackToCards ?? vi.fn();

  const result = render(
    <TMDBConfigurationContext value={mockConfigurationState}>
      <WatchPage
        initialEntries={opts.initialEntries}
        loading={false}
        error={null}
        onReload={vi.fn(async () => {})}
        winnerEntryId={opts.winnerEntryId ?? null}
        winnerEntry={opts.winnerEntry ?? null}
        winnerLoading={opts.winnerLoading ?? false}
        winnerError={opts.winnerError ?? null}
        onGoToWinner={onGoToWinner}
        onMarkWatched={onMarkWatched}
        onBackToCards={onBackToCards}
      />
    </TMDBConfigurationContext>
  );

  return { ...result, onGoToWinner, onMarkWatched, onBackToCards };
}

function getPrimaryLikeButton() {
  return screen.getAllByRole("button", { name: "Like" })[0];
}

function getPrimaryNopeButton() {
  return screen.getAllByRole("button", { name: "Nope" })[0];
}

function completeQuestionnaire() {
  // Click "Movie" option (simplest filter that matches all movie entries)
  const movieButton = screen.getByRole("button", { name: /Movie.*Feature length film/i });
  fireEvent.click(movieButton);

  // Click "Start Swiping"
  const startButton = screen.getByRole("button", { name: /Start Swiping/i });
  fireEvent.click(startButton);
}

describe("WatchPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("main branch: requires 3 likes before showing the picker", async () => {
    const entries = [makeEntry(1, "A"), makeEntry(2, "B"), makeEntry(3, "C"), makeEntry(4, "D")];
    renderWatchPage({ initialEntries: entries });
    completeQuestionnaire();

    // Like 1
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));
    expect(screen.queryByText(/Pick one to watch/i)).not.toBeInTheDocument();

    // Like 2
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));
    expect(screen.queryByText(/Pick one to watch/i)).not.toBeInTheDocument();

    // Like 3 => picker
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByText(/Pick one to watch/i)).toBeInTheDocument();
    expect(screen.getByText("You liked 3. Pick one to watch:")).toBeInTheDocument();
  });

  it("main branch: shows picker if deck ends with 2 likes", async () => {
    const entries = [makeEntry(1, "A"), makeEntry(2, "B"), makeEntry(3, "C"), makeEntry(4, "D")];
    renderWatchPage({ initialEntries: entries });
    completeQuestionnaire();

    // Like 2
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));

    // Nope remaining cards to exhaust the deck
    fireEvent.click(getPrimaryNopeButton());
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(getPrimaryNopeButton());
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByText(/Pick one to watch/i)).toBeInTheDocument();
    expect(screen.getByText("You liked 2. Pick one to watch:")).toBeInTheDocument();

    // Verify we have exactly 2 picker buttons (randomization means we don't know which specific entries)
    // Picker buttons contain "Overview" and are not the action buttons
    const pickerButtons = screen.getAllByRole("button").filter(btn => {
      const text = btn.textContent || "";
      return text.includes("Overview") && text.includes("2024");
    });
    expect(pickerButtons).toHaveLength(2);
  });

  it("main branch: auto-selects winner if deck ends with only 1 like", async () => {
    const onGoToWinner = vi.fn();
    const entries = [makeEntry(1, "A"), makeEntry(2, "B"), makeEntry(3, "C"), makeEntry(4, "D")];
    renderWatchPage({ initialEntries: entries, onGoToWinner });
    completeQuestionnaire();

    // Like 1, nope 3 to exhaust deck
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(getPrimaryNopeButton());
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(getPrimaryNopeButton());
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(getPrimaryNopeButton());
    act(() => vi.advanceTimersByTime(250));

    // Should skip picker and auto-select the single liked entry
    expect(onGoToWinner).toHaveBeenCalledTimes(1);

    // Could be any of the 4 entries due to randomization
    const winner = onGoToWinner.mock.calls[0][0];
    expect([1, 2, 3, 4]).toContain(winner.id);
    expect(["A", "B", "C", "D"]).toContain(winner.title);
  });

  it("small-deck branch: auto-selects winner when only 1 entry is liked", async () => {
    const onGoToWinner = vi.fn();
    const entries = [makeEntry(1, "Only A"), makeEntry(2, "Only B")];
    renderWatchPage({ initialEntries: entries, onGoToWinner });
    completeQuestionnaire();

    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));

    // Should skip picker and call onGoToWinner directly
    expect(onGoToWinner).toHaveBeenCalledTimes(1);

    // Could be either entry due to randomization
    const winner = onGoToWinner.mock.calls[0][0];
    expect([1, 2]).toContain(winner.id);
    expect(["Only A", "Only B"]).toContain(winner.title);
  });

  it("winner branch: Back to cards resets local state after auto-select", async () => {
    const onGoToWinner = vi.fn();
    const onBackToCards = vi.fn();
    const entries = [makeEntry(1, "A"), makeEntry(2, "B")];
    const winner = entries[0];

    const { rerender } = render(
      <TMDBConfigurationContext value={mockConfigurationState}>
        <WatchPage
          initialEntries={entries}
          loading={false}
          error={null}
          onReload={vi.fn(async () => {})}
          winnerEntryId={null}
          winnerEntry={null}
          winnerLoading={false}
          winnerError={null}
          onGoToWinner={onGoToWinner}
          onMarkWatched={vi.fn(async () => {})}
          onBackToCards={onBackToCards}
        />
      </TMDBConfigurationContext>
    );
    completeQuestionnaire();

    // Like 1 entry -> auto-selects winner
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));
    expect(onGoToWinner).toHaveBeenCalledTimes(1);

    // Simulate container updating winnerEntryId (shows winner view)
    rerender(
      <TMDBConfigurationContext value={mockConfigurationState}>
        <WatchPage
          initialEntries={entries}
          loading={false}
          error={null}
          onReload={vi.fn(async () => {})}
          winnerEntryId={winner.id}
          winnerEntry={winner}
          winnerLoading={false}
          winnerError={null}
          onGoToWinner={onGoToWinner}
          onMarkWatched={vi.fn(async () => {})}
          onBackToCards={onBackToCards}
        />
      </TMDBConfigurationContext>
    );

    expect(screen.getAllByRole("button", { name: "Back to cards" })[0]).toBeInTheDocument();

    // Click Back to cards
    fireEvent.click(screen.getAllByRole("button", { name: "Back to cards" })[0]);
    expect(onBackToCards).toHaveBeenCalledTimes(1);

    // Simulate container clearing winnerEntryId
    rerender(
      <TMDBConfigurationContext value={mockConfigurationState}>
        <WatchPage
          initialEntries={entries}
          loading={false}
          error={null}
          onReload={vi.fn(async () => {})}
          winnerEntryId={null}
          winnerEntry={null}
          winnerLoading={false}
          winnerError={null}
          onGoToWinner={onGoToWinner}
          onMarkWatched={vi.fn(async () => {})}
          onBackToCards={onBackToCards}
        />
      </TMDBConfigurationContext>
    );

    // Should be back at questionnaire, not re-triggering onGoToWinner
    expect(screen.getByText(/How much time do you have\?/i)).toBeInTheDocument();
    expect(onGoToWinner).toHaveBeenCalledTimes(1); // Still only 1 call
  });

  it("cards view: renders stacked cards from the deck", () => {
    const entries = [makeEntry(1, "A"), makeEntry(2, "B"), makeEntry(3, "C")];
    renderWatchPage({ initialEntries: entries });
    completeQuestionnaire();

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("cards view: does not enter picker before like threshold", async () => {
    const entries = [makeEntry(1, "A"), makeEntry(2, "B"), makeEntry(3, "C"), makeEntry(4, "D")];
    renderWatchPage({ initialEntries: entries });
    completeQuestionnaire();

    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));

    expect(screen.queryByText(/Pick one to watch/i)).not.toBeInTheDocument();
  });

  it("cards view: promotes the next card after a swipe", async () => {
    const entries = [makeEntry(1, "A"), makeEntry(2, "B"), makeEntry(3, "C"), makeEntry(4, "D")];
    renderWatchPage({ initialEntries: entries });
    completeQuestionnaire();

    // Get the title of the first card (randomized, so we need to capture it)
    const cardGroup = screen.getByRole("group", { name: /Swipe card for/i });
    const firstCardTitle = cardGroup.querySelector("h3")?.textContent;
    expect(firstCardTitle).toBeTruthy();

    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));

    // First card should be gone, replaced by next card
    const newCardGroup = screen.getByRole("group", { name: /Swipe card for/i });
    const newCardTitle = newCardGroup.querySelector("h3")?.textContent;
    expect(newCardTitle).toBeTruthy();
    expect(newCardTitle).not.toBe(firstCardTitle);
  });

  it("picker branch: Choose winner calls onGoToWinner with the selected entry", async () => {
    const onGoToWinner = vi.fn();
    const entries = [makeEntry(1, "A"), makeEntry(2, "B"), makeEntry(3, "C"), makeEntry(4, "D")];
    renderWatchPage({ initialEntries: entries, onGoToWinner });
    completeQuestionnaire();

    // Like 3 items to enter pick mode (likeGoal=3)
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByText(/Pick one to watch/i)).toBeInTheDocument();

    // Select whichever entry is first in the picker (randomized)
    // Picker buttons contain "Overview" and are not the action buttons
    const pickerButtons = screen.getAllByRole("button").filter(btn => {
      const text = btn.textContent || "";
      return text.includes("Overview") && text.includes("2024");
    });
    expect(pickerButtons.length).toBeGreaterThanOrEqual(3);

    const firstPickerButton = pickerButtons[0];
    // Extract title from the first div child
    const selectedTitle = firstPickerButton.querySelector("div")?.textContent;

    fireEvent.click(firstPickerButton);
    fireEvent.click(screen.getByRole("button", { name: "Choose winner" }));

    expect(onGoToWinner).toHaveBeenCalledTimes(1);
    expect(onGoToWinner.mock.calls[0][0].title).toBe(selectedTitle);
  });

  it("picker branch: Start over restores the deck (liked cards become available again)", async () => {
    const entries = [makeEntry(1, "A"), makeEntry(2, "B"), makeEntry(3, "C"), makeEntry(4, "D")];
    renderWatchPage({ initialEntries: entries });
    completeQuestionnaire();

    // Like 2, then nope remaining to exhaust deck -> pick mode with 2 likes
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(getPrimaryNopeButton());
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(getPrimaryNopeButton());
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByText(/Pick one to watch/i)).toBeInTheDocument();

    // Start over should return to questionnaire
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.queryByText(/Pick one to watch/i)).not.toBeInTheDocument();
    expect(screen.getByText(/How much time do you have\?/i)).toBeInTheDocument();
  });

  it("winner branch: Mark as Watched calls onMarkWatched", async () => {
    const onMarkWatched = vi.fn(async () => {});
    const winner = makeEntry(99, "Winner");
    renderWatchPage({
      initialEntries: [],
      winnerEntryId: 99,
      winnerEntry: winner,
      onMarkWatched,
    });

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Mark as Watched" })[0]);
      await Promise.resolve();
    });
    expect(onMarkWatched).toHaveBeenCalledWith(99);
  });

  it("winner branch: shows loading and error states", () => {
    renderWatchPage({
      initialEntries: [],
      winnerEntryId: 1,
      winnerLoading: true,
      winnerError: "Boom",
    });

    expect(screen.getByText(/Loading selection/i)).toBeInTheDocument();
    expect(screen.getByText("Boom")).toBeInTheDocument();
  });

  it("renders tags next to the media label on the card", () => {
    const entry: WatchCardEntry = {
      id: 1,
      title: "Tagged",
      overview: "Overview Tagged",
      releaseYear: "2025",
      posterPath: null,
      backdropPath: null,
      mediaType: "tv",
      runtime: 45,
      tags: ["Action", "Drama"],
    };
    renderWatchPage({ initialEntries: [entry] });

    // Complete questionnaire with long show filter (matches runtime: 45 min)
    const longShowButton = screen.getByRole("button", { name: /Long Show.*Full episodes/i });
    fireEvent.click(longShowButton);
    const startButton = screen.getByRole("button", { name: /Start Swiping/i });
    fireEvent.click(startButton);

    expect(screen.getByText("TV | Action, Drama")).toBeInTheDocument();
  });

  it("questionnaire: adjusts like goal based on filtered entries (not total)", () => {
    // Create 10 entries: 7 movies and 3 TV shows
    const entries: WatchCardEntry[] = [
      ...Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        title: `Movie ${i + 1}`,
        overview: `Overview Movie ${i + 1}`,
        releaseYear: "2024",
        posterPath: null,
        backdropPath: null,
        mediaType: "movie" as const,
        runtime: 120,
        tags: [],
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: i + 8,
        title: `Show ${i + 1}`,
        overview: `Overview Show ${i + 1}`,
        releaseYear: "2024",
        posterPath: null,
        backdropPath: null,
        mediaType: "tv" as const,
        runtime: 45,
        tags: [],
      })),
    ];

    renderWatchPage({ initialEntries: entries });

    // Filter to only long TV shows (3 results)
    const longShowButton = screen.getByRole("button", { name: /Long Show.*Full episodes/i });
    fireEvent.click(longShowButton);
    const startButton = screen.getByRole("button", { name: /Start Swiping/i });
    fireEvent.click(startButton);

    // With 3 filtered entries, like goal should be 1 (not 3)
    // Like 1 entry should immediately trigger pick mode
    fireEvent.click(getPrimaryLikeButton());
    act(() => vi.advanceTimersByTime(250));

    // Should be in pick mode (or auto-selected winner)
    // The entry might be auto-selected if it's the only liked one and deck is exhausted,
    // but with 3 entries and liking 1, we should enter pick mode OR it auto-selects
    // Either way, we shouldn't still be swiping with "Liked: 1/1" or similar
    const likedLabels = screen.queryAllByText(/Liked:/i);
    if (likedLabels.length > 0) {
      // We're still in swipe mode, check the goal
      const likedText = likedLabels[0].textContent || "";
      // Should show "Liked: 1 / 1" not "Liked: 1 / 3"
      expect(likedText).toMatch(/1\s*\/\s*1/);
    }
    // If no "Liked:" label, we've entered pick mode or winner selection, which is also correct
  });

  it("questionnaire: displays matching count as filters change", () => {
    // Create entries: 5 movies, 3 long TV shows, 2 short TV shows
    const entries: WatchCardEntry[] = [
      ...Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        title: `Movie ${i + 1}`,
        overview: `Overview Movie ${i + 1}`,
        releaseYear: "2024",
        posterPath: null,
        backdropPath: null,
        mediaType: "movie" as const,
        runtime: 120,
        tags: [],
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: i + 6,
        title: `Drama ${i + 1}`,
        overview: `Overview Drama ${i + 1}`,
        releaseYear: "2024",
        posterPath: null,
        backdropPath: null,
        mediaType: "tv" as const,
        runtime: 45,
        tags: [],
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        id: i + 9,
        title: `Sitcom ${i + 1}`,
        overview: `Overview Sitcom ${i + 1}`,
        releaseYear: "2024",
        posterPath: null,
        backdropPath: null,
        mediaType: "tv" as const,
        runtime: 22,
        tags: [],
      })),
    ];

    renderWatchPage({ initialEntries: entries });

    // Initially, no filters selected, so no count shown
    expect(screen.queryByText(/entries match/i)).not.toBeInTheDocument();

    // Select "Movie" filter
    const movieButton = screen.getByRole("button", { name: /Movie.*Feature length film/i });
    fireEvent.click(movieButton);

    // Should show 5 matching entries
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/entries match your filters/i)).toBeInTheDocument();

    // Add "Long Show" filter
    const longShowButton = screen.getByRole("button", { name: /Long Show.*Full episodes/i });
    fireEvent.click(longShowButton);

    // Should now show 8 matching entries (5 movies + 3 long shows)
    expect(screen.getByText("8")).toBeInTheDocument();

    // Add "Short Show" filter
    const shortShowButton = screen.getByRole("button", { name: /Short Show.*Quick episodes/i });
    fireEvent.click(shortShowButton);

    // Should now show 10 matching entries (all of them)
    expect(screen.getByText("10")).toBeInTheDocument();

    // Deselect "Movie" to see just TV shows
    fireEvent.click(movieButton);

    // Should now show 5 matching entries (3 long + 2 short shows)
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("questionnaire: disables start button when no matches", () => {
    const entries: WatchCardEntry[] = [
      {
        id: 1,
        title: "Movie",
        overview: "Overview",
        releaseYear: "2024",
        posterPath: null,
        backdropPath: null,
        mediaType: "movie",
        runtime: 120,
        tags: [],
      },
    ];

    renderWatchPage({ initialEntries: entries });

    // Select "Long Show" filter (won't match any entries)
    const longShowButton = screen.getByRole("button", { name: /Long Show.*Full episodes/i });
    fireEvent.click(longShowButton);

    // Should show 0 matching entries
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(/No entries match these filters/i)).toBeInTheDocument();

    // Start button should be disabled
    const startButton = screen.getByRole("button", { name: /Start Swiping/i });
    expect(startButton).toBeDisabled();
  });
});

