// 3x3 save-routine-key (ARCHITECTURE_v2 sections 3, 11, 13; Connections > Worker).
// User-facing: deployed with verify_jwt = false because the code itself verifies the user JWT with auth.getUser (works with the new asymmetric JWT keys); the uid comes from the JWT, never from the body.
// Body: {webhook_url, routine_key}. The routine key and webhook URL go to Supabase Vault; a new signing secret is generated
// here, stored in Vault, and returned ONCE (the user saves it in their Grok Bot as THREEX3_SIGNING_SECRET).
// Earlier active keys of the user are retired (active_to = now()). Nothing secret is logged. No secret lives in this file.
import postgres from "npm:postgres@3.4.5";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ORIGINS = ["https://3x3.johnnybodegas.com", "https://bodegasjohnny-sketch.github.io", "http://localhost:8080"];
const cors = (o: string | null) => ({
  "Access-Control-Allow-Origin": o && ORIGINS.includes(o) ? o : ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin", "Cache-Control": "no-store",
});
const b64u = (a: Uint8Array) => btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const rnd = (n: number) => crypto.getRandomValues(new Uint8Array(n));

function checkUrl(v: unknown): string | null {
  if (typeof v !== "string" || v.length > 300) return "Enter the full https:// webhook URL (max 300 characters).";
  let u: URL; try { u = new URL(v.trim()); } catch { return "Enter the full https:// webhook URL of your 3x3 routine."; }
  if (u.protocol !== "https:") return "The webhook URL must start with https://";
  if (u.username || u.password) return "Remove the user name or password from the URL.";
  if (/[?&](key|token|secret|sig)=/i.test(u.search)) return "Remove credentials from the URL. The routine key goes in its own field.";
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[?::1)/i.test(u.hostname)) return "The webhook URL must be a public address.";
  return null;
}
function checkKey(v: unknown): string | null {
  if (typeof v !== "string" || v.length < 16 || v.length > 512 || /\s/.test(v)) return "Paste the routine key exactly as Grok Bot shows it (16-512 characters, no spaces).";
  if (/^test_/i.test(v)) return "That is a test placeholder, not a real routine key.";
  return null;
}

Deno.serve(async (req) => {
  const h = { ...cors(req.headers.get("Origin")), "Content-Type": "application/json" };
  const out = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: h });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return out(405, { error: "POST only" });
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt || jwt.split(".").length !== 3) return out(401, { error: "Sign in again." });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY") ?? req.headers.get("apikey") ?? "", { auth: { persistSession: false } });
  const { data: ud, error: ue } = await sb.auth.getUser(jwt);
  if (ue || !ud?.user) return out(401, { error: "Sign in again." });
  const uid = ud.user.id;
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return out(400, { error: "Bad JSON." }); }
  if (body.action === "status" || body.action === "remove") {
    const q = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false });
    try {
      if (body.action === "remove") await q.begin(async (t) => { await t`set local role app_rpc`; await t`update public.worker_keys set active_to = now() where user_id = ${uid} and active_to is null`; });
      const r = await q`select key_id, routine_key_hint, active_from, polling_enabled from public.worker_keys where user_id = ${uid} and active_to is null order by active_from desc limit 1`;
      return out(200, r.length ? { status: "saved_untested", ...r[0] } : { status: "missing" });
    } catch (err) { console.error("status failed", (err as { code?: string }).code ?? "error"); return out(500, { error: "Could not read status." }); }
    finally { await q.end({ timeout: 2 }); }
  }
  const e = checkUrl(body.webhook_url) || checkKey(body.routine_key);
  if (e) return out(422, { error: e });
  const url = String(body.webhook_url).trim(), rk = String(body.routine_key);
  const keyId = "wk_" + b64u(rnd(12)), signing = "wks_" + b64u(rnd(32)), hint = rk.slice(-4);
  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false });
  try {
    // rate limit: 10 saves an hour per user (section 13), counted from worker_keys rows
    const [{ n }] = await sql`select count(*)::int n from public.worker_keys where user_id = ${uid} and active_from > now() - interval '1 hour'`;
    if (n >= 10) return out(429, { error: "Too many saves this hour. Try again later." });
    await sql.begin(async (t) => {
      const [{ id: rkId }] = await t`select vault.create_secret(${rk}, ${"routine_key:" + keyId}, 'Grok Bot routine key (3x3)') id`;
      const [{ id: hmId }] = await t`select vault.create_secret(${signing}, ${"signing_secret:" + keyId}, '3x3 signing secret') id`;
      await t`select vault.create_secret(${url}, ${"routine_url:" + keyId}, 'Grok Bot routine webhook URL (3x3)')`;
      await t`set local role app_rpc`;
      await t`update public.worker_keys set active_to = now() where user_id = ${uid} and active_to is null`;
      await t`insert into public.worker_keys(user_id, key_id, hmac_secret_id, routine_key_secret_id, routine_key_hint, polling_enabled, template_version, active_from)
              values (${uid}, ${keyId}, ${hmId}, ${rkId}, ${hint}, false, 1, now())`;
    });
    return out(200, { key_id: keyId, signing_secret: signing, routine_key_hint: hint, webhook_origin: new URL(url).origin, status: "saved_untested" });
  } catch (err) {
    console.error("save-routine-key failed", (err as { code?: string }).code ?? "error"); // no values logged
    return out(500, { error: "Could not save. Nothing was stored." });
  } finally { await sql.end({ timeout: 2 }); }
});
