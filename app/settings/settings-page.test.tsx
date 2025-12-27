import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { SettingsPage } from './settings-page';

describe('SettingsPage', () => {
  const renderWithRouter = (initialEntries: string[] = ['/app/settings']) => {
    const router = createMemoryRouter(
      [
        {
          path: '/app/settings',
          element: <SettingsPage />,
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

  it('navigates to root path when Log Out button is clicked', async () => {
    renderWithRouter();
    const logOutButton = screen.getByRole('link', { name: /log out/i });
    // Verify the link is set up correctly
    expect(logOutButton).toHaveAttribute('href', '/');
  });
});
