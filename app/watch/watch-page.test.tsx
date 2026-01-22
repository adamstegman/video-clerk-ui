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

    // Like 1
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    act(() => vi.advanceTimersByTime(250));
    expect(screen.queryByText(/Pick one to watch/i)).not.toBeInTheDocument();

    // Like 2
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    act(() => vi.advanceTimersByTime(250));
    expect(screen.queryByText(/Pick one to watch/i)).not.toBeInTheDocument();

    // Like 3 => picker
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByText(/Pick one to watch/i)).toBeInTheDocument();
    expect(screen.getByText("You liked 3. Pick one to watch:")).toBeInTheDocument();
  });

  it("small-deck branch: if fewer than 3 entries exist, picker appears after 1 like", async () => {
    const entries = [makeEntry(1, "Only A"), makeEntry(2, "Only B")];
    renderWatchPage({ initialEntries: entries });

    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByText("You liked 1. Pick one to watch:")).toBeInTheDocument();
    expect(screen.getByText("Only A")).toBeInTheDocument();
  });

  it("picker branch: Choose winner calls onGoToWinner with the selected entry", async () => {
    const onGoToWinner = vi.fn();
    const entries = [makeEntry(1, "A"), makeEntry(2, "B"), makeEntry(3, "C")];
    renderWatchPage({ initialEntries: entries, onGoToWinner });

    // Like 3 items to enter pick mode (likeGoal=3)
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByText(/Pick one to watch/i)).toBeInTheDocument();

    // Select an entry and choose winner
    fireEvent.click(screen.getByRole("button", { name: /^A 2024/i }));
    fireEvent.click(screen.getByRole("button", { name: "Choose winner" }));

    expect(onGoToWinner).toHaveBeenCalledTimes(1);
    expect(onGoToWinner.mock.calls[0][0]).toMatchObject({ id: 1, title: "A" });
  });

  it("picker branch: Start over restores the deck (liked cards become available again)", async () => {
    const entries = [makeEntry(1, "A"), makeEntry(2, "B")];
    renderWatchPage({ initialEntries: entries });

    // Like once -> pick mode (likeGoal=1)
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByText(/Pick one to watch/i)).toBeInTheDocument();

    // Start over should restore cards view
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.queryByText(/Pick one to watch/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Liked:/i)).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
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
      fireEvent.click(screen.getByRole("button", { name: "Mark as Watched" }));
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
      tags: ["Action", "Drama"],
    };
    renderWatchPage({ initialEntries: [entry] });

    expect(screen.getByText("TV | Action, Drama")).toBeInTheDocument();
  });
});

