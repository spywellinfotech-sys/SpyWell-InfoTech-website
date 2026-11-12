// SpyWell Digital Studio: read a card photo / PDF pages with Claude and return an editable design (JSON).
// Auth: the caller's Supabase access token is verified here (verify_jwt is off at the gateway).
// Secrets: ANTHROPIC_API_KEY (required), STUDIO_CLAUDE_MODEL, STUDIO_AI_DAILY_LIMIT (optional).
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const FIELDS: Record<string, Record<string, number>> = {
  invitation: { heading: 60, bride: 60, bride_parents: 200, groom: 60, groom_parents: 200, date: 10, time: 5, venue: 100, address: 200, message: 500, c1_name: 50, c1_phone: 15, c2_name: 50, c2_phone: 15, extra: 400 },
  visiting: { name: 60, business: 80, designation: 60, mobile: 15, whatsapp: 15, email: 100, address: 200, website: 150, about: 400, facebook: 200, instagram: 200, youtube: 200, linkedin: 200 },
};
const FONTS = ["hind", "poppins", "mukta", "playfair", "tiro", "yatra", "vibes"];
const LAYOUTS: Record<string, string[]> = { invitation: ["frame", "double", "arch", "plain"], visiting: ["band", "wave", "side"] };
const ORNAMENTS = ["none", "❖", "❁", "❋", "✦", "❀", "❦", "ॐ", "❤"];
const PETALS = ["none", "❀", "❦", "✦", "❤", "★"];
const ANIMS = ["rich", "soft", "none"];
const ALIGNS = ["left", "center", "right"];
const MEDIA = ["image/jpeg", "image/png", "image/webp"];

const str = (v: unknown, n: number) => (typeof v === "string" || typeof v === "number" ? String(v).slice(0, n).trim() : "");
const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : "");
function lum(h: string) {
  const n = parseInt(h.slice(1), 16);
  const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}
function contrast(a: string, b: string) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function magicOk(type: string, b64: string) {
  try {
    const bin = atob(b64.slice(0, 16)); const c = (i: number) => bin.charCodeAt(i);
    if (type === "image/jpeg") return c(0) === 0xff && c(1) === 0xd8 && c(2) === 0xff;
    if (type === "image/png") return c(0) === 0x89 && bin.slice(1, 4) === "PNG";
    if (type === "image/webp") return bin.slice(0, 4) === "RIFF" && bin.slice(8, 12) === "WEBP";
  } catch (_) { /* not base64 */ }
  return false;
}

const OCC: Record<string, string> = {
  engagement: "engagement / roka ceremony", birthday: "birthday party", anniversary: "wedding anniversary", griha: "griha pravesh (housewarming)",
  baby: "naamkaran / mundan / baby shower", puja: "puja / jagran / katha", opening: "shop or office opening (udghatan)", party: "party or other function",
};

function prompt(type: string, mode: string, templates: { id: string; name: string; config: any }[], occasion = "wedding") {
  const occName = OCC[occasion] || "";
  const keys = type === "invitation"
    ? `fields: heading (top line such as a blessing, exactly as printed), bride, bride_parents, groom, groom_parents, date (wedding date as YYYY-MM-DD), time (24-hour HH:MM), venue, address, message (invitation wording), c1_name, c1_phone (10 digits), c2_name, c2_phone, extra
events: array (max 8) of {title, date (YYYY-MM-DD), time (HH:MM), place} for functions such as सगाई, हल्दी, मेंहदी, संगीत, शादी, रिसेप्शन`
    : `fields: name (person), business, designation, mobile (10 digits), whatsapp (10 digits, only if marked as WhatsApp), email, address, website, about (one or two sentences describing the business, only from what is printed), facebook, instagram, youtube, linkedin
services: array (max 12) of short strings`;
  const tpl = templates.filter((t) => type !== "invitation" || (t.config?.occasion || "wedding") === (OCC[occasion] ? occasion : "wedding")).map((t) => `${t.id}: ${t.config?.style || ""}, layout ${t.config?.layout || ""}, colours bg ${t.config?.palette?.bg} text ${t.config?.palette?.fg} accent ${t.config?.palette?.ac}`).join("\n");
  const L = LAYOUTS[type].join(", ");
  const design = mode === "creative"
    ? `DESIGN (AI Creative): the customer already chose a base template; improve on it with a fresh, tasteful ANIMATED look for this content. Choose every design value yourself:
- template_id (keep the chosen base unless another clearly suits better), layout (${L}), bg / fg / ac colours (hex; text must have strong contrast on bg, accent must stand out), font and nameFont, ornament (${ORNAMENTS.join(" ")}), anim (rich = falling decorations + shimmer, soft = gentle fade only, none), petal (falling decoration: ${PETALS.join(" ")}), align (left, center or right).
Match the mood of the content (traditional red and gold, floral pink, modern navy, and so on). If the card has no ${type === "invitation" ? "invitation message" : "business description"}, you may write one short, warm line in the same language as the card and put it in ${type === "invitation" ? "message" : "about"}.`
    : `DESIGN: none. The customer already chose the template and its design; read the content only. Return "design":{}.`;
  const occNote = type === "invitation" && occName
    ? `\nThis is an invitation for a ${occName}, not a wedding. Reuse the same keys: put the main person or event title in "bride", their short description in "bride_parents", and a second person (if the card has one, such as in an engagement or anniversary) in "groom" and "groom_parents". "date" is the date of this function.`
    : "";
  return `You are reading a ${type === "invitation" ? (occName ? "invitation card" : "wedding invitation card") : "business / visiting card"} from India.${occNote} The image(s) are pages or photos of ONE card.

Return ONLY one JSON object, no other words, with this shape:
{"fields":{...},${type === "invitation" ? '"events":[...]' : '"services":[...]'},"design":${mode === "creative" ? '{"template_id":"...","layout":"...","bg":"#rrggbb","fg":"#rrggbb","ac":"#rrggbb","font":"...","nameFont":"...","ornament":"...","anim":"...","petal":"...","align":"..."}' : "{}"}}

CONTENT rules:
- Copy text exactly as printed. Keep Hindi in Devanagari and English in English. Do not translate and do not guess.
- Anything not on the card is an empty string "" (or an empty array).
- Phone numbers: digits only.
${keys}

${design}${mode === "creative" ? `
template_id must be one of:
${tpl}
font and nameFont must each be one of: ${FONTS.join(", ")} (hind, mukta, tiro and yatra suit Hindi; vibes is a script font for names; playfair is an elegant serif).` : ""}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ code: "method" }, 405);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ code: "unauthorized" }, 401);
  const { data: au, error: ae } = await sb.auth.getUser(token);
  const user = au?.user;
  if (ae || !user) return json({ code: "unauthorized" }, 401);

  const raw = await req.text();
  if (raw.length > 9_000_000) return json({ code: "too_big" }, 413);
  let body: any;
  try { body = JSON.parse(raw); } catch { return json({ code: "bad_request" }, 400); }
  const type = body?.product_type === "visiting" ? "visiting" : body?.product_type === "invitation" ? "invitation" : "";
  const mode = body?.mode === "creative" ? "creative" : "content";
  const occasion = typeof body?.occasion === "string" && OCC[body.occasion] ? body.occasion : "wedding";
  const files = Array.isArray(body?.files) ? body.files : [];
  if (!type || files.length < 1 || files.length > 4) return json({ code: "bad_request" }, 400);
  for (const f of files) {
    if (!f || !MEDIA.includes(f.media_type) || typeof f.data !== "string" || f.data.length < 100 || f.data.length > 3_000_000 || !magicOk(f.media_type, f.data))
      return json({ code: "bad_file" }, 400);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ code: "not_configured" }, 503);

  const limit = Math.max(1, parseInt(Deno.env.get("STUDIO_AI_DAILY_LIMIT") || "10") || 10);
  const IST = 5.5 * 3600 * 1000;
  const dayStart = new Date(Math.floor((Date.now() + IST) / 86400000) * 86400000 - IST);
  const { count } = await sb.from("studio_ai_usage").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", dayStart.toISOString());
  const used = count || 0;
  if (used >= limit) return json({ code: "limit", used, limit }, 429);

  // Payment gate: one credit per read, taken atomically BEFORE the AI is called; refunded on any failure.
  const { data: adm } = await sb.from("studio_roles").select("user_id").eq("user_id", user.id).maybeSingle();
  const free = !!adm;
  let taken = false;
  if (!free) {
    const { data: ok, error: ce } = await sb.rpc("studio_credit_take", { p_user: user.id });
    if (ce) return json({ code: "ai_error" }, 500);
    if (ok !== true) return json({ code: "no_credit" }, 402);
    taken = true;
  }
  const refund = async () => { if (taken) { taken = false; await sb.rpc("studio_credit_add", { p_user: user.id, p_n: 1 }); } };

  const model = Deno.env.get("STUDIO_CLAUDE_MODEL") || "claude-sonnet-5-5";
  const { data: row } = await sb.from("studio_ai_usage").insert({ user_id: user.id, product_type: type, mode, model }).select("id").single();
  const finish = async (patch: Record<string, unknown>) => { if (row?.id) await sb.from("studio_ai_usage").update(patch).eq("id", row.id); };

  const { data: tpls } = await sb.from("studio_templates").select("id,name,config").eq("product_type", type).eq("active", true).order("sort");
  const templates = tpls || [];

  let r: Response, j: any;
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 90_000);
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: ctl.signal,
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model, max_tokens: 2500,
        messages: [{ role: "user", content: [
          ...files.map((f: any) => ({ type: "image", source: { type: "base64", media_type: f.media_type, data: f.data } })),
          { type: "text", text: prompt(type, mode, templates, occasion) },
        ] }],
      }),
    });
    j = await r.json();
  } catch (e) {
    clearTimeout(timer); await refund(); await finish({ status: "error", error: ("fetch: " + String(e)).slice(0, 300) });
    return json({ code: "ai_timeout" }, 504);
  }
  clearTimeout(timer);
  if (!r.ok) {
    const m = String(j?.error?.message || r.status);
    await refund(); await finish({ status: "error", error: m.slice(0, 300) });
    const code = r.status === 401 || r.status === 403 ? "ai_key" : /credit|billing/i.test(m) ? "ai_credit" : r.status === 429 || r.status === 529 ? "ai_busy" : "ai_error";
    return json({ code }, 502);
  }
  const usage = { input_tokens: j?.usage?.input_tokens ?? null, output_tokens: j?.usage?.output_tokens ?? null };
  const text: string = (j.content || []).map((c: any) => c.text || "").join("");
  const m = text.match(/\{[\s\S]*\}/);
  let o: any = null;
  if (m) { try { o = JSON.parse(m[0]); } catch { o = null; } }
  if (!o || typeof o !== "object") { await refund(); await finish({ status: "error", error: "no json", ...usage }); return json({ code: "ai_bad_output" }, 502); }

  // Sanitise: only known keys, bounded lengths, validated colours / fonts / template id / design options.
  const fields: Record<string, string> = {};
  const src = o.fields && typeof o.fields === "object" ? o.fields : {};
  for (const [k, n] of Object.entries(FIELDS[type])) { const v = str(src[k], n); if (v) fields[k] = v; }
  for (const k of ["c1_phone", "c2_phone", "mobile", "whatsapp"]) if (fields[k]) fields[k] = fields[k].replace(/\D/g, "").slice(-10);
  if (fields.date && !/^\d{4}-\d{2}-\d{2}$/.test(fields.date)) delete fields.date;
  if (fields.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(fields.time)) delete fields.time;
  const content: Record<string, unknown> = { fields };
  if (type === "invitation") {
    content.events = (Array.isArray(o.events) ? o.events : []).slice(0, 8).map((e: any) => ({
      title: str(e?.title, 60), date: /^\d{4}-\d{2}-\d{2}$/.test(e?.date || "") ? e.date : "", time: /^([01]\d|2[0-3]):[0-5]\d$/.test(e?.time || "") ? e.time : "", place: str(e?.place, 120),
    })).filter((e: any) => e.title || e.date || e.place);
  } else {
    content.services = (Array.isArray(o.services) ? o.services : []).slice(0, 12).map((s: unknown) => str(s, 60)).filter(Boolean);
  }
  const d = mode === "creative" && o.design && typeof o.design === "object" ? o.design : {};
  const style: Record<string, string> = {};
  const bg = hex(d.bg), fg = hex(d.fg), ac = hex(d.ac);
  if (bg && fg && contrast(bg, fg) >= 4.5) { style.bg = bg; style.fg = fg; if (ac && contrast(bg, ac) >= 2.5) style.ac = ac; }
  if (FONTS.includes(d.font)) style.font = d.font;
  if (FONTS.includes(d.nameFont)) style.nameFont = d.nameFont;
  if (LAYOUTS[type].includes(d.layout)) style.layout = d.layout;
  if (type === "invitation" && ORNAMENTS.includes(d.ornament)) style.ornament = d.ornament;
  if (ANIMS.includes(d.anim)) style.anim = d.anim;
  if (PETALS.includes(d.petal)) style.petal = d.petal;
  if (ALIGNS.includes(d.align)) style.align = d.align;
  content.style = style;
  const template_id = templates.some((t) => t.id === d.template_id) ? d.template_id : null;

  await finish({ status: "ok", ...usage });
  return json({ content, template_id, mode, used: used + 1, limit, free });
});
