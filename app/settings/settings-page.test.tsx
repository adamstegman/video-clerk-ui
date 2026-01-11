import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { SettingsPage } from './settings-page';
import { AppDataProvider } from '../app-data/app-data-provider';

const mockRpc = vi.hoisted(() => vi.fn());
vi.mock('../lib/supabase/client', () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}));

// Mock clipboard API
const mockWriteText = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
});

describe('SettingsPage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  } as any;

  beforeEach(() => {
    mockRpc.mockReset();
    mockWriteText.mockReset();
    mockWriteText.mockResolvedValue(undefined);
    // Ensure navigator exists and mock clipboard
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });
    }
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialEntries: string[] = ['/app/settings'], user = mockUser) => {
    const router = createMemoryRouter(
      [
        {
          path: '/app/settings',
          element: (
            <AppDataProvider data={{ user }}>
              <SettingsPage />
            </AppDataProvider>
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

    const result = render(<RouterProvider router={router} />);
    return { ...result, router };
  };

  it('displays the TMDB attribution text', () => {
    renderWithRouter();
    const attributionText = screen.getByText(
      /This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB/i
    );
    expect(attributionText).toBeInTheDocument();
  });

  it('links to the logout route when Log Out button is clicked', async () => {
    renderWithRouter();
    const logOutButton = screen.getByRole('link', { name: /log out/i });
    expect(logOutButton).toHaveAttribute('href', '/logout');
  });

  it('displays account email when user is logged in', async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('displays both members and pending invitations', async () => {
    const mockMembers = [
      { user_id: 'user-1', email: 'member1@example.com', joined_at: '2024-01-01T00:00:00Z' },
    ];
    const mockPendingInvites = [
      { id: 'invite-1', invited_email: 'pending1@example.com', created_at: '2024-01-01T00:00:00Z' },
    ];

    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: mockMembers, error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: mockPendingInvites, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByText('member1@example.com')).toBeInTheDocument();
      expect(screen.getByText('Pending Members')).toBeInTheDocument();
      expect(screen.getByText('pending1@example.com')).toBeInTheDocument();
    });
  });

  it('creates an invitation when Create invite button is clicked', async () => {
    const user = userEvent.setup();
    const inviteId = 'new-invite-id';

    mockRpc.mockImplementation((fn: string, args?: any) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'create_group_invite') {
        return Promise.resolve({ data: inviteId, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('friend@example.com')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText('friend@example.com');
    const createButton = screen.getByRole('button', { name: /create invite/i });

    expect(createButton).toBeDisabled();

    await user.type(emailInput, 'newuser@example.com');

    await waitFor(() => {
      expect(createButton).not.toBeDisabled();
    });

    await user.click(createButton);

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('create_group_invite', {
        p_invited_email: 'newuser@example.com',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/invite link:/i)).toBeInTheDocument();
    });
  });

  it('displays error message when invitation creation fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to create invite';

    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'create_group_invite') {
        return Promise.resolve({ data: null, error: { message: errorMessage } });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('friend@example.com')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText('friend@example.com');
    const createButton = screen.getByRole('button', { name: /create invite/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays pending invite acceptance section when invite param is present', async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter(['/app/settings?invite=test-invite-id']);

    await waitFor(() => {
      expect(screen.getByText(/You have a pending group invite/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /accept invite/i })).toBeInTheDocument();
    });
  });

  it('accepts an invitation when Accept invite button is clicked', async () => {
    const user = userEvent.setup();
    const inviteId = 'test-invite-id';

    mockRpc.mockImplementation((fn: string, args?: any) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'accept_group_invite') {
        return Promise.resolve({ data: 'group-id', error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter([`/app/settings?invite=${inviteId}`]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accept invite/i })).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /accept invite/i });
    await user.click(acceptButton);

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('accept_group_invite', {
        p_invite_id: inviteId,
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Invite accepted/i)).toBeInTheDocument();
    });
  });

  it('displays error message when invitation acceptance fails', async () => {
    const user = userEvent.setup();
    const inviteId = 'test-invite-id';
    const errorMessage = 'Failed to accept invite';

    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'accept_group_invite') {
        return Promise.resolve({ data: null, error: { message: errorMessage } });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter([`/app/settings?invite=${inviteId}`]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accept invite/i })).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /accept invite/i });
    await user.click(acceptButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables Create invite button after invitation is created until email changes', async () => {
    const user = userEvent.setup();
    const inviteId = 'new-invite-id';

    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'create_group_invite') {
        return Promise.resolve({ data: inviteId, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('friend@example.com')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText('friend@example.com');
    const createButton = screen.getByRole('button', { name: /create invite/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.click(createButton);

    await waitFor(() => {
      expect(createButton).toBeDisabled();
    });

    // Change email - button should be enabled again
    await user.clear(emailInput);
    await user.type(emailInput, 'different@example.com');

    await waitFor(() => {
      expect(createButton).not.toBeDisabled();
    });
  });

  it('clears invite link when email is changed after creating invite', async () => {
    const user = userEvent.setup();
    const inviteId = 'new-invite-id';

    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'create_group_invite') {
        return Promise.resolve({ data: inviteId, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('friend@example.com')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText('friend@example.com');
    const createButton = screen.getByRole('button', { name: /create invite/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/invite link:/i)).toBeInTheDocument();
    });

    // Change email
    await user.clear(emailInput);
    await user.type(emailInput, 'different@example.com');

    await waitFor(() => {
      expect(screen.queryByText(/invite link:/i)).not.toBeInTheDocument();
    });
  });

  it('copies invite link to clipboard when Copy button is clicked', async () => {
    const user = userEvent.setup();
    const inviteId = 'new-invite-id';

    // Ensure clipboard mock is set up for this test
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });

    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'create_group_invite') {
        return Promise.resolve({ data: inviteId, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('friend@example.com')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText('friend@example.com');
    const createButton = screen.getByRole('button', { name: /create invite/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/invite link:/i)).toBeInTheDocument();
    });

    // Wait for the copy button to be enabled (not showing "Copied!" yet)
    const copyButton = await screen.findByRole('button', { name: /^copy$/i });
    expect(copyButton).toBeInTheDocument();

    await user.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('http://localhost:3000/app/settings?invite=new-invite-id');
      expect(screen.getByText(/copied!/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows loading state when creating invitation', async () => {
    const user = userEvent.setup();
    const inviteId = 'new-invite-id';

    let resolveCreateInvite: (value: any) => void;
    const createInvitePromise = new Promise((resolve) => {
      resolveCreateInvite = resolve;
    });

    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'create_group_invite') {
        return createInvitePromise;
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('friend@example.com')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText('friend@example.com');
    const createButton = screen.getByRole('button', { name: /create invite/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/creating…/i)).toBeInTheDocument();
    });

    // Resolve the promise
    resolveCreateInvite!({ data: inviteId, error: null });

    await waitFor(() => {
      expect(screen.queryByText(/creating…/i)).not.toBeInTheDocument();
    });
  });

  it('shows loading state when accepting invitation', async () => {
    const user = userEvent.setup();
    const inviteId = 'test-invite-id';

    let resolveAcceptInvite: (value: any) => void;
    const acceptInvitePromise = new Promise((resolve) => {
      resolveAcceptInvite = resolve;
    });

    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'accept_group_invite') {
        return acceptInvitePromise;
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter([`/app/settings?invite=${inviteId}`]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accept invite/i })).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /accept invite/i });
    await user.click(acceptButton);

    await waitFor(() => {
      expect(screen.getByText(/accepting…/i)).toBeInTheDocument();
    });

    // Resolve the promise
    resolveAcceptInvite!({ data: 'group-id', error: null });

    await waitFor(() => {
      expect(screen.queryByText(/accepting…/i)).not.toBeInTheDocument();
    });
  });

  it('refreshes group members and pending invites after accepting an invitation', async () => {
    const user = userEvent.setup();
    const inviteId = 'test-invite-id';

    let callCount = 0;
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: [], error: null });
        }
        // After accepting, return new member
        return Promise.resolve({
          data: [{ user_id: 'user-1', email: 'newmember@example.com', joined_at: '2024-01-01T00:00:00Z' }],
          error: null,
        });
      }
      if (fn === 'get_pending_group_invites') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'accept_group_invite') {
        return Promise.resolve({ data: 'group-id', error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter([`/app/settings?invite=${inviteId}`]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accept invite/i })).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /accept invite/i });
    await user.click(acceptButton);

    await waitFor(() => {
      expect(screen.getByText(/Invite accepted/i)).toBeInTheDocument();
    });

    // Should refresh members after accepting
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('get_group_members');
    }, { timeout: 2000 });
  });

  it('refreshes pending invites after creating a new invitation', async () => {
    const user = userEvent.setup();
    const inviteId = 'new-invite-id';

    let pendingInvitesCallCount = 0;
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_group_members') {
        return Promise.resolve({ data: [], error: null });
      }
      if (fn === 'get_pending_group_invites') {
        pendingInvitesCallCount++;
        if (pendingInvitesCallCount === 1) {
          return Promise.resolve({ data: [], error: null });
        }
        // After creating, return new pending invite
        return Promise.resolve({
          data: [{ id: inviteId, invited_email: 'newuser@example.com', created_at: '2024-01-01T00:00:00Z' }],
          error: null,
        });
      }
      if (fn === 'create_group_invite') {
        return Promise.resolve({ data: inviteId, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('friend@example.com')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText('friend@example.com');
    const createButton = screen.getByRole('button', { name: /create invite/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.click(createButton);

    // Should refresh pending invites after creating
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('get_pending_group_invites');
    }, { timeout: 2000 });
  });
});
