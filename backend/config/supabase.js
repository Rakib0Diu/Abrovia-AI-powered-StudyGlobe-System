const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env or deployment environment.'
  );
}

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

// Shared service_role client for database queries and admin auth operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, clientOptions);

// Fresh client factory for signInWithPassword and refreshSession so user sessions
// never mutate or leak into the shared service_role client
function createAuthClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, clientOptions);
}

module.exports = {
  supabase,
  createAuthClient,
};

