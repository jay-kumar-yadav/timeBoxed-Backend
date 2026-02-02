# Twilio Setup Guide for Phone OTP

## Step 1: Create Twilio Account

1. Go to: https://www.twilio.com/try-twilio
2. Sign up for a free account (includes $15.50 credit)
3. Verify your email and phone number

## Step 2: Get Your Twilio Credentials

1. Log in to Twilio Console: https://console.twilio.com/
2. Go to **Account** → **API Keys & Tokens**
3. Copy:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click "View" to reveal)

## Step 3: Get a Twilio Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country (e.g., United States)
3. Choose a number with SMS capability
4. Click **Buy** (free trial accounts get one free number)
5. Copy the phone number (format: +1234567890)

## Step 4: Add to .env File

Add these to your `backend/.env` file:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Important:**
- Replace `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your Account SID
- Replace `your_auth_token_here` with your Auth Token
- Replace `+1234567890` with your Twilio phone number (include + and country code)

## Step 5: Install Twilio Package

```bash
cd backend
npm install
```

The `twilio` package is already in `package.json`, so running `npm install` will install it.

## Step 6: Test

Restart your backend server:

```bash
npm start
```

You should see:
```
Twilio SMS is configured
```

## Testing Phone OTP

Send a test request:

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890"}'
```

Replace `+1234567890` with your actual phone number (include country code).

## Free Trial Limitations

- **Trial accounts** can only send SMS to verified phone numbers
- To verify a phone number:
  1. Go to Twilio Console → **Phone Numbers** → **Verified Caller IDs**
  2. Add your phone number
  3. Verify via SMS or call

## Production Setup

For production:
1. Upgrade your Twilio account (remove trial restrictions)
2. Add payment method
3. Phone numbers cost ~$1/month
4. SMS costs ~$0.0075 per message (varies by country)

## Troubleshooting

**"Twilio credentials not configured"**
→ Check `.env` file has all three Twilio variables

**"SMS not sending"**
→ Verify phone number is verified (for trial accounts)
→ Check Twilio Console for error messages
→ Verify phone number format includes country code (+1 for US)

**"Invalid phone number"**
→ Use E.164 format: +[country code][number]
→ Example: +15551234567 (US), +447911123456 (UK)

## Cost Estimate

- **Free Trial**: $15.50 credit (good for ~2,000 SMS)
- **Production**: ~$0.0075 per SMS + $1/month for phone number
- **1000 SMS/month**: ~$8.50/month
