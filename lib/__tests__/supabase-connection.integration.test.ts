// @jest-environment node
import { createAdminClient, createTestUser, cleanupTestUser } from '../test-utils/supabase';

describe('Supabase Integration', () => {
  it('can create admin client and connect', async () => {
    const admin = createAdminClient();

    // Verify connection by getting Supabase status
    const { data, error } = await admin.from('groups').select('count').limit(0);

    // Even if no groups exist, query should succeed without error
    expect(error).toBeNull();
  });

  it('can create and cleanup test user', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);

    expect(testUser.userId).toBeDefined();
    expect(testUser.email).toMatch(/test-.*@test\.local/);
    expect(testUser.client).toBeDefined();

    // Clean up
    await cleanupTestUser(admin, testUser.userId);
  });

  it('test user can query their own data', async () => {
    const admin = createAdminClient();
    const testUser = await createTestUser(admin);

    try {
      // User should be able to query entries (even if empty)
      const { data, error } = await testUser.client
        .from('entries')
        .select('*');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    } finally {
      await cleanupTestUser(admin, testUser.userId);
    }
  });
});
