# Resend Setup (Fix "Connection timeout" on Render)

Render (and many cloud hosts) **block outbound SMTP** (Gmail ports 465/587), so you get **"Connection timeout"** or **"ETIMEDOUT"** when sending email with Gmail. Use **Resend** instead: it sends email over **HTTPS**, which is not blocked.

## 1. Create a Resend account

1. Go to [resend.com](https://resend.com) and sign up (free).
2. Verify your email.

## 2. Get an API key

1. In Resend Dashboard go to **API Keys** (or [resend.com/api-keys](https://resend.com/api-keys)).
2. Click **Create API Key**.
3. Name it (e.g. "Time Boxed Render").
4. Copy the key (starts with `re_`). You won’t see it again.

## 3. Add to Render

1. **Render Dashboard** → your **timeboxed-backend** service → **Environment**.
2. Add:
   - **Key:** `RESEND_API_KEY`
   - **Value:** your Resend API key (e.g. `re_xxxxxxxxxxxx`)
3. **Save** and **Redeploy** the service.

## 4. Sender address (optional)

- By default the app sends from **`Time Boxed <onboarding@resend.dev>`** (Resend’s test sender).
- On the free tier you can send **to your own email** for testing.
- To send to any address or use your own domain:
  - In Resend go to **Domains** → add and verify your domain.
  - In Render add: **Key:** `RESEND_FROM`, **Value:** `Time Boxed <noreply@yourdomain.com>` (use an address on your verified domain).

## 5. Check it works

After redeploying:

1. Open: `https://timeboxed-backend-1.onrender.com/`
2. You should see **`"resendConfigured": true`** in the JSON.
3. In the app, tap **Send OTP** and check your inbox (and spam).

## Summary

| Env var           | Required | Description                                      |
|-------------------|----------|--------------------------------------------------|
| `RESEND_API_KEY`  | Yes      | Resend API key (from Resend Dashboard → API Keys) |
| `RESEND_FROM`     | No       | Sender address (default: `Time Boxed <onboarding@resend.dev>`) |

After setting `RESEND_API_KEY` and redeploying, OTP emails should work on Render without SMTP connection timeouts.
