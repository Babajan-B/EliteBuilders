import { createClient } from "@supabase/supabase-js"

let client: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (client) {
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("🔧 Supabase Client Init:", { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseKey,
    url: supabaseUrl?.substring(0, 30) + "..."
  })

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables!")
    throw new Error("Missing Supabase environment variables")
  }

  client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  console.log("✅ Supabase client created successfully")

  return client
}
