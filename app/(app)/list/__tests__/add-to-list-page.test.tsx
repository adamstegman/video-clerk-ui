import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import AddToListPage from '../add/index';
import { TMDBAPIContext } from '../../../../lib/tmdb-api/tmdb-api-provider';
import { TMDBConfigurationContext, type TMDBConfigurationState } from '../../../../lib/tmdb-api/tmdb-configuration';
import { TMDBGenresContext, type TMDBGenresState } from '../../../../lib/tmdb-api/tmdb-genres';
import { TMDBAPI, type TMDBSearchResults, type TMDBGenre } from '../../../../lib/tmdb-api/tmdb-api';

// Mock functions
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockRpc = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock supabase client
jest.mock('../../../../lib/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

describe('AddToListPage', () => {
  let mockAPI: TMDBAPI;
  let mockMultiSearch: ReturnType<typeof jest.fn>;

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

  const mockMovieGenres: TMDBGenre[] = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
  ];

  const mockTVGenres: TMDBGenre[] = [
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
  ];

  const mockGenresState: TMDBGenresState = {
    movieGenres: mockMovieGenres,
    tvGenres: mockTVGenres,
    error: null,
  };

  beforeEach(() => {
    mockMultiSearch = jest.fn();
    mockAPI = {
      multiSearch: mockMultiSearch,
    } as unknown as TMDBAPI;

    jest.clearAllMocks();

    // Default: no saved items
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  const renderWithProviders = () => {
    return render(
      <TMDBAPIContext.Provider value={mockAPI}>
        <TMDBConfigurationContext.Provider value={mockConfig}>
          <TMDBGenresContext.Provider value={mockGenresState}>
            <AddToListPage />
          </TMDBGenresContext.Provider>
        </TMDBConfigurationContext.Provider>
      </TMDBAPIContext.Provider>
    );
  };

  it(
    'displays search results after typing and waiting for debounce',
    async () => {
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
    renderWithProviders();

      const searchInput = screen.getByPlaceholderText('Search movies and TV shows...');
      fireEvent.changeText(searchInput, 'test query');

      // Wait for debounce (500ms) and API call
      await waitFor(
        () => {
          expect(mockMultiSearch).toHaveBeenCalledWith('test query');
        },
        { timeout: 2000 }
      );

      await waitFor(() => {
        expect(screen.getByText('Test Movie')).toBeTruthy();
        expect(screen.getByText('2023')).toBeTruthy();
        expect(screen.getByText('Action, Adventure')).toBeTruthy();
      });
    },
    10000
  );

  it(
    'shows saved button for already-saved items',
    async () => {
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
          overview: 'A great movie',
          popularity: 100.5,
          poster_path: '/poster.jpg',
          release_date: '2023-01-01',
          title: 'Saved Movie',
          vote_average: 8.5,
          vote_count: 1000,
        },
      ],
      total_pages: 1,
      total_results: 1,
    };

    // Mock saved items lookup to include this movie
    mockSelect.mockResolvedValue({
      data: [{ tmdb_details: { tmdb_id: 1 } }],
      error: null,
    });

    mockMultiSearch.mockResolvedValue(mockResults);
    renderWithProviders();

    // Wait for saved IDs to load
    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalled();
    });

      const searchInput = screen.getByPlaceholderText('Search movies and TV shows...');
      fireEvent.changeText(searchInput, 'saved');

      await waitFor(
        () => {
          expect(screen.getByText('Saved Movie')).toBeTruthy();
        },
        { timeout: 2000 }
      );

      // Should show "Saved" button (indicates item is already saved)
      const savedButtons = screen.getAllByText(/Saved/i);
      expect(savedButtons.length).toBeGreaterThan(0);
    },
    10000
  );

  it(
    'filters out unsupported media types',
    async () => {
    const mockResults: TMDBSearchResults = {
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: null,
          genre_ids: [],
          id: 1,
          media_type: 'movie',
          original_language: 'en',
          overview: 'A movie',
          popularity: 100,
          poster_path: null,
          release_date: '2023-01-01',
          title: 'Movie Result',
          vote_average: 8,
          vote_count: 100,
        },
        {
          adult: false,
          backdrop_path: null,
          genre_ids: [],
          id: 2,
          media_type: 'person',
          original_language: 'en',
          overview: 'A person',
          popularity: 100,
          poster_path: null,
          vote_average: 0,
          vote_count: 0,
        } as any,
      ],
      total_pages: 1,
      total_results: 2,
    };

    mockMultiSearch.mockResolvedValue(mockResults);
    renderWithProviders();

      const searchInput = screen.getByPlaceholderText('Search movies and TV shows...');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(
        () => {
          expect(screen.getByText('Movie Result')).toBeTruthy();
        },
        { timeout: 2000 }
      );

      // Person result should not appear
      expect(screen.queryByText('A person')).not.toBeTruthy();
    },
    10000
  );

  it(
    'displays loading indicator during search',
    async () => {
      // Make the search hang
      mockMultiSearch.mockImplementation(() => new Promise(() => {}));
      renderWithProviders();

      const searchInput = screen.getByPlaceholderText('Search movies and TV shows...');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(
        () => {
          expect(mockMultiSearch).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      // Should show loading indicator (ActivityIndicator is present)
      const container = screen.UNSAFE_getByType(require('react-native').ActivityIndicator);
      expect(container).toBeTruthy();
    },
    10000
  );

  it(
    'allows saving a search result',
    async () => {
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
          overview: 'A great movie',
          popularity: 100.5,
          poster_path: '/poster.jpg',
          release_date: '2023-01-01',
          title: 'New Movie',
          vote_average: 8.5,
          vote_count: 1000,
        },
      ],
      total_pages: 1,
      total_results: 1,
    };

    mockMultiSearch.mockResolvedValue(mockResults);
    mockRpc.mockResolvedValue({ data: null, error: null });

    renderWithProviders();

      const searchInput = screen.getByPlaceholderText('Search movies and TV shows...');
      fireEvent.changeText(searchInput, 'new');

      await waitFor(
        () => {
          expect(screen.getByText('New Movie')).toBeTruthy();
        },
        { timeout: 2000 }
      );

      const saveButton = screen.getByText(/^Save$/i);
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith(
          'save_tmdb_result_to_list',
          expect.objectContaining({
            p_tmdb_id: 1,
            p_media_type: 'movie',
            p_overview: 'A great movie',
          })
        );
      });
    },
    10000
  );
});
