"use server";
import { cookies } from 'next/headers';
import { signOut } from "@/lib/auth";

export async function logoutAndRedirect() {
  await signOut();
  const cookieStore = await cookies();
  cookieStore.delete('memorial_session'); // use your real cookie name
  return { success: true }
}