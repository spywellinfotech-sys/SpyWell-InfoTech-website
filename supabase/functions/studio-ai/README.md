# studio-ai (Supabase Edge Function)
Source: `index.ts` (deployed to project rxhanrtoaplwphmwpgqg, verify_jwt=false; it verifies the customer's token itself).
Secrets: ANTHROPIC_API_KEY (required), STUDIO_CLAUDE_MODEL (default claude-sonnet-5-5), STUDIO_AI_DAILY_LIMIT (default 10/day).
Payment gate: takes 1 credit (studio_credit_take) before calling Claude, refunds on any failure; admins are free.
Request: {product_type, mode: content|creative, files:[{media_type,data}] (1-4)}. Errors: {code} (no_credit=402, limit=429).
