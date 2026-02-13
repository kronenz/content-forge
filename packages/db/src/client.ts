/**
 * Supabase client singleton for ContentForge.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Initialize the Supabase client. Call once at application startup.
 */
export function initDbClient(url: string, anonKey: string): SupabaseClient {
  client = createClient(url, anonKey);
  return client;
}

/**
 * Get the initialized Supabase client. Throws if not initialized.
 */
export function getDbClient(): SupabaseClient {
  if (!client) {
    throw new Error('DB client not initialized. Call initDbClient() first.');
  }
  return client;
}

/**
 * Reset the client (for testing).
 */
export function resetDbClient(): void {
  client = null;
}
