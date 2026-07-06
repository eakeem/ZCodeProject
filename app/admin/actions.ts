"use server";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signOut } from "@/lib/auth";

export async function logoutAndRedirect() {
  await signOut();
  const cookieStore = await cookies();
  cookieStore.delete('memorial_session');
  redirect("/");
}