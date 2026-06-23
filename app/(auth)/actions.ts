"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  getLoginRateLimitKey,
  recordLoginFailure,
} from "@/lib/auth/login-rate-limit";
import { createClient } from "@/lib/supabase/server";

function getCredentials(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || password.length < 6) {
    return null;
  }

  return {
    email: normalizedEmail,
    password,
  };
}

function redirectWithError(message: string): never {
  const params = new URLSearchParams({ error: message });

  redirect(`/login?${params.toString()}`);
}

function getClientIp(headersList: Headers) {
  const forwardedFor = headersList.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return (
    headersList.get("x-real-ip") ??
    headersList.get("cf-connecting-ip") ??
    "unknown"
  );
}

function getRateLimitMessage(lockedUntil?: string | null) {
  if (!lockedUntil) {
    return "Cok fazla hatali deneme yaptiniz. Lutfen daha sonra tekrar deneyin.";
  }

  const retryAt = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(lockedUntil));

  return `Cok fazla hatali deneme yaptiniz. ${retryAt} sonrasinda tekrar deneyin.`;
}

export async function login(formData: FormData) {
  const credentials = getCredentials(formData);

  if (!credentials) {
    redirectWithError("Email ve en az 6 karakterli sifre girin.");
  }

  const headersList = await headers();
  const rateLimitKey = getLoginRateLimitKey({
    email: credentials.email,
    ip: getClientIp(headersList),
  });

  let rateLimit;

  try {
    rateLimit = await checkLoginRateLimit(rateLimitKey);
  } catch {
    redirectWithError(
      "Giris guvenligi dogrulanamadi. Lutfen biraz sonra tekrar deneyin.",
    );
  }

  if (!rateLimit.isAllowed) {
    redirectWithError(getRateLimitMessage(rateLimit.lockedUntil));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    let failedAttempt;

    try {
      failedAttempt = await recordLoginFailure(rateLimitKey);
    } catch {
      redirectWithError(
        "Giris denemesi kaydedilemedi. Lutfen biraz sonra tekrar deneyin.",
      );
    }

    if (!failedAttempt.isAllowed) {
      redirectWithError(getRateLimitMessage(failedAttempt.lockedUntil));
    }

    redirectWithError("Giris bilgileri hatali. Tekrar deneyin.");
  }

  try {
    await clearLoginRateLimit(rateLimitKey);
  } catch {
    // Successful auth should not be blocked if cleanup fails.
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}
