const SUPABASE_URL = "https://mhbbspjkzqrjoiptkjol.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SgvcpROQd2ClG9HzsAL3UA_AzqI0zvw";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;
