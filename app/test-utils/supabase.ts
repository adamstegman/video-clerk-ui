import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import type { Database } from '~/lib/supabase/database.types';

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
export const SUPABASE_SECRET_KEY = process.env.VITE_SUPABASE_SECRET_KEY;

export const hasSupabaseEnv =
  typeof SUPABASE_URL === 'string' &&
  SUPABASE_URL.length > 0 &&
  typeof SUPABASE_PUBLISHABLE_KEY === 'string' &&
  SUPABASE_PUBLISHABLE_KEY.length > 0 &&
  typeof SUPABASE_SECRET_KEY === 'string' &&
  SUPABASE_SECRET_KEY.length > 0;

export function createAdminClient() {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are not set');
  }
  return createClient<Database>(SUPABASE_URL!, SUPABASE_SECRET_KEY!);
}

export function createAuthenticatedClient() {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are not set');
  }
  return createClient<Database>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!);
}

export interface TestUser {
  email: string;
  password: string;
  userId: string;
  client: ReturnType<typeof createAuthenticatedClient>;
}

export async function createTestUser(
  adminClient: ReturnType<typeof createAdminClient>
): Promise<TestUser> {
  const email = `test-${crypto.randomUUID()}@example.com`;
  const password = `pw-${crypto.randomUUID()}`;

  const { data: created, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createUserError || !created.user) {
    throw new Error(`Failed to create test user: ${createUserError?.message || 'Unknown error'}`);
  }

  const userId = created.user.id;
  const client = createAuthenticatedClient();

  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // Clean up the user if sign-in fails
    await adminClient.auth.admin.deleteUser(userId);
    throw new Error(`Failed to sign in test user: ${signInError.message}`);
  }

  return { email, password, userId, client };
}

export async function cleanupTestUser(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<void> {
  await adminClient.auth.admin.deleteUser(userId);
}

export async function getGroupId(
  client: ReturnType<typeof createAuthenticatedClient>
): Promise<string> {
  const { data, error } = await client.from('group_memberships').select('group_id').single();
  if (error || !data?.group_id) {
    throw new Error(`Failed to get group ID: ${error?.message || 'No group found'}`);
  }
  return data.group_id as string;
}
