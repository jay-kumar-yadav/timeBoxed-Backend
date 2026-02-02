# OTP Works Locally but Not in Production (Render)

If OTP works on your machine but not when the app calls your Render backend, follow these steps.

## Request timed out

If you see **"The request timed out"** or **"API Error: The request timed out"**:

- **Render free tier** spins down after ~15 min of inactivity. The **first request** after that can take **50–90+ seconds** (cold start) before the server responds.
- The iOS app uses a **3-minute timeout** for API calls. Tap "Send OTP" and **wait**; the first request may take 1–2 minutes. Do not tap again.
- To avoid cold start during testing: open your Render URL in a browser (e.g. `/health`) a minute before testing OTP, so the service is already awake.

## 1. Check that email is configured on Render

Open in browser or curl:

```
https://YOUR-RENDER-URL.onrender.com/api/debug/email-config
```

Example: `https://timeboxed-backend-1.onrender.com/api/debug/email-config`

- If you see **`"emailConfigured": false`** → env vars are missing. Go to **Render Dashboard → Your Service → Environment** and add:
  - **EMAIL_USER** = your Gmail address and **EMAIL_PASSWORD** = Gmail App Password, or **GMAIL_USER** and **GMAIL_APP_PASSWORD**
- After adding or changing env vars, **redeploy** the service (Manual Deploy or push to connected repo).

## 2. Use a Gmail App Password (not your normal password)

1. Google Account → **Security** → **2-Step Verification** (must be ON).
2. **App passwords** → Generate a new one for “Mail”.
3. Copy the 16-character password (no spaces) and set it as **EMAIL_PASSWORD** or **GMAIL_APP_PASSWORD** on Render.

## 3. Check Render logs when OTP is sent

1. Render Dashboard → Your Service → **Logs**.
2. In the app, trigger “Send OTP” (enter email and tap send).
3. In Render logs, look for:
   - **“OTP sent to email: …”** → email was sent; check inbox/spam.
   - **“Error sending OTP: …”** or **“Full error …”** → copy that message.

Common log messages:

| Log message | What to do |
|-------------|------------|
| `Gmail not configured` | Set **EMAIL_USER** and **EMAIL_PASSWORD** (or **GMAIL_USER** and **GMAIL_APP_PASSWORD**) on Render and redeploy. |
| `Invalid login` / `Username and Password not accepted` | Wrong App Password or 2FA off. Create a new App Password. |
| `Connection timeout` / `ECONNREFUSED` | Backend uses 20s SMTP timeouts. If it still times out, host may block SMTP. |

## 4. Quick checklist (Gmail only) (e.g. “Invalid login”)

Gmail sometimes blocks SMTP from cloud IPs (e.g. Render). Then:

- Use an **HTTP-based** email API that works well from servers:
  - **Resend** – https://resend.com (simple API)
  - **SendGrid** – https://sendgrid.com
  - **Mailgun** – https://www.mailgun.com
- Backend would call their API (with an API key) instead of nodemailer + Gmail SMTP. You’d need to add a small send-email helper and keep the same `/api/auth/send-otp` contract.

## 5. Quick checklist

- [ ] **EMAIL_USER** and **EMAIL_PASSWORD** (or **GMAIL_USER** and **GMAIL_APP_PASSWORD**) set in Render → Environment
- [ ] Redeploy after changing env vars
- [ ] **EMAIL_PASSWORD** / **GMAIL_APP_PASSWORD** is a Gmail App Password (Security → App passwords), not your normal password
- [ ] `/api/debug/email-config` returns `"emailConfigured": true`
- [ ] Render logs checked right after tapping “Send OTP” for the exact error
