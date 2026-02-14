import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.EXPO_PUBLIC_SUPABASE_SECRET_KEY!;

export interface TestUser {
  userId: string;
  email: string;
  password: string;
}

let adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
  }
  return adminClient;
}

export async function createTestUser(): Promise<TestUser> {
  const admin = getAdminClient();
  const email = `e2e-${crypto.randomUUID()}@test.local`;
  const password = 'test-password-123';

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;

  return { userId: data.user.id, email, password };
}

export async function cleanupTestUser(userId: string): Promise<void> {
  const admin = getAdminClient();
  await admin.auth.admin.deleteUser(userId);
}

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('me@example.com').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByTestId('login-button').click();
  // Wait for navigation away from login page
  await page.waitForURL(/\/(app\/)?watch/, { timeout: 15_000 });
}
