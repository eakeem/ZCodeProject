'use server'
import { supabaseServer } from '@/lib/server' // <- fix path
import { redirect } from 'next/navigation'

type State = { 
  error: string | null; 
  success: boolean 
}

export async function signup( // <- 1. add prevState first
  prevState: State, 
  formData: FormData
): Promise<State> { // <- 2. add return type
console.log('url', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('anon', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0,10))
  const supabase = await supabaseServer() // <- 3. add await
  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: { 
      data: { name: formData.get('name') as string } 
    }
  })

  if (error) {
    return { error: error.message, success: false }
  }

  if (data.user?.identities?.length === 0) { // <- user already exists
    return { error: 'User already exists. Try logging in.', success: false }
  }

  // If Confirm Email = OFF: you can redirect here
  // redirect('/dashboard') 
  
  // If Confirm Email = ON: return success
  return { error: null, success: true }
}