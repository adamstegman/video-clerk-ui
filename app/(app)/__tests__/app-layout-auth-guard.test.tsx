import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AppLayout from '../_layout';

// Mock expo-router
const mockReplace = jest.fn();

jest.mock('expo-router', () => {
  function MockTabs({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }
  MockTabs.Screen = () => null;

  return {
    Tabs: MockTabs,
    router: {
      get replace() { return mockReplace; },
    },
    usePathname: () => '/list',
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

// Mock supabase client - simulate unauthenticated user
const mockUnsubscribe = jest.fn();
jest.mock('../../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({
        data: { user: null },
        error: null,
      }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      }),
    },
  },
}));

// Mock TMDB providers as passthroughs
jest.mock('../../../lib/tmdb-api/tmdb-api-provider', () => ({
  TMDBAPIProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../../lib/tmdb-api/tmdb-configuration', () => ({
  TMDBConfiguration: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../../lib/tmdb-api/tmdb-genres', () => ({
  TMDBGenres: ({ children }: { children: React.ReactNode }) => children,
}));

describe('App Layout - Auth Guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects unauthenticated users to /login with redirect param', async () => {
    render(<AppLayout />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/login?redirect=%2Flist'
      );
    });
  });
});
