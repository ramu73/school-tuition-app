// ==========================================================================
// Supabase Client Wrapper & Real-Time Synchronizer
// ==========================================================================

import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './storage';

let supabaseInstance = null;

export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      if (!supabaseInstance) {
        supabaseInstance = createClient(config.url, config.anonKey);
      }
      return supabaseInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

// Test live connection to Supabase
export async function testSupabaseConnection(url, anonKey) {
  try {
    const testClient = createClient(url, anonKey);
    const { data, error } = await testClient.from('class_levels').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's still connected!
      return { success: true, message: 'Connected to Supabase! (Tables ready for setup)' };
    }
    return { success: true, message: 'Successfully connected to live Supabase PostgreSQL!' };
  } catch (e) {
    return { success: false, message: e.message || 'Connection failed. Check URL and Anon Key.' };
  }
}
