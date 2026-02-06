import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WatchPage } from '../components/watch-page';
import type { WatchCardEntry } from '../components/watch-card';
import { TMDBConfigurationContext, type TMDBConfigurationState } from '../../../../lib/tmdb-api/tmdb-configuration';

const mockConfig: TMDBConfigurationState = {
  images: {
    base_url: 'http://image.tmdb.org/t/p/',
    secure_base_url: 'https://image.tmdb.org/t/p/',
    backdrop_sizes: ['w300', 'w780', 'w1280', 'original'],
    logo_sizes: ['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'],
    poster_sizes: ['w92', 'w154', 'w185', 'w300', 'w500', 'w780', 'original'],
    profile_sizes: ['w45', 'w185', 'h632', 'original'],
    still_sizes: ['w92', 'w185', 'w300', 'original'],
  },
  change_keys: [],
  error: null,
};

function makeEntry(id: number, title: string): WatchCardEntry {
  return {
    id,
    title,
    overview: `Overview ${title}`,
    releaseYear: '2024',
    posterPath: null,
    backdropPath: null,
    mediaType: 'movie',
    runtime: 120,
    tags: [],
  };
}

function renderWithProviders(children: React.ReactElement) {
  return render(
    <TMDBConfigurationContext.Provider value={mockConfig}>
      {children}
    </TMDBConfigurationContext.Provider>
  );
}

describe('WatchPage', () => {
  const mockCallbacks = {
    onFiltersChange: jest.fn(),
    onStartQuestionnaire: jest.fn(),
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn(),
    onChooseWinner: jest.fn(),
    onMarkWatched: jest.fn(async () => {}),
    onStartOver: jest.fn(),
  };

  it('shows loading state', () => {
    renderWithProviders(
      <WatchPage
        allEntries={[]}
        deck={[]}
        liked={[]}
        likeGoal={3}
        chosenWinner={null}
        loading={true}
        error={null}
        markingWatched={false}
        showQuestionnaire={false}
        filters={{ timeTypes: [], selectedTags: [] }}
        availableTags={[]}
        matchingCount={0}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('shows error state', () => {
    renderWithProviders(
      <WatchPage
        allEntries={[]}
        deck={[]}
        liked={[]}
        likeGoal={3}
        chosenWinner={null}
        loading={false}
        error="Something went wrong"
        markingWatched={false}
        showQuestionnaire={false}
        filters={{ timeTypes: [], selectedTags: [] }}
        availableTags={[]}
        matchingCount={0}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('shows empty state when no entries', () => {
    renderWithProviders(
      <WatchPage
        allEntries={[]}
        deck={[]}
        liked={[]}
        likeGoal={3}
        chosenWinner={null}
        loading={false}
        error={null}
        markingWatched={false}
        showQuestionnaire={false}
        filters={{ timeTypes: [], selectedTags: [] }}
        availableTags={[]}
        matchingCount={0}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('No unwatched entries.')).toBeTruthy();
    expect(screen.getByText('Add some movies or shows to your list!')).toBeTruthy();
  });

  it('shows questionnaire when showQuestionnaire is true', () => {
    renderWithProviders(
      <WatchPage
        allEntries={[makeEntry(1, 'Test')]}
        deck={[]}
        liked={[]}
        likeGoal={3}
        chosenWinner={null}
        loading={false}
        error={null}
        markingWatched={false}
        showQuestionnaire={true}
        filters={{ timeTypes: [], selectedTags: [] }}
        availableTags={['Action', 'Comedy']}
        matchingCount={1}
        {...mockCallbacks}
      />
    );

    // Questionnaire should render (exact text depends on component implementation)
    expect(screen.getByText(/Start Swiping/i)).toBeTruthy();
  });

  it('shows winner view when chosenWinner is set', () => {
    const winner = makeEntry(1, 'Winner');
    renderWithProviders(
      <WatchPage
        allEntries={[winner]}
        deck={[]}
        liked={[winner]}
        likeGoal={3}
        chosenWinner={winner}
        loading={false}
        error={null}
        markingWatched={false}
        showQuestionnaire={false}
        filters={{ timeTypes: [], selectedTags: [] }}
        availableTags={[]}
        matchingCount={1}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Winner')).toBeTruthy();
    expect(screen.getByText(/Mark as Watched/i)).toBeTruthy();
  });

  it('shows no matches state when deck is empty and no likes', () => {
    renderWithProviders(
      <WatchPage
        allEntries={[makeEntry(1, 'Test')]}
        deck={[]}
        liked={[]}
        likeGoal={3}
        chosenWinner={null}
        loading={false}
        error={null}
        markingWatched={false}
        showQuestionnaire={false}
        filters={{ timeTypes: ['movie'], selectedTags: [] }}
        availableTags={[]}
        matchingCount={0}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('No entries match your filters.')).toBeTruthy();
    expect(screen.getByText(/Change Filters/i)).toBeTruthy();
  });

  it('shows cards view with swipe instructions', () => {
    const entries = [makeEntry(1, 'Test Entry')];
    renderWithProviders(
      <WatchPage
        allEntries={entries}
        deck={entries}
        liked={[]}
        likeGoal={3}
        chosenWinner={null}
        loading={false}
        error={null}
        markingWatched={false}
        showQuestionnaire={false}
        filters={{ timeTypes: [], selectedTags: [] }}
        availableTags={[]}
        matchingCount={1}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Test Entry')).toBeTruthy();
    expect(screen.getByText(/Swipe left to skip • Swipe right to like \(0\/3\)/)).toBeTruthy();
  });

  it('auto-selects winner when liked has only 1 entry and in pick mode', () => {
    const onChooseWinner = jest.fn();
    const entry = makeEntry(1, 'Solo');
    renderWithProviders(
      <WatchPage
        allEntries={[entry]}
        deck={[]}
        liked={[entry]}
        likeGoal={3}
        chosenWinner={null}
        loading={false}
        error={null}
        markingWatched={false}
        showQuestionnaire={false}
        filters={{ timeTypes: [], selectedTags: [] }}
        availableTags={[]}
        matchingCount={1}
        {...mockCallbacks}
        onChooseWinner={onChooseWinner}
      />
    );

    expect(onChooseWinner).toHaveBeenCalledWith(entry);
  });

  it('shows picker when liked count reaches goal', () => {
    const entries = [makeEntry(1, 'A'), makeEntry(2, 'B'), makeEntry(3, 'C')];
    renderWithProviders(
      <WatchPage
        allEntries={entries}
        deck={[]}
        liked={entries}
        likeGoal={3}
        chosenWinner={null}
        loading={false}
        error={null}
        markingWatched={false}
        showQuestionnaire={false}
        filters={{ timeTypes: [], selectedTags: [] }}
        availableTags={[]}
        matchingCount={3}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText(/Pick one to watch/i)).toBeTruthy();
    expect(screen.getByText(/You liked 3\. Choose your winner:/i)).toBeTruthy();
  });

  it('shows picker when deck exhausted with 2 likes', () => {
    const entries = [makeEntry(1, 'A'), makeEntry(2, 'B')];
    renderWithProviders(
      <WatchPage
        allEntries={entries}
        deck={[]}
        liked={entries}
        likeGoal={3}
        chosenWinner={null}
        loading={false}
        error={null}
        markingWatched={false}
        showQuestionnaire={false}
        filters={{ timeTypes: [], selectedTags: [] }}
        availableTags={[]}
        matchingCount={2}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText(/Pick one to watch/i)).toBeTruthy();
  });
});
