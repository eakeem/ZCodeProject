"use server";

import { cookies } from 'next/headers';
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signOut } from "@/lib/auth";

const SESSION_COOKIE_NAME = 'memorial_session';

export async function logoutAndRedirect() {
  await signOut();
  
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  
  revalidatePath("/", "layout"); // clear cache
  redirect("/login"); // redirect to login instead of /
}