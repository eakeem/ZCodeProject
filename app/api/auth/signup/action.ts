'use server'
import { supabaseServer } from '@/lib/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const supabase = await supabaseServer()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }// -> goes to your trigger -> tenants.name
  })

  if (error){
     return { error: error.message }
  }
  redirect('/dashboard') 
}