import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import SettingsPage from '../../settings';

// Mock functions
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockSignOut = jest.fn();
const mockGetUser = jest.fn();
const mockRpc = jest.fn();

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  },
}));

// Mock supabase client
jest.mock('../../../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: (...args: any[]) => mockGetUser(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
    },
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: user logged in
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    // Default: empty group members
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });
  });

  it('displays account email', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeTruthy();
    });
  });

  it('displays TMDB attribution', () => {
    render(<SettingsPage />);

    expect(
      screen.getByText(/This application uses TMDB and the TMDB APIs/i)
    ).toBeTruthy();
  });

  it('displays group members section', async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({
          data: [
            { user_id: 'user-1', email: 'test@example.com', joined_at: '2024-01-01' },
            { user_id: 'user-2', email: 'friend@example.com', joined_at: '2024-01-02' },
          ],
          error: null,
        });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeTruthy();
      expect(screen.getByText('friend@example.com')).toBeTruthy();
    });

    // Should show "You" badge for current user
    expect(screen.getByText('You')).toBeTruthy();
  });

  it('displays pending invitations', async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({
          data: [
            { id: 'invite-1', invited_email: 'pending@example.com', created_at: '2024-01-01' },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('pending@example.com')).toBeTruthy();
    });
  });

  it('creates invitation and shows link', async () => {
    mockRpc.mockImplementation((fn: string, params?: any) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'create_group_invite') {
        return Promise.resolve({ data: 'invite-123', error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(<SettingsPage />);

    const emailInput = await screen.findByPlaceholderText('friend@example.com');
    fireEvent.changeText(emailInput, 'newuser@example.com');

    const createButton = screen.getByText('Create Invite');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('create_group_invite', {
        p_invited_email: 'newuser@example.com',
      });
    });

    // Should show invite link
    expect(await screen.findByText(/Invite Link:/i)).toBeTruthy();
  });

  it('copies invite link to clipboard', async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'create_group_invite') {
        return Promise.resolve({ data: 'invite-123', error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(<SettingsPage />);

    const emailInput = await screen.findByPlaceholderText('friend@example.com');
    fireEvent.changeText(emailInput, 'newuser@example.com');

    const createButton = screen.getByText('Create Invite');
    fireEvent.press(createButton);

    await screen.findByText(/Invite Link:/i);

    const copyButton = screen.getByText('Copy');
    fireEvent.press(copyButton);

    // Should show "Copied!" feedback
    expect(await screen.findByText('Copied!')).toBeTruthy();
  });

  it('clears invite link when email changes', async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'create_group_invite') {
        return Promise.resolve({ data: 'invite-123', error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(<SettingsPage />);

    // Create an invite
    const emailInput = await screen.findByPlaceholderText('friend@example.com');
    fireEvent.changeText(emailInput, 'user1@example.com');

    const createButton = screen.getByText('Create Invite');
    fireEvent.press(createButton);

    await screen.findByText(/Invite Link:/i);

    // Change the email
    fireEvent.changeText(emailInput, 'user2@example.com');

    // Link should disappear
    await waitFor(() => {
      expect(screen.queryByText(/Invite Link:/i)).not.toBeTruthy();
    });
  });

  it('sign out button calls signOut and redirects', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    render(<SettingsPage />);

    const signOutButton = await screen.findByText('Sign Out');
    fireEvent.press(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
