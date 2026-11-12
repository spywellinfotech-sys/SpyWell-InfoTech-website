# studio-ai (Supabase Edge Function)

Deployed on project `rxhanrtoaplwphmwpgqg` (version 1, verify_jwt=false; it verifies the customer's access token itself).
The source file `index.ts` is only in the Supabase deployment so far and still has to be exported into this folder.

Secrets (Supabase Edge Function secrets, never in the frontend):
- `ANTHROPIC_API_KEY` (required; without it the function answers `not_configured`)
- `STUDIO_CLAUDE_MODEL` (optional, default `claude-sonnet-5-5`)
- `STUDIO_AI_DAILY_LIMIT` (optional, default 10 per customer per IST day)

Request: POST JSON `{product_type: invitation|visiting, mode: original|creative, files: [{media_type, data(base64)}] (1-4)}`.
Response: `{content:{fields,events|services,style}, template_id, mode, used, limit}` or `{code}` with an error status.
