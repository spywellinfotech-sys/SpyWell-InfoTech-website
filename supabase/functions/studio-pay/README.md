# studio-pay (Supabase Edge Function)
Razorpay purchase of AI-read credits. Actions: info, create, verify, sync (recovers paid-but-not-credited orders). Optional webhook.
Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (same as card-pay), optional RAZORPAY_WEBHOOK_SECRET.
Price and pack size live in studio_settings (ai_price_inr, ai_pack_credits).
