// SpyWell Studio: AI assistant for the super admin. Reads data and proposes changes; changes run only after the admin confirms in the app.
// Auth: caller's access token must belong to a studio admin. Secret: ANTHROPIC_API_KEY. All writes go through the admin's own token, so existing RLS/RPC checks apply.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const SETTING_KEYS = ["ref_pct", "ref_enabled", "sub_price_card", "sub_price_site", "sub_price_domain", "pub_price_invitation", "pub_price_visiting",
  "dir_price_inr", "dir_free_until", "directory_public", "ai_pack_credits", "ai_price_inr", "sub_grace_days"];

const TOOLS = [
  { name: "get_overview", description: "Totals: customers, cards, published, drafts, views, clicks.", input_schema: { type: "object", properties: {} } },
  { name: "get_settings", description: "Current values of price / referral / directory settings.", input_schema: { type: "object", properties: {} } },
  { name: "find_customers", description: "Search customers by name, phone or email (empty = recent). Returns id, name, phone, email, card counts.", input_schema: { type: "object", properties: { search: { type: "string" } } } },
  { name: "list_templates", description: "All templates with id, name, type and whether active.", input_schema: { type: "object", properties: {} } },
  { name: "referral_stats", description: "Referral totals: joined, paid, rewards given, wallet balance outstanding.", input_schema: { type: "object", properties: {} } },
  { name: "set_setting", description: "CHANGE a setting (needs admin confirmation). Allowed keys: " + SETTING_KEYS.join(", ") + ". Prices are whole rupees, ref_pct 0-100, ref_enabled/directory_public are '1' or '0', dir_free_until is an ISO date-time or empty.", input_schema: { type: "object", properties: { key: { type: "string" }, value: { type: "string" } }, required: ["key", "value"] } },
  { name: "set_template_active", description: "CHANGE a template on/off (needs admin confirmation).", input_schema: { type: "object", properties: { template_id: { type: "string" }, active: { type: "boolean" } }, required: ["template_id", "active"] } },
  { name: "block_user", description: "CHANGE: block or unblock a customer's login (needs admin confirmation). Use find_customers first to get the user id.", input_schema: { type: "object", properties: { user_id: { type: "string" }, block: { type: "boolean" } }, required: ["user_id", "block"] } },
  { name: "wallet_adjust", description: "CHANGE: add (positive) or subtract (negative) rupees in a customer's wallet (needs admin confirmation).", input_schema: { type: "object", properties: { user_id: { type: "string" }, amount: { type: "integer" }, note: { type: "string" } }, required: ["user_id", "amount"] } },
  { name: "grant_ai_credits", description: "CHANGE: give a customer N AI-read credits (needs admin confirmation).", input_schema: { type: "object", properties: { user_id: { type: "string" }, n: { type: "integer" } }, required: ["user_id", "n"] } },
];
const WRITES = new Set(["set_setting", "set_template_active", "block_user", "wallet_adjust", "grant_ai_credits"]);

const SYSTEM = `You are the built-in assistant for the super admin of DynaMe / SpyWell Digital Studio (digital visiting cards, mini websites, invitations, business directory, referral wallet, yearly plans). 
Always reply in Hindi written in Devanagari script, short and simple (the admin reads on a phone). Use tools to look things up; never guess numbers.
To change anything, call the matching change tool ONCE with exact values; the admin will be shown a confirm button, and nothing changes until they press it. Never say a change is done until the system tells you it was done.
You cannot delete users, change payment on/off, UPI, API keys or code: if asked, say to use the matching admin panel section. Be honest when you do not know.`;

function describe(name: string, a: any): string {
  switch (name) {
    case "set_setting": return `सेटिंग बदलें: ${a.key} = ${a.value}`;
    case "set_template_active": return `टेम्पलेट ${a.template_id}: ${a.active ? "चालू करें" : "बंद करें"}`;
    case "block_user": return `यूज़र ${a.user_id}: ${a.block ? "ब्लॉक करें" : "अनब्लॉक करें"}`;
    case "wallet_adjust": return `यूज़र ${a.user_id} के वॉलेट में ${a.amount > 0 ? "+" : ""}${a.amount} ₹`;
    case "grant_ai_credits": return `यूज़र ${a.user_id} को ${a.n} AI क्रेडिट दें`;
  }
  return name;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ code: "method" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ code: "unauthorized" }, 401);
  const svc = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: au, error: ae } = await svc.auth.getUser(token);
  if (ae || !au?.user) return json({ code: "unauthorized" }, 401);
  // everything below runs as the admin, so RLS and admin checks in the database still apply
  const me = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const isAdmin = await me.rpc("studio_is_admin");
  if (isAdmin.error || isAdmin.data !== true) return json({ code: "forbidden" }, 403);

  let body: any;
  try { body = JSON.parse(await req.text()); } catch { return json({ code: "bad_request" }, 400); }

  async function run(name: string, a: any): Promise<unknown> {
    switch (name) {
      case "get_overview": {
        const st = await me.rpc("studio_admin_stats"); const vc = await me.rpc("studio_admin_view_counts");
        let views = 0, clicks = 0; (vc.data || []).forEach((x: any) => { views += Number(x.views); clicks += Number(x.clicks); });
        return { stats: st.data, total_views: views, total_clicks: clicks };
      }
      case "get_settings": {
        const r = await me.from("studio_settings").select("k,v").in("k", SETTING_KEYS); return r.data || r.error;
      }
      case "find_customers": {
        const r = await me.rpc("studio_admin_customers", { p_search: String(a?.search || "").slice(0, 60) });
        return Array.isArray(r.data) ? r.data.slice(0, 12) : r.error;
      }
      case "list_templates": {
        const r = await me.from("studio_templates").select("id,name,product_type,active").order("product_type").order("sort"); return r.data || r.error;
      }
      case "referral_stats": return (await me.rpc("studio_admin_ref_stats")).data;
      case "set_setting": {
        const k = String(a?.key || ""), v = String(a?.value ?? "").slice(0, 60);
        if (!SETTING_KEYS.includes(k)) return { error: "यह सेटिंग यहाँ से नहीं बदली जा सकती" };
        if (/^(ref_pct)$/.test(k) && !(+v >= 0 && +v <= 100)) return { error: "0 से 100 के बीच" };
        if (/^(sub_price_|pub_price_|dir_price_inr|ai_pack_credits|ai_price_inr|sub_grace_days)/.test(k) && !(/^\d+$/.test(v) && +v <= 1000000)) return { error: "सही संख्या चाहिए" };
        if (/^(ref_enabled|directory_public)$/.test(k) && !/^[01]$/.test(v)) return { error: "1 या 0" };
        const r = await me.from("studio_settings").update({ v }).eq("k", k).select("k"); return r.error || !r.data?.length ? { error: "नहीं बदला" } : { ok: true };
      }
      case "set_template_active": {
        const r = await me.from("studio_templates").update({ active: !!a?.active }).eq("id", String(a?.template_id || "")).select("id"); return r.error || !r.data?.length ? { error: "नहीं बदला" } : { ok: true };
      }
      case "block_user": { const r = await me.rpc("studio_admin_user_block", { p_user: String(a?.user_id || ""), p_block: !!a?.block }); return r.data ?? { error: "नहीं हुआ" }; }
      case "wallet_adjust": { const r = await me.rpc("studio_admin_wallet_adjust", { p_user: String(a?.user_id || ""), p_amt: Math.trunc(+a?.amount || 0), p_note: String(a?.note || "AI सहायक से").slice(0, 100) }); return r.data ?? { error: "नहीं हुआ" }; }
      case "grant_ai_credits": { const r = await me.rpc("studio_admin_grant", { p_user: String(a?.user_id || ""), p_n: Math.max(1, Math.min(100, Math.trunc(+a?.n || 0))) }); return r.error ? { error: "नहीं हुआ" } : { ok: true, balance: r.data }; }
    }
    return { error: "unknown tool" };
  }

  // Admin pressed "confirm" on a proposed change
  if (body.confirm) {
    const c = body.confirm;
    if (!c?.name || !WRITES.has(c.name)) return json({ code: "bad_request" }, 400);
    return json({ result: await run(c.name, c.input || {}) });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ code: "not_configured" }, 503);
  const msgs: { role: string; content: any }[] = (Array.isArray(body.messages) ? body.messages : []).slice(-14)
    .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ code: "bad_request" }, 400);
  const { data: cfg } = await svc.from("studio_settings").select("v").eq("k", "ai_model").maybeSingle();
  const m0 = String(cfg?.v || "");
  const model = (/^[a-z0-9][a-z0-9.\-]{2,59}$/.test(m0) ? m0 : "") || Deno.env.get("STUDIO_CLAUDE_MODEL") || "claude-sonnet-5-5";

  const convo: any[] = [...msgs]; let text = ""; const pending: any[] = [];
  for (let i = 0; i < 6; i++) {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 50_000);
    let r: Response, j: any;
    try {
      r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal: ctl.signal,
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: 1000, system: SYSTEM + `\nआज की तारीख़: ${new Date().toISOString().slice(0, 10)}`, tools: TOOLS, messages: convo }) });
      j = await r.json();
    } catch { clearTimeout(timer); return json({ code: "ai_timeout" }, 504); }
    clearTimeout(timer);
    if (!r.ok) {
      const m = String(j?.error?.message || r.status);
      return json({ code: r.status === 401 || r.status === 403 ? "ai_key" : /credit|billing/i.test(m) ? "ai_credit" : r.status === 429 || r.status === 529 ? "ai_busy" : "ai_error" }, 502);
    }
    const blocks: any[] = j.content || [];
    text += blocks.filter((b) => b.type === "text").map((b) => b.text).join("");
    const uses = blocks.filter((b) => b.type === "tool_use");
    if (!uses.length) break;
    convo.push({ role: "assistant", content: blocks });
    const results: any[] = [];
    for (const u of uses) {
      if (WRITES.has(u.name)) {
        pending.push({ name: u.name, input: u.input, summary: describe(u.name, u.input) });
        results.push({ type: "tool_result", tool_use_id: u.id, content: "Shown to the admin for confirmation; not executed yet." });
      } else {
        let out: unknown; try { out = await run(u.name, u.input); } catch { out = { error: "failed" }; }
        results.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(out).slice(0, 6000) });
      }
    }
    convo.push({ role: "user", content: results });
    if (pending.length) { // stop here so the admin can confirm
      const ctl2 = new AbortController(); const t2 = setTimeout(() => ctl2.abort(), 30_000);
      try {
        const r2 = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal: ctl2.signal,
          headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model, max_tokens: 400, system: SYSTEM, tools: TOOLS, messages: convo }) });
        const j2 = await r2.json(); if (r2.ok) text += ((j2.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join(""));
      } catch { /* the proposal alone is enough */ }
      clearTimeout(t2); break;
    }
  }
  return json({ text: text.trim(), pending });
});
