import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// DETEKTOR KEBOCORAN ENV
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 [FATAL ERROR] Kunci Supabase KOSONG! Next.js gagal membaca file .env.local. Pastikan letak file sudah benar di luar folder 'src'.");
}

export const supabase = createClient(
  supabaseUrl || "https://dummy.supabase.co", 
  supabaseAnonKey || "dummy-key"
);