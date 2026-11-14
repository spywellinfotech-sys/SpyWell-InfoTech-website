// SpyWell Digital Studio: buy AI-read credits with Razorpay. Credits are added once per paid order (idempotent).
// Actions (customer access token required): info, create, verify, sync. Optional Razorpay webhook (signature checked).
// Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, optional RAZORPAY_WEBHOOK_SECRET.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-razorpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hmac(secret: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function settings() {
  const { data } = await sb.from("studio_settings").select("k,v").in("k", ["ai_price_inr", "ai_pack_credits", "pub_price_invitation", "pub_price_visiting", "pay_bypass"]);
  const m: Record<string, string> = {}; (data || []).forEach((r: any) => (m[r.k] = r.v));
  const price = parseInt(m.ai_price_inr || "0") || 0, credits = parseInt(m.ai_pack_credits || "0") || 0;
  const pub: Record<string, number> = { invitation: parseInt(m.pub_price_invitation || "0") || 0, visiting: parseInt(m.pub_price_visiting || "0") || 0 };
  return { price, credits, pub, bypass: m.pay_bypass === "1" };
}

// Mark an order paid exactly once: yearly plan (studio_subs) or one-time publish fee (studio_pub_paid).
const RANK: Record<string, number> = { card: 1, site: 2, domain: 3 };
async function fulfillPub(orderId: string, paymentId: string): Promise<boolean> {
  const claim = await sb.from("studio_pub_orders")
    .update({ status: "paid", rzp_payment_id: paymentId, paid_at: new Date().toISOString() })
    .eq("rzp_order_id", orderId).eq("status", "created").select("design_id,plan,new_until,user_id,amount_paise,wallet_used");
  if (claim.error) return false;
  if (!claim.data || claim.data.length === 0) {
    const { data: o } = await sb.from("studio_pub_orders").select("status").eq("rzp_order_id", orderId).maybeSingle();
    return o?.status === "paid";
  }
  const o = claim.data[0] as any;
  let err: unknown = null;
  if (o.plan) {
    const { data: cur } = await sb.from("studio_subs").select("plan,paid_until").eq("design_id", o.design_id).maybeSingle();
    const plan = cur && (RANK[cur.plan] || 0) > (RANK[o.plan] || 0) ? cur.plan : o.plan;
    const until = cur && new Date(cur.paid_until) > new Date(o.new_until) ? cur.paid_until : o.new_until;
    err = (await sb.from("studio_subs").upsert({ design_id: o.design_id, plan, paid_until: until, updated_at: new Date().toISOString() }, { onConflict: "design_id" })).error;
  } else {
    err = (await sb.from("studio_pub_paid").upsert({ design_id: o.design_id, source: "paid" }, { onConflict: "design_id", ignoreDuplicates: true })).error;
  }
  if (err) { await sb.from("studio_pub_orders").update({ status: "created", paid_at: null }).eq("rzp_order_id", orderId); return false; }
  try {
    if (o.wallet_used > 0) await sb.rpc("studio_wallet_spend", { p_user: o.user_id, p_amt: o.wallet_used, p_note: "प्लान भुगतान में उपयोग" });
    await sb.rpc("studio_ref_reward", { p_user: o.user_id, p_paid: Math.round((o.amount_paise || 0) / 100) });
  } catch { /* wallet/referral must never break a paid order */ }
  return true;
}

// Add the credits for a paid order exactly once.
async function fulfill(orderId: string, paymentId: string): Promise<{ ok: boolean; balance?: number; error?: string }> {
  const claim = await sb.from("studio_ai_orders")
    .update({ status: "paid", rzp_payment_id: paymentId, paid_at: new Date().toISOString() })
    .eq("rzp_order_id", orderId).eq("status", "created").select("user_id,credits");
  if (claim.error) return { ok: false, error: "db" };
  if (!claim.data || claim.data.length === 0) {
    const { data: o } = await sb.from("studio_ai_orders").select("status").eq("rzp_order_id", orderId).maybeSingle();
    return o?.status === "paid" ? { ok: true } : { ok: false, error: "order not found" };
  }
  const { user_id, credits } = claim.data[0] as { user_id: string; credits: number };
  const add = await sb.rpc("studio_credit_add", { p_user: user_id, p_n: credits });
  if (add.error) {
    await sb.from("studio_ai_orders").update({ status: "created", paid_at: null }).eq("rzp_order_id", orderId);
    return { ok: false, error: "credit failed" };
  }
  return { ok: true, balance: add.data as number };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ code: "method" }, 405);
  const keyId = Deno.env.get("RAZORPAY_KEY_ID"), keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  const raw = await req.text();

  // Razorpay webhook (optional extra safety net)
  const whSig = req.headers.get("x-razorpay-signature");
  if (whSig) {
    const ws = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!ws || !same(await hmac(ws, raw), whSig)) return json({ code: "bad_signature" }, 400);
    try {
      const ev = JSON.parse(raw);
      if (ev.event === "payment.captured" || ev.event === "order.paid") {
        const p = ev.payload?.payment?.entity;
        if (p?.order_id) { const f = await fulfill(p.order_id, p.id); if (!f.ok) await fulfillPub(p.order_id, p.id); }
      }
    } catch { /* ignore */ }
    return json({ ok: true });
  }

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ code: "unauthorized" }, 401);
  const { data: au, error: ae } = await sb.auth.getUser(token);
  const user = au?.user;
  if (ae || !user) return json({ code: "unauthorized" }, 401);
  let b: Record<string, any> = {};
  try { b = JSON.parse(raw); } catch { return json({ code: "bad_request" }, 400); }

  const st = await settings();
  const configured = !!(keyId && keySecret) && st.price >= 1 && st.credits >= 1;

  if (b.action === "info") return json({ configured, price: st.price, credits: st.credits });

  // ---- paid publishing ----
  if (b.action === "pub_create" || b.action === "pub_verify") {
    if (b.action === "pub_create") {
      const did = clip(b.design_id, 60);
      const { data: d } = await sb.from("studio_designs").select("user_id,product_type").eq("id", did).maybeSingle();
      if (!d || d.user_id !== user.id) return json({ code: "design_not_found" }, 404);
      let price = st.pub[d.product_type] || 0, plan: string | null = null, newUntil: string | null = null;
      if (st.bypass) return json({ code: "free" }, 400);
      if (d.product_type === "visiting") {
        const req = (await sb.rpc("studio_sub_required", { p_id: did })).data as string | null;
        const target = RANK[clip(b.plan, 10)] ? clip(b.plan, 10) : req;
        if (!req || !target || RANK[target] < RANK[req]) return json({ code: "bad_plan" }, 400);
        const q = (await sb.rpc("studio_sub_quote", { p_id: did, p_target: target })).data as any;
        if (!q || q.kind === "none" || !(q.amount >= 1)) return json({ code: "free" }, 400);
        price = q.amount; plan = target; newUntil = q.until;
      } else {
        if (price < 1) return json({ code: "free" }, 400);
        const { data: paid } = await sb.from("studio_pub_paid").select("design_id").eq("design_id", did).maybeSingle();
        if (paid) return json({ code: "already_paid" }, 400);
      }
      if (!keyId || !keySecret) return json({ code: "not_configured" }, 503);
      const wu = ((await sb.rpc("studio_wallet_use", { p_user: user.id, p_amount: price })).data as number) || 0;
      const amount = (price - wu) * 100;
      const r = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) },
        body: JSON.stringify({ amount, currency: "INR", receipt: "spb_" + crypto.randomUUID().slice(0, 8), notes: { user: user.id, design: did, plan: plan || "invitation" } }),
      });
      const ro = await r.json();
      if (!r.ok || !ro.id) return json({ code: "order_failed" }, 502);
      const ins = await sb.from("studio_pub_orders").insert({ rzp_order_id: ro.id, user_id: user.id, design_id: did, amount_paise: amount, plan, new_until: newUntil, wallet_used: wu });
      if (ins.error) return json({ code: "db" }, 500);
      return json({ order_id: ro.id, key_id: keyId, amount, wallet_used: wu });
    }
    const oid = clip(b.order_id, 60), pid = clip(b.payment_id, 60), sig = clip(b.signature, 100);
    if (!oid || !pid || !sig || !keySecret) return json({ code: "bad_request" }, 400);
    const { data: own } = await sb.from("studio_pub_orders").select("user_id").eq("rzp_order_id", oid).maybeSingle();
    if (!own || own.user_id !== user.id) return json({ code: "order_not_found" }, 404);
    if (!same(await hmac(keySecret, `${oid}|${pid}`), sig)) return json({ code: "not_verified" }, 400);
    if (!(await fulfillPub(oid, pid))) return json({ code: "fulfill_failed" }, 500);
    return json({ ok: true });
  }
  if (b.action === "pub_sync") {
    if (!keyId || !keySecret) return json({ ok: true });
    const { data: pend } = await sb.from("studio_pub_orders").select("rzp_order_id").eq("user_id", user.id).eq("status", "created")
      .gte("created_at", new Date(Date.now() - 3 * 86400000).toISOString()).limit(5);
    for (const o of pend || []) {
      const r = await fetch(`https://api.razorpay.com/v1/orders/${o.rzp_order_id}/payments`, { headers: { Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) } });
      if (!r.ok) continue;
      const cap = ((await r.json()).items || []).find((p: any) => p.status === "captured");
      if (cap) await fulfillPub(o.rzp_order_id, cap.id);
    }
    return json({ ok: true });
  }
  if (!configured) return json({ code: "not_configured" }, 503);

  if (b.action === "create") {
    const amount = st.price * 100;
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) },
      body: JSON.stringify({ amount, currency: "INR", receipt: "sai_" + crypto.randomUUID().slice(0, 8), notes: { user: user.id } }),
    });
    const ro = await r.json();
    if (!r.ok || !ro.id) return json({ code: "order_failed" }, 502);
    const ins = await sb.from("studio_ai_orders").insert({ rzp_order_id: ro.id, user_id: user.id, amount_paise: amount, credits: st.credits });
    if (ins.error) return json({ code: "db" }, 500);
    return json({ order_id: ro.id, key_id: keyId, amount, credits: st.credits });
  }

  if (b.action === "verify") {
    const oid = clip(b.order_id, 60), pid = clip(b.payment_id, 60), sig = clip(b.signature, 100);
    if (!oid || !pid || !sig) return json({ code: "bad_request" }, 400);
    const { data: own } = await sb.from("studio_ai_orders").select("user_id").eq("rzp_order_id", oid).maybeSingle();
    if (!own || own.user_id !== user.id) return json({ code: "order_not_found" }, 404);
    if (!same(await hmac(keySecret!, `${oid}|${pid}`), sig)) return json({ code: "not_verified" }, 400);
    const res = await fulfill(oid, pid);
    if (!res.ok) return json({ code: "credit_failed" }, 500);
    const { data: c } = await sb.from("studio_ai_credits").select("balance").eq("user_id", user.id).maybeSingle();
    return json({ ok: true, balance: c?.balance ?? 0 });
  }

  // Recovery: if the customer paid but the browser closed before "verify", ask Razorpay and credit.
  if (b.action === "sync") {
    const { data: pend } = await sb.from("studio_ai_orders").select("rzp_order_id").eq("user_id", user.id).eq("status", "created")
      .gte("created_at", new Date(Date.now() - 3 * 86400000).toISOString()).limit(5);
    for (const o of pend || []) {
      const r = await fetch(`https://api.razorpay.com/v1/orders/${o.rzp_order_id}/payments`, { headers: { Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) } });
      if (!r.ok) continue;
      const pj = await r.json();
      const cap = (pj.items || []).find((p: any) => p.status === "captured");
      if (cap) await fulfill(o.rzp_order_id, cap.id);
    }
    const { data: c } = await sb.from("studio_ai_credits").select("balance").eq("user_id", user.id).maybeSingle();
    return json({ ok: true, balance: c?.balance ?? 0 });
  }

  return json({ code: "bad_request" }, 400);
});
