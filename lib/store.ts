import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Replace your old getMemorials() from store.ts
export async function getMemorials(tenantId: string) {
  const { data, error } = await supabase
    .from('memorials')
    .select('*')
    .eq('tenant_id', tenantId)
  if (error) throw error
  return data || []
}

// Replace your old createMemorial() from store.ts  
export async function createMemorial(data: any) {
  const { data: result, error } = await supabase
    .from('memorials')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return result
}