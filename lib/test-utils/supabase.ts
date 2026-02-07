import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY!;
  return createClient(url, key);
}

export async function createTestUser(
  admin: ReturnType<typeof createAdminClient>,
  email?: string
) {
  const userEmail = email || `test-${crypto.randomUUID()}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email: userEmail,
    password: 'test-password-123',
    email_confirm: true,
  });
  if (error) throw error;

  const { data: session } = await admin.auth.signInWithPassword({
    email: userEmail,
    password: 'test-password-123',
  });

  return {
    userId: data.user.id,
    email: userEmail,
    client: createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${session.session?.access_token}` } } }
    ),
  };
}

export async function cleanupTestUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
) {
  await admin.auth.admin.deleteUser(userId);
}

export async function getGroupId(client: ReturnType<typeof createClient>) {
  const { data } = await client.from('group_memberships').select('group_id').single();
  return data?.group_id;
}
