import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ListPageContainer } from '../components/list-page-container';
import { TMDBConfigurationContext, type TMDBConfigurationState } from '../../../../lib/tmdb-api/tmdb-configuration';

// Mock expo-router
const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}));

vi.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: vi.fn(), // no-op — don't execute callback
}));

// Mock supabase client (relative path matching component import)
const mockOrder = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn(() => ({ order: mockOrder })));
const mockFrom = vi.hoisted(() => vi.fn(() => ({ select: mockSelect })));

vi.mock('../../../../lib/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

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

function renderWithProviders() {
  return render(
    <TMDBConfigurationContext.Provider value={mockConfig}>
      <ListPageContainer />
    </TMDBConfigurationContext.Provider>
  );
}

describe('ListPageContainer', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockOrder.mockReset();
  });

  it('shows a loading state while fetching', async () => {
    mockOrder.mockReturnValue(new Promise(() => {}));
    renderWithProviders();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders saved entries', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 1,
          added_at: '2026-01-04T00:00:00Z',
          watched_at: null,
          tmdb_details: {
            poster_path: '/poster.jpg',
            name: 'Fight Club',
            release_date: '1999-10-15',
          },
          entry_tags: [{ tags: { name: 'Drama' } }],
        },
      ],
      error: null,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Fight Club')).toBeInTheDocument();
      expect(screen.getByText('1999')).toBeInTheDocument();
      expect(screen.getByText('Drama')).toBeInTheDocument();
    });
  });

  it('puts watched entries after unwatched entries', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 10,
          added_at: '2026-01-04T00:00:00Z',
          watched_at: '2026-01-05T00:00:00Z',
          tmdb_details: { poster_path: null, name: 'Watched One', release_date: '2021-01-01' },
          entry_tags: null,
        },
        {
          id: 11,
          added_at: '2026-01-03T00:00:00Z',
          watched_at: null,
          tmdb_details: { poster_path: null, name: 'Unwatched One', release_date: '2022-01-01' },
          entry_tags: null,
        },
      ],
      error: null,
    });

    renderWithProviders();

    await waitFor(() => {
      const allTexts = screen.getAllByText(/Unwatched|Watched/);
      const textContent = allTexts.map((el) => el.textContent);
      // Unwatched should come first, then WATCHED header, then watched entry
      expect(textContent).toContain('Unwatched One');
      expect(textContent).toContain('Watched One');
    });
  });

  it('renders an empty state when there are no entries', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Your list is empty.')).toBeInTheDocument();
    });
  });

  it('renders an error when the query fails', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'Boom' } });
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Boom')).toBeInTheDocument();
    });
  });
});
