// Set environment variables BEFORE any modules are loaded
process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.EXPO_PUBLIC_TMDB_API_READ_TOKEN = process.env.EXPO_PUBLIC_TMDB_API_READ_TOKEN || 'test-tmdb-token';
