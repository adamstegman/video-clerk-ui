import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../../settings';

// Mock expo-router
const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}));

vi.mock('expo-router', () => ({
  router: mockRouter,
}));

// Mock supabase client
const mockSignOut = vi.hoisted(() => vi.fn());
const mockGetUser = vi.hoisted(() => vi.fn());
const mockRpc = vi.hoisted(() => vi.fn());

vi.mock('../../../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
    },
    rpc: mockRpc,
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    mockSignOut.mockReset();
    mockGetUser.mockReset();
    mockRpc.mockReset();

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
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('displays TMDB attribution', () => {
    render(<SettingsPage />);

    expect(
      screen.getByText(/This application uses TMDB and the TMDB APIs/i)
    ).toBeInTheDocument();
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
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('friend@example.com')).toBeInTheDocument();
    });

    // Should show "You" badge for current user
    expect(screen.getByText('You')).toBeInTheDocument();
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
      expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    });
  });

  it('creates invitation and shows link', async () => {
    const user = userEvent.setup();

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
    await user.type(emailInput, 'newuser@example.com');

    const createButton = screen.getByText('Create Invite');
    await user.click(createButton);

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('create_group_invite', {
        p_invited_email: 'newuser@example.com',
      });
    });

    // Should show invite link
    expect(await screen.findByText(/Invite Link:/i)).toBeInTheDocument();
  });

  it('copies invite link to clipboard', async () => {
    const user = userEvent.setup();

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
    await user.type(emailInput, 'newuser@example.com');

    const createButton = screen.getByText('Create Invite');
    await user.click(createButton);

    await screen.findByText(/Invite Link:/i);

    const copyButton = screen.getByText('Copy');
    await user.click(copyButton);

    // Should show "Copied!" feedback
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  it('clears invite link when email changes', async () => {
    const user = userEvent.setup();

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
    await user.type(emailInput, 'user1@example.com');

    const createButton = screen.getByText('Create Invite');
    await user.click(createButton);

    await screen.findByText(/Invite Link:/i);

    // Change the email
    await user.clear(emailInput);
    await user.type(emailInput, 'user2@example.com');

    // Link should disappear
    await waitFor(() => {
      expect(screen.queryByText(/Invite Link:/i)).not.toBeInTheDocument();
    });
  });

  it('sign out button calls signOut and redirects', async () => {
    const user = userEvent.setup();

    mockSignOut.mockResolvedValue({ error: null });

    render(<SettingsPage />);

    const signOutButton = await screen.findByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });
  });
});
