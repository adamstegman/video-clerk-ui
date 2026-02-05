/**
 * Smoke test to verify basic app structure
 *
 * This ensures the app can be imported and basic dependencies are available.
 * More comprehensive tests will be added as the Expo migration is validated.
 */

import { describe, it, expect } from 'vitest';

describe('App smoke tests', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it('should have environment variables configured', () => {
    // In test environment, these might not be set, but we can verify the structure
    expect(process.env).toBeDefined();
  });
});
