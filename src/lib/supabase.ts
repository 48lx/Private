import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

// Server-side Supabase client (for API routes)
export const createServerSupabase = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
};

// Types for our database tables
export interface Photo {
  id: string;
  url: string;
  description: string;
  month_key: string;
  category: string | null; // 自定义分类，如"演唱会回忆"
  created_at: string;
}

export interface Music {
  id: string;
  title: string;
  artist: string;
  url: string;
  is_builtin: boolean;
  created_at: string;
}

export interface Skin {
  id: string;
  champion: string;
  skin_name: string;
  image_url: string;
  created_at: string;
}
