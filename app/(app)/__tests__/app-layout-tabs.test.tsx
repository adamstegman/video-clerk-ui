import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import AppLayout from '../_layout';

// Capture Tabs.Screen props for assertions
const capturedScreens: Array<{ name: string; options: any }> = [];

// Mock expo-router Tabs to capture screen configuration
jest.mock('expo-router', () => {
  function MockTabs({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }

  function MockScreen({ name, options }: { name: string; options: any }) {
    capturedScreens.push({ name, options });
    return null;
  }

  MockTabs.Screen = MockScreen;

  return {
    Tabs: MockTabs,
    router: {
      replace: jest.fn(),
    },
  };
});

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Play: () => null,
  List: () => null,
  Settings: () => null,
  Check: () => null,
  ChevronLeft: () => null,
}));

// Mock supabase client - simulate authenticated user
const mockUnsubscribe = jest.fn();
jest.mock('../../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
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

describe('App Layout - Tab Bar Configuration', () => {
  beforeEach(() => {
    capturedScreens.length = 0;
  });

  async function renderLayout() {
    render(<AppLayout />);
    // Wait for auth check to complete and tabs to render
    await waitFor(() => {
      expect(capturedScreens.length).toBeGreaterThan(0);
    });
  }

  it('shows exactly 3 visible tabs: Watch, List, Settings', async () => {
    await renderLayout();

    const visibleTabs = capturedScreens.filter(s => s.options.href !== null);
    const tabTitles = visibleTabs.map(s => s.options.title);

    expect(tabTitles).toEqual(['Watch', 'List', 'Settings']);
  });

  it('shows Watch as the first tab', async () => {
    await renderLayout();

    const visibleTabs = capturedScreens.filter(s => s.options.href !== null);
    expect(visibleTabs[0].name).toBe('watch/index');
    expect(visibleTabs[0].options.title).toBe('Watch');
  });

  it('shows List as the second tab', async () => {
    await renderLayout();

    const visibleTabs = capturedScreens.filter(s => s.options.href !== null);
    expect(visibleTabs[1].name).toBe('list/index');
    expect(visibleTabs[1].options.title).toBe('List');
  });

  it('shows Settings as the third tab', async () => {
    await renderLayout();

    const visibleTabs = capturedScreens.filter(s => s.options.href !== null);
    expect(visibleTabs[2].name).toBe('settings');
    expect(visibleTabs[2].options.title).toBe('Settings');
  });

  it('hides the add-to-list route from the tab bar', async () => {
    await renderLayout();

    const addScreen = capturedScreens.find(s => s.name === 'list/add/index');
    expect(addScreen).toBeDefined();
    expect(addScreen!.options.href).toBeNull();
  });

  it('hides the edit-entry route from the tab bar', async () => {
    await renderLayout();

    const editScreen = capturedScreens.find(s => s.name === 'list/[entryId]');
    expect(editScreen).toBeDefined();
    expect(editScreen!.options.href).toBeNull();
  });
});
