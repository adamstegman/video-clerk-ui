import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LoginPage from '../login';

// Mock expo-router
const mockReplace = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: {
    get replace() { return mockReplace; },
  },
  Link: ({ children }: { children: React.ReactNode }) => children,
  useLocalSearchParams: () => mockSearchParams,
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock supabase client
const mockSignInWithPassword = jest.fn();

jest.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      get signInWithPassword() { return mockSignInWithPassword; },
    },
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
  });

  it('redirects to Watch tab after successful login', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    render(<LoginPage />);

    fireEvent.changeText(screen.getByPlaceholderText('me@example.com'), 'test@example.com');
    fireEvent.changeText(screen.getByDisplayValue(''), 'password123');
    fireEvent.press(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(app)/watch');
    });
  });

  it('redirects to the redirect param after successful login', async () => {
    mockSearchParams = { redirect: '/list' };
    mockSignInWithPassword.mockResolvedValue({ error: null });

    render(<LoginPage />);

    fireEvent.changeText(screen.getByPlaceholderText('me@example.com'), 'test@example.com');
    fireEvent.changeText(screen.getByDisplayValue(''), 'password123');
    fireEvent.press(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/list');
    });
  });

  it('does not redirect on failed login', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid credentials' },
    });

    render(<LoginPage />);

    fireEvent.changeText(screen.getByPlaceholderText('me@example.com'), 'test@example.com');
    fireEvent.changeText(screen.getByDisplayValue(''), 'wrong');
    fireEvent.press(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
