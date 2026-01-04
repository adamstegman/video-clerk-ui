import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AddToListPage } from './add-to-list-page';
import { TMDBAPI } from '../tmdb-api/tmdb-api';
import { TMDBAPIContext } from '../tmdb-api/tmdb-api-provider';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';
import { TMDBGenresContext } from '../tmdb-api/tmdb-genres';
import type { TMDBConfig, TMDBSearchResults, TMDBGenre } from '../tmdb-api/tmdb-api';

// Mock the TMDB logo import
vi.mock('../tmdb-api/tmdb-primary-long-blue.svg', () => ({
  default: 'tmdb-logo.svg',
}));

const mockRpc = vi.hoisted(() => vi.fn());
vi.mock('../lib/supabase/client', () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}));

describe('AddToListPage', () => {
  let mockAPI: TMDBAPI;
  let mockMultiSearch: ReturnType<typeof vi.fn>;

  const mockConfig: TMDBConfig = {
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
  };

  const mockConfigurationState = {
    ...mockConfig,
    error: null,
  };

  const mockMovieGenres: TMDBGenre[] = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
  ];

  const mockTVGenres: TMDBGenre[] = [
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
  ];

  const mockGenresState = {
    movieGenres: mockMovieGenres,
    tvGenres: mockTVGenres,
    error: null,
  };

  beforeEach(() => {
    mockMultiSearch = vi.fn();
    const fetchMovieDetails = vi.fn();
    const fetchTVDetails = vi.fn();
    mockAPI = {
      multiSearch: mockMultiSearch,
      fetchMovieDetails,
      fetchTVDetails,
    } as unknown as TMDBAPI;
    mockRpc.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (initialEntries: string[] = ['/']) => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <TMDBAPIContext value={mockAPI}>
              <TMDBConfigurationContext value={mockConfigurationState}>
                <TMDBGenresContext value={mockGenresState}>
                  <AddToListPage />
                </TMDBGenresContext>
              </TMDBConfigurationContext>
            </TMDBAPIContext>
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
  };

  it('displays search results after typing and waiting for debounce', async () => {
    const user = userEvent.setup();
    const mockResults: TMDBSearchResults = {
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: '/backdrop.jpg',
          genre_ids: [28, 12],
          id: 1,
          media_type: 'movie',
          original_language: 'en',
          overview: 'A great movie',
          popularity: 100.5,
          poster_path: '/poster.jpg',
          release_date: '2023-01-01',
          title: 'Test Movie',
          vote_average: 8.5,
          vote_count: 1000,
        },
        {
          adult: false,
          backdrop_path: '/backdrop2.jpg',
          genre_ids: [16, 35],
          id: 2,
          media_type: 'tv',
          original_language: 'en',
          original_name: 'Test TV Show',
          origin_country: ['US'],
          overview: 'A great TV show',
          popularity: 85.2,
          poster_path: '/poster2.jpg',
          first_air_date: '2022-01-01',
          name: 'Test TV Show',
          vote_average: 7.8,
          vote_count: 500,
        },
      ],
      total_pages: 1,
      total_results: 2,
    };

    mockMultiSearch.mockResolvedValue(mockResults);
    renderWithProviders();

    const searchInput = screen.getByPlaceholderText('Type a title...');
    await user.type(searchInput, 'test query');

    // Wait for debounce (250ms) and API call
    await waitFor(
      () => {
        expect(mockMultiSearch).toHaveBeenCalledWith('test query');
      },
      { timeout: 1000 }
    );

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
      expect(screen.getByText('Test TV Show')).toBeInTheDocument();
    });

    // Check that release years are displayed
    expect(screen.getByText('2023 - Movie')).toBeInTheDocument();
    expect(screen.getByText('2022 - TV Series')).toBeInTheDocument();

    // Check that genres are displayed
    expect(screen.getByText('Action, Adventure')).toBeInTheDocument(); // Movie genres: 28, 12
    expect(screen.getByText('Animation, Comedy')).toBeInTheDocument(); // TV genres: 16, 35

    // Check that TMDB attribution section is displayed with logo
    expect(screen.getByText('Results by')).toBeInTheDocument();
    expect(screen.getByAltText('TMDB')).toBeInTheDocument();
  });

  it('filters out results with unsupported media types', async () => {
    const user = userEvent.setup();
    const mockResults: TMDBSearchResults = {
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: '/backdrop.jpg',
          genre_ids: [28],
          id: 1,
          media_type: 'movie',
          original_language: 'en',
          overview: 'A movie',
          popularity: 90.0,
          poster_path: '/poster.jpg',
          release_date: '2023-01-01',
          title: 'Movie Title',
          vote_average: 8.0,
          vote_count: 1000,
        },
        {
          adult: false,
          backdrop_path: '/backdrop2.jpg',
          genre_ids: [],
          id: 2,
          media_type: 'person', // Unsupported media type
          name: 'Test Person',
          original_language: 'en',
          overview: 'A person',
          popularity: 50.0,
          poster_path: '/poster2.jpg',
          vote_average: 0,
          vote_count: 0,
        },
      ],
      total_pages: 1,
      total_results: 2,
    };

    mockMultiSearch.mockResolvedValue(mockResults);
    renderWithProviders();

    const searchInput = screen.getByPlaceholderText('Type a title...');
    await user.type(searchInput, 'test');

    await waitFor(() => {
      expect(screen.getByText('Movie Title')).toBeInTheDocument();
      // Person result should not be displayed
      expect(screen.queryByText('Test Person', { exact: false })).not.toBeInTheDocument();
    });
  });

  it('sorts results by popularity descending', async () => {
    const user = userEvent.setup();
    const mockResults: TMDBSearchResults = {
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: '/backdrop1.jpg',
          genre_ids: [28],
          id: 1,
          media_type: 'movie',
          original_language: 'en',
          overview: 'Less popular',
          popularity: 50.0,
          poster_path: '/poster1.jpg',
          release_date: '2023-01-01',
          title: 'Less Popular Movie',
          vote_average: 7.0,
          vote_count: 500,
        },
        {
          adult: false,
          backdrop_path: '/backdrop2.jpg',
          genre_ids: [28],
          id: 2,
          media_type: 'movie',
          original_language: 'en',
          overview: 'More popular',
          popularity: 100.0,
          poster_path: '/poster2.jpg',
          release_date: '2023-02-01',
          title: 'More Popular Movie',
          vote_average: 8.0,
          vote_count: 1000,
        },
      ],
      total_pages: 1,
      total_results: 2,
    };

    mockMultiSearch.mockResolvedValue(mockResults);
    renderWithProviders();

    const searchInput = screen.getByPlaceholderText('Type a title...');
    await user.type(searchInput, 'test');

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 3 });
      // More popular movie should appear first (sorted by popularity descending)
      expect(headings[0]).toHaveTextContent('More Popular Movie');
      expect(headings[1]).toHaveTextContent('Less Popular Movie');
    });
  });

  it('displays error message when API call fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Error 401: Unauthorized';
    mockMultiSearch.mockRejectedValue(new Error(errorMessage));
    renderWithProviders();

    const searchInput = screen.getByPlaceholderText('Type a title...');
    await user.type(searchInput, 'test query');

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('clears results when search input is cleared', async () => {
    const user = userEvent.setup();
    const mockResults: TMDBSearchResults = {
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: '/backdrop.jpg',
          genre_ids: [28],
          id: 1,
          media_type: 'movie',
          original_language: 'en',
          overview: 'A movie',
          popularity: 90.0,
          poster_path: '/poster.jpg',
          release_date: '2023-01-01',
          title: 'Movie Title',
          name: 'Movie Title',
          vote_average: 8.0,
          vote_count: 1000,
        },
      ],
      total_pages: 1,
      total_results: 1,
    };
    mockMultiSearch.mockResolvedValue(mockResults);
    renderWithProviders();

    const searchInput = screen.getByPlaceholderText('Type a title...');
    // Type something to get results
    await user.type(searchInput, 'movie');

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('Movie Title')).toBeInTheDocument();
    });

    // Clear the input - should clear results immediately
    await user.clear(searchInput);

    // Results should be cleared (empty search triggers immediate onSearch(''))
    await waitFor(() => {
      expect(screen.queryByText('Movie Title')).not.toBeInTheDocument();
      expect(screen.queryByText(/Results by/)).not.toBeInTheDocument();
    });
  });

  it('displays poster images when available', async () => {
    const user = userEvent.setup();
    const mockResults: TMDBSearchResults = {
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: '/backdrop.jpg',
          genre_ids: [28],
          id: 1,
          media_type: 'movie',
          original_language: 'en',
          overview: 'A movie',
          popularity: 90.0,
          poster_path: '/poster.jpg',
          release_date: '2023-01-01',
          title: 'Movie Title',
          name: 'Movie Title',
          vote_average: 8.0,
          vote_count: 1000,
        },
      ],
      total_pages: 1,
      total_results: 1,
    };

    mockMultiSearch.mockResolvedValue(mockResults);
    renderWithProviders();

    const searchInput = screen.getByPlaceholderText('Type a title...');
    await user.type(searchInput, 'movie');

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      // Should have poster image and TMDB logo
      const posterImg = images.find(img => img.getAttribute('src')?.includes('/poster.jpg'));
      expect(posterImg).toBeInTheDocument();
      expect(posterImg).toHaveAttribute(
        'src',
        'https://image.tmdb.org/t/p/w185/poster.jpg'
      );
    });
  });

  it('does not display poster if poster_path is missing', async () => {
    const user = userEvent.setup();
    const mockResults: TMDBSearchResults = {
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: '/backdrop.jpg',
          genre_ids: [28],
          id: 1,
          media_type: 'movie',
          original_language: 'en',
          overview: 'A movie',
          popularity: 90.0,
          poster_path: null,
          release_date: '2023-01-01',
          title: 'Movie Title',
          name: 'Movie Title',
          vote_average: 8.0,
          vote_count: 1000,
        },
      ],
      total_pages: 1,
      total_results: 1,
    };

    mockMultiSearch.mockResolvedValue(mockResults);
    renderWithProviders();

    const searchInput = screen.getByPlaceholderText('Type a title...');
    await user.type(searchInput, 'movie');

    await waitFor(() => {
      expect(screen.getByText('Movie Title')).toBeInTheDocument();

      // Only the TMDB logo image should be present, not a poster
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(1);
      const tmdbLogo = screen.getByAltText('TMDB');
      expect(tmdbLogo).toBe(images[0]);
    });
  });

  it('displays loading indicator when search is in progress', async () => {
    const user = userEvent.setup();
    // Create a promise that never resolves to simulate a long-running search
    const neverResolvingPromise = new Promise<TMDBSearchResults>(() => {
      // Intentionally never resolves
    });
    mockMultiSearch.mockReturnValue(neverResolvingPromise);
    renderWithProviders();

    const searchInput = screen.getByPlaceholderText('Type a title...');
    await user.type(searchInput, 'test query');

    // Wait for debounce (250ms) to complete
    await waitFor(
      () => {
        expect(mockMultiSearch).toHaveBeenCalledWith('test query');
      },
      { timeout: 1000 }
    );

    // Check that loading indicator is displayed
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    // Verify that no results are shown while loading
    expect(screen.queryByText(/Results by/)).not.toBeInTheDocument();
  });

  it('allows saving a search result to the database', async () => {
    const user = userEvent.setup();
    const mockResults: TMDBSearchResults = {
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: '/backdrop.jpg',
          genre_ids: [28, 12],
          id: 1,
          media_type: 'movie',
          original_language: 'en',
          overview: 'A great movie',
          popularity: 100.5,
          poster_path: '/poster.jpg',
          release_date: '2023-01-01',
          title: 'Test Movie',
          vote_average: 8.5,
          vote_count: 1000,
        },
      ],
      total_pages: 1,
      total_results: 1,
    };

    mockMultiSearch.mockResolvedValue(mockResults);
    (mockAPI as any).fetchMovieDetails.mockResolvedValue({ runtime: 142 });
    mockRpc.mockResolvedValue({ data: 123, error: null });

    renderWithProviders();

    const searchInput = screen.getByPlaceholderText('Type a title...');
    await user.type(searchInput, 'test');

    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'Save Test Movie' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('save_tmdb_result_to_list', expect.objectContaining({
        p_tmdb_id: 1,
        p_media_type: 'movie',
        p_title: 'Test Movie',
        p_genre_ids: [28, 12],
        p_genre_names: ['Action', 'Adventure'],
        p_runtime: 142,
      }));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saved Test Movie' })).toBeInTheDocument();
    });
  });

  it('averages tv episode runtimes before saving', async () => {
    const user = userEvent.setup();
    const mockResults: TMDBSearchResults = {
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: '/backdrop2.jpg',
          genre_ids: [16, 35],
          id: 2,
          media_type: 'tv',
          original_language: 'en',
          original_name: 'Test TV Show',
          origin_country: ['US'],
          overview: 'A great TV show',
          popularity: 85.2,
          poster_path: '/poster2.jpg',
          first_air_date: '2022-01-01',
          name: 'Test TV Show',
          vote_average: 7.8,
          vote_count: 500,
        },
      ],
      total_pages: 1,
      total_results: 1,
    };

    mockMultiSearch.mockResolvedValue(mockResults);
    (mockAPI as any).fetchTVDetails.mockResolvedValue({ episode_run_time: [25, 35] }); // average => 30
    mockRpc.mockResolvedValue({ data: 456, error: null });

    renderWithProviders();

    const searchInput = screen.getByPlaceholderText('Type a title...');
    await user.type(searchInput, 'tv');

    await waitFor(() => {
      expect(screen.getByText('Test TV Show')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'Save Test TV Show' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('save_tmdb_result_to_list', expect.objectContaining({
        p_tmdb_id: 2,
        p_media_type: 'tv',
        p_title: 'Test TV Show',
        p_genre_ids: [16, 35],
        p_genre_names: ['Animation', 'Comedy'],
        p_runtime: 30,
      }));
    });
  });
});
