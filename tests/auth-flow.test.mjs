import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

const fixtureKey = "sb_publishable_test_fixture_only";

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}

function decodeHtml(value) {
  return value.replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
}

function browser(origin) {
  const cookies = new Map();
  return {
    cookies,
    async request(path, options = {}) {
      const response = await fetch(`${origin}${path}`, {
        ...options,
        redirect: "manual",
        headers: { Cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join("; "), Origin: origin, ...options.headers },
      });
      for (const cookie of response.headers.getSetCookie()) {
        const [pair] = cookie.split(";");
        const index = pair.indexOf("=");
        const name = pair.slice(0, index);
        const value = pair.slice(index + 1);
        if (!value || /max-age=0/i.test(cookie)) cookies.delete(name);
        else cookies.set(name, value);
      }
      return { status: response.status, location: response.headers.get("location"), headers: response.headers, text: await response.text() };
    },
    async submit(path, fields) {
      const page = await this.request(path);
      assert.equal(page.status, 200);
      const form = new FormData();
      for (const match of page.text.matchAll(/<input\b[^>]*>/g)) {
        const name = match[0].match(/name="([^"]+)"/)?.[1];
        const value = match[0].match(/value="([^"]*)"/)?.[1] ?? "";
        if (name?.startsWith("$ACTION_")) form.append(decodeHtml(name), decodeHtml(value));
      }
      assert.ok([...form.keys()].length > 0, "Expected a real React server-action form");
      for (const [name, value] of Object.entries(fields)) form.append(name, value);
      return this.request(path, { method: "POST", body: form });
    },
  };
}

test("real Next.js routes and server actions enforce the email/password session flow", { timeout: 180_000 }, async (t) => {
  const user = { id: "10000000-0000-4000-8000-000000000099", email: "student@example.com", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const tokens = new Set();
  const profiles = new Set();
  let authRequests = 0;
  let refreshes = 0;
  let logoutFailure = false;
  let profileFailure = false;

  function session() {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: user.id, aud: "authenticated", role: "authenticated", email: user.email, exp: expires, iat: expires - 3600, session_id: randomUUID() })).toString("base64url");
    const signature = createHmac("sha256", "test-only-signing-fixture").update(`${header}.${payload}`).digest("base64url");
    const access_token = `${header}.${payload}.${signature}`;
    tokens.add(access_token);
    return { access_token, refresh_token: "test-refresh-token", token_type: "bearer", expires_in: 3600, expires_at: expires, user };
  }

  // Local fixture only: no live Supabase accounts or email messages are created.
  const authServer = createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    const data = body ? JSON.parse(body) : {};
    const url = new URL(request.url, "http://localhost");
    const authorized = tokens.has(request.headers.authorization?.replace("Bearer ", ""));
    const send = (status, value) => {
      response.writeHead(status, { "Content-Type": "application/json", "X-Supabase-Api-Version": "2024-01-01" });
      response.end(JSON.stringify(value));
    };
    if (request.headers.apikey !== fixtureKey) return send(401, { code: "bad_key", message: "Wrong key" });
    if (url.pathname === "/auth/v1/user") return authorized ? send(200, user) : send(401, { code: "bad_jwt", message: "Invalid token" });
    if (url.pathname === "/auth/v1/token") {
      authRequests++;
      const grant = url.searchParams.get("grant_type");
      if (grant === "refresh_token" && data.refresh_token === "test-refresh-token") { refreshes++; return send(200, session()); }
      if (grant === "pkce" && data.auth_code === "valid-confirmation" && data.code_verifier) return send(200, session());
      if (grant === "password" && data.email === user.email && data.password === "correct-password") return send(200, session());
      return send(400, { code: "invalid_credentials", message: "Invalid login credentials" });
    }
    if (url.pathname === "/auth/v1/signup") {
      authRequests++;
      if (data.email === "duplicate@example.com") return send(422, { code: "user_already_exists", message: "User already registered" });
      if (data.email === "confirm@example.com") {
        assert.ok(data.code_challenge, "Registration must use PKCE");
        assert.equal(new URL(url.searchParams.get("redirect_to")).pathname, "/auth/callback");
        return send(200, { ...user, email: data.email, identities: [{ id: user.id }] });
      }
      return send(200, session());
    }
    if (url.pathname === "/auth/v1/logout") {
      assert.equal(url.searchParams.get("scope"), "local");
      if (logoutFailure) return send(400, { code: "unexpected_failure", message: "Fixture logout error" });
      tokens.delete(request.headers.authorization?.replace("Bearer ", ""));
      response.writeHead(204); return response.end();
    }
    if (url.pathname === "/rest/v1/profiles" && request.method === "POST") {
      if (!authorized || data.id !== user.id) return send(403, { message: "RLS denied" });
      if (profileFailure) return send(503, { message: "Profile temporarily unavailable" });
      assert.match(request.headers.prefer, /resolution=ignore-duplicates/);
      profiles.add(data.id);
      return send(201, null);
    }
    return send(404, { message: "Unexpected fixture request" });
  });
  const authPort = await listen(authServer);
  const reservation = createServer();
  const appPort = await listen(reservation);
  await new Promise((resolve) => reservation.close(resolve));
  const origin = `http://127.0.0.1:${appPort}`;
  let output = "";
  const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(appPort)], {
    cwd: process.cwd(), windowsHide: true,
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${authPort}`, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: fixtureKey, SITE_URL: origin, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  app.stdout.on("data", (chunk) => { output += chunk; });
  app.stderr.on("data", (chunk) => { output += chunk; });
  t.after(async () => {
    if (app.exitCode === null) { app.kill(); await once(app, "exit"); }
    authServer.closeAllConnections();
    await new Promise((resolve) => authServer.close(resolve));
  });
  for (let attempts = 0; !output.includes("Ready in"); attempts++) {
    if (app.exitCode !== null || attempts > 120) throw new Error(`Next.js failed to start: ${output}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const client = browser(origin);
  const protectedPage = await client.request("/dashboard");
  assert.equal(protectedPage.status, 307);
  assert.equal(protectedPage.location, "/login");
  assert.doesNotMatch(protectedPage.text, /student@example.com/);

  const invalid = await client.submit("/register", { email: "invalid", password: "short", confirmPassword: "different" });
  assert.match(invalid.text, /Enter a valid email address/);
  assert.match(invalid.text, /Passwords do not match/);
  assert.equal(authRequests, 0, "Invalid form must not call Supabase");

  const duplicate = await client.submit("/register", { email: "duplicate@example.com", password: "correct-password", confirmPassword: "correct-password" });
  assert.match(duplicate.text, /already exists/);
  const wrongPassword = await client.submit("/login", { email: user.email, password: "wrong-password" });
  assert.match(wrongPassword.text, /email or password is incorrect/);

  const registered = await client.submit("/register", { email: user.email, password: "correct-password", confirmPassword: "correct-password" });
  assert.equal(registered.status, 303);
  assert.equal(registered.location, "/dashboard");
  assert.ok(client.cookies.size);
  const dashboard = await client.request("/dashboard");
  assert.equal(dashboard.status, 200);
  assert.match(dashboard.text, /student@example.com/);
  assert.equal(profiles.size, 1);
  // Next dev overrides cache headers; production is checked separately after build.
  assert.match(dashboard.headers.get("cache-control"), /no-cache|no-store/);
  assert.equal((await client.request("/login")).location, "/dashboard");
  assert.equal((await client.request("/register")).location, "/dashboard");

  profileFailure = true;
  assert.match((await client.request("/dashboard")).text, /couldn’t initialize your profile/);
  profileFailure = false;

  // A new browser request uses the persisted cookies, including after expiry refresh.
  const cookieName = [...client.cookies.keys()].find((name) => name.endsWith("-auth-token"));
  assert.ok(cookieName);
  const stored = JSON.parse(Buffer.from(client.cookies.get(cookieName).slice("base64-".length), "base64url").toString());
  stored.expires_at = 1;
  client.cookies.set(cookieName, `base64-${Buffer.from(JSON.stringify(stored)).toString("base64url")}`);
  assert.equal((await client.request("/dashboard")).status, 200);
  assert.equal(refreshes, 1);
  assert.equal((await client.request("/dashboard")).status, 200);
  assert.equal(refreshes, 1, "Refreshed cookie must persist to the next request");

  logoutFailure = true;
  assert.equal((await client.submit("/dashboard", {})).location, "/login?logout=local");
  assert.equal((await client.request("/dashboard")).location, "/login");
  assert.match((await client.request("/login?logout=local")).text, /signed out of this browser/);
  logoutFailure = false;
  await client.submit("/login", { email: user.email, password: "correct-password" });
  const loggedOut = await client.submit("/dashboard", {});
  assert.equal(loggedOut.status, 303);
  assert.equal(loggedOut.location, "/login");
  assert.equal((await client.request("/dashboard")).location, "/login");

  const loggedIn = await client.submit("/login", { email: user.email, password: "correct-password" });
  assert.equal(loggedIn.location, "/dashboard");
  await client.submit("/dashboard", {});

  const pending = await client.submit("/register", { email: "confirm@example.com", password: "correct-password", confirmPassword: "correct-password" });
  assert.match(pending.text, /Check your inbox/);
  assert.equal((await client.request("/dashboard")).location, "/login");
  const confirmed = await client.request("/auth/callback?code=valid-confirmation&next=https://example.com");
  assert.equal(new URL(confirmed.location).pathname, "/dashboard");
  assert.equal(new URL(confirmed.location).origin, origin);
  assert.equal((await client.request("/dashboard")).status, 200);

  const stranger = browser(origin);
  stranger.cookies.set(cookieName, "base64-invalid-cookie");
  assert.equal((await stranger.request("/dashboard")).location, "/login");
  const failed = await stranger.request("/auth/callback?code=invalid");
  assert.match(failed.location, /\/login\?confirmation=failed$/);
});
