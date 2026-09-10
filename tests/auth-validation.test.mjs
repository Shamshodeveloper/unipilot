import assert from "node:assert/strict";
import { test } from "node:test";
import { loginSchema, registerSchema, authErrorMessage } from "../src/lib/validation/auth.ts";
import { getSupabaseConfig } from "../src/lib/supabase/config.ts";

test("login trims email but preserves the password exactly", () => {
  const result = loginSchema.parse({ email: " student@example.com ", password: " spaced password " });
  assert.equal(result.email, "student@example.com");
  assert.equal(result.password, " spaced password ");
});

test("invalid email, missing fields and oversized passwords are rejected", () => {
  for (const input of [
    { email: "bad", password: "password" },
    { email: "student@example.com", password: "" },
    { email: null, password: "password" },
    { email: "student@example.com", password: "a".repeat(129) },
  ]) assert.equal(loginSchema.safeParse(input).success, false);
});

test("registration enforces length and matching confirmation", () => {
  const valid = { email: "student@example.com", password: "study-test-password", confirmPassword: "study-test-password" };
  assert.equal(registerSchema.safeParse(valid).success, true);
  const mismatch = registerSchema.safeParse({ ...valid, confirmPassword: "different" });
  assert.equal(mismatch.success, false);
  assert.equal(mismatch.error.issues[0].path[0], "confirmPassword");
  assert.equal(registerSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" }).success, false);
});

test("provider errors use safe messages for duplicate, unconfirmed, rate-limited and unknown errors", () => {
  assert.match(authErrorMessage({ code: "user_already_exists" }), /already exists/);
  assert.match(authErrorMessage({ code: "invalid_credentials" }), /email or password is incorrect/);
  assert.match(authErrorMessage({ code: "email_not_confirmed" }), /Confirm your email/);
  assert.match(authErrorMessage({ status: 429 }), /Too many attempts/);
  assert.doesNotMatch(authErrorMessage({ code: "unknown", message: "private provider details" }), /private provider details/);
});

test("Supabase configuration accepts public keys and rejects privileged or missing keys", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_fixture_only";
    assert.ok(getSupabaseConfig());
    for (const key of ["", "sb_secret_test_fixture_only", "not-a-public-key"]) {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = key;
      assert.equal(getSupabaseConfig(), null);
    }
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_fixture_only";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://untrusted.example.com";
    assert.equal(getSupabaseConfig(), null);
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});
