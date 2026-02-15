import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import { EditEntryPageContainer } from './edit-entry-page-container';
import { TMDBConfigurationContext, type TMDBConfigurationState } from '../tmdb-api/tmdb-configuration';

// Mock data
interface MockEntryData {
  id: number;
  added_at: string;
  watched_at: string | null;
  tmdb_details: {
    tmdb_id: number;
    media_type: string;
    poster_path: string | null;
    name: string;
    release_date: string;
    runtime: number | null;
  } | null;
  entry_tags: { tags: { id: number; name: string; is_custom: boolean } }[];
}

const mockEntryData: MockEntryData = {
  id: 1,
  added_at: '2026-01-04T00:00:00Z',
  watched_at: null,
  tmdb_details: {
    tmdb_id: 550,
    media_type: 'movie',
    poster_path: '/poster.jpg',
    name: 'Fight Club',
    release_date: '1999-10-15',
    runtime: 139,
  },
  entry_tags: [{ tags: { id: 1, name: 'Drama', is_custom: false } }],
};

// Mock Supabase chain builders
const mockMaybeSingle = jest.fn();
const mockEqEntry = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelectEntries = jest.fn(() => ({ eq: mockEqEntry }));

const mockOrderTags = jest.fn();
const mockSelectTags = jest.fn(() => ({ order: mockOrderTags }));

// For save: entries update chain
const mockUpdateEqGroup = jest.fn();
const mockUpdateEqId = jest.fn(() => ({ eq: mockUpdateEqGroup }));
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEqId }));

// For save: tmdb_details update chain
const mockTmdbUpdateEqMedia = jest.fn();
const mockTmdbUpdateEqId = jest.fn(() => ({ eq: mockTmdbUpdateEqMedia }));
const mockTmdbUpdate = jest.fn(() => ({ eq: mockTmdbUpdateEqId }));

// For save: entry_tags delete chain
const mockDeleteEq = jest.fn();
const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));

// For save: entry_tags insert
const mockInsert = jest.fn();

// For save: rpc
const mockRpc = jest.fn();

const mockFrom = jest.fn((table: string) => {
  if (table === 'entries') {
    return { select: mockSelectEntries, update: mockUpdate };
  }
  if (table === 'tags') {
    return { select: mockSelectTags };
  }
  if (table === 'tmdb_details') {
    return { update: mockTmdbUpdate };
  }
  if (table === 'entry_tags') {
    return { delete: mockDelete, insert: mockInsert };
  }
  return {};
});

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ entryId: '1' }),
}));

// Mock supabase client
jest.mock('../supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...(args as [string])),
    rpc: (...args: unknown[]) => mockRpc(...args),
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
      <EditEntryPageContainer />
    </TMDBConfigurationContext.Provider>
  );
}

function setupLoadMocks(entryData = mockEntryData) {
  mockMaybeSingle.mockResolvedValue({ data: entryData, error: null });
  mockOrderTags.mockResolvedValue({
    data: [
      { id: 1, name: 'Drama', is_custom: false },
      { id: 2, name: 'Action', is_custom: false },
    ],
    error: null,
  });
}

describe('EditEntryPageContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays the entry runtime', async () => {
    setupLoadMocks();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Fight Club')).toBeTruthy();
      expect(screen.getByText('Runtime')).toBeTruthy();
      expect(screen.getByDisplayValue('139')).toBeTruthy();
    });
  });

  it('displays empty runtime input when runtime is null', async () => {
    setupLoadMocks({
      ...mockEntryData,
      tmdb_details: { ...mockEntryData.tmdb_details!, runtime: null },
    });
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Runtime')).toBeTruthy();
      // Multiple empty inputs exist (runtime + tag query), so check that
      // no input displays a numeric runtime value
      expect(screen.queryByDisplayValue(/^\d+$/)).toBeNull();
    });
  });

  it('saves updated runtime to tmdb_details on save', async () => {
    setupLoadMocks();

    // Setup save mocks
    mockRpc.mockResolvedValue({ data: 'group-123', error: null });
    mockUpdateEqGroup.mockResolvedValue({ error: null });
    mockTmdbUpdateEqMedia.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByDisplayValue('139')).toBeTruthy();
    });

    // Change runtime
    const runtimeInput = screen.getByDisplayValue('139');
    await act(async () => {
      fireEvent.changeText(runtimeInput, '120');
    });

    // Press save
    const saveButton = screen.getByText('Save Changes');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      // Verify tmdb_details update was called with runtime
      expect(mockTmdbUpdate).toHaveBeenCalledWith({ runtime: 120 });
      expect(mockTmdbUpdateEqId).toHaveBeenCalledWith('tmdb_id', 550);
      expect(mockTmdbUpdateEqMedia).toHaveBeenCalledWith('media_type', 'movie');
    });
  });

  it('does not update tmdb_details when tmdbId is null', async () => {
    setupLoadMocks({
      ...mockEntryData,
      tmdb_details: null,
    });

    mockRpc.mockResolvedValue({ data: 'group-123', error: null });
    mockUpdateEqGroup.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Untitled')).toBeTruthy();
    });

    const saveButton = screen.getByText('Save Changes');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(mockUpdateEqGroup).toHaveBeenCalled();
    });

    // tmdb_details update should NOT have been called
    expect(mockTmdbUpdate).not.toHaveBeenCalled();
  });
});
