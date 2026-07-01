import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function supabaseServer() { 
  console.log("SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("SUPABASE_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY? "FOUND" : "MISSING")
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { // <- Required by @supabase/ssr
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) { // <- Required by @supabase/ssr
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component. Ignore.
          }
        },
      },
    }
  )
}