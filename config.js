const SUPABASE_URL = "https://mhbbspjkzqrjoiptkjol.supabase.co";
const SUPABASE_ANON_KEY = "your-secret-key";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;
