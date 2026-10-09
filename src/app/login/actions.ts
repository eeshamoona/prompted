"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function safeNext(formData: FormData) {
  const next = field(formData, "next");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function back(next: string, key: "message" | "error", text: string): never {
  redirect(`/login?next=${encodeURIComponent(next)}&${key}=${encodeURIComponent(text)}`);
}

export async function signIn(formData: FormData) {
  const next = safeNext(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: field(formData, "email"), password: field(formData, "password") });
  if (error) back(next, "error", "That email and password didn’t match. Try again, or use a magic link.");
  redirect(next);
}

export async function signUp(formData: FormData) {
  const next = safeNext(formData);
  const password = field(formData, "password");
  if (password.length < 6) back(next, "error", "Choose a password of at least 6 characters.");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: field(formData, "email"),
    password,
    options: { emailRedirectTo: `${await origin()}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error) back(next, "error", error.message);
  if (data.session) redirect(next);
  back(next, "message", "Check your email to confirm your account.");
}

export async function sendMagicLink(formData: FormData) {
  const next = safeNext(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: field(formData, "email"),
    options: { emailRedirectTo: `${await origin()}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error) back(next, "error", error.message);
  back(next, "message", "Check your email for a sign-in link.");
}
