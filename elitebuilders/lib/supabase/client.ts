import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

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

  client = createBrowserClient(supabaseUrl, supabaseKey)

  console.log("✅ Supabase browser client created successfully")

  return client
}
