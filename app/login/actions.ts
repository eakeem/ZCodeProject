'use server'
import { supabaseServer } from '@/lib/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await supabaseServer()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  
  redirect('/dashboard')
}