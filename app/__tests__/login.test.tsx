import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LoginPage from '../login';

// Mock expo-router
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    get replace() { return mockReplace; },
  },
  Link: ({ children }: { children: React.ReactNode }) => children,
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
