import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_SECONDS = 15 * 60;
const LOCK_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 5;

type RateLimitRow = {
  is_allowed: boolean;
  locked_until: string | null;
  failed_attempts: number;
};

type RateLimitResult = {
  attempts: number;
  isAllowed: boolean;
  lockedUntil: string | null;
};

export function getLoginRateLimitKey({
  email,
  ip,
}: {
  email: string;
  ip: string;
}) {
  return createHash("sha256")
    .update(`${email.trim().toLowerCase()}:${ip}`)
    .digest("hex");
}

function normalizeRateLimitRow(row: RateLimitRow): RateLimitResult {
  return {
    attempts: row.failed_attempts,
    isAllowed: row.is_allowed,
    lockedUntil: row.locked_until,
  };
}

async function callRateLimitRpc(
  functionName:
    | "check_login_rate_limit"
    | "record_login_failure"
    | "clear_login_rate_limit",
  keyHash: string,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(functionName, {
    p_key_hash: keyHash,
    p_lock_seconds: LOCK_SECONDS,
    p_max_attempts: MAX_ATTEMPTS,
    p_window_seconds: WINDOW_SECONDS,
  });

  if (error) {
    throw new Error(`Login rate limit RPC failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    return {
      attempts: 0,
      isAllowed: true,
      lockedUntil: null,
    };
  }

  return normalizeRateLimitRow(row as RateLimitRow);
}

export async function checkLoginRateLimit(keyHash: string) {
  return callRateLimitRpc("check_login_rate_limit", keyHash);
}

export async function recordLoginFailure(keyHash: string) {
  return callRateLimitRpc("record_login_failure", keyHash);
}

export async function clearLoginRateLimit(keyHash: string) {
  return callRateLimitRpc("clear_login_rate_limit", keyHash);
}
