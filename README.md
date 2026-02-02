# Time Boxed Authentication Backend

Node.js backend API for sending OTP emails via Gmail and verifying OTP codes.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Enable **2-Step Verification** if not already enabled
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Select **Mail** and **Other (Custom name)**
5. Enter "Time Boxed Backend" as the name
6. Click **Generate**
7. Copy the 16-digit app password (no spaces)

### 3. Create .env File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Gmail credentials:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password
PORT=3000

# Twilio Configuration (for phone OTP - optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# MongoDB (required for NFC and JWT user persistence)
MONGO_URI=mongodb://localhost:27017/timeboxed

# JWT secret (required when using MongoDB; use a long random string in production)
JWT_SECRET=your-long-random-secret-here

# Admin secret for adding NFC tags to DB (optional; required for POST /api/nfc/admin/add)
ADMIN_SECRET=your-admin-secret-here
```

**Important:** 
- Use your Gmail address (the one you'll send emails from)
- Use the **App Password** (16 digits, no spaces), NOT your regular Gmail password
- Twilio credentials are optional - phone OTP will work only if configured
- See `TWILIO_SETUP.md` for Twilio setup instructions
- Never commit the `.env` file to git

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

### 5. Test the API

**Send OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

**NFC (tags are pre-saved in DB; user does not register):**

Add a tag to DB (admin; set ADMIN_SECRET in .env):
```bash
curl -X POST http://localhost:3000/api/nfc/admin/add \
  -H "Content-Type: application/json" \
  -H "Admin-Secret: YOUR_ADMIN_SECRET" \
  -d '{"tagId":"nfc-tag-identifier-123"}'
```

Verify scanned tag (user logged in with JWT):
```bash
curl -X POST http://localhost:3000/api/nfc/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"tagId":"nfc-tag-identifier-123"}'
```
Response: `{ "success": true, "valid": true }` or `{ "success": true, "valid": false }`. See `NFC_SETUP.md` for full flow.

## API Endpoints

### POST `/api/auth/send-otp`

Sends a 6-digit OTP to the specified email address.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

### POST `/api/auth/verify-otp`

Verifies the OTP code.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "base64-encoded-token"
}
```

## Features

- ✅ Sends OTP via Gmail
- ✅ 6-digit OTP generation
- ✅ 5-minute expiration
- ✅ Rate limiting (3 requests per email per hour)
- ✅ Automatic cleanup of expired OTPs
- ✅ Beautiful HTML email template
- ✅ CORS enabled for iOS app
- ✅ Error handling

## Deployment

### Option 1: Heroku

1. Install Heroku CLI
2. Create Heroku app:
   ```bash
   heroku create your-app-name
   ```
3. Set environment variables:
   ```bash
   heroku config:set GMAIL_USER=your-email@gmail.com
   heroku config:set GMAIL_APP_PASSWORD=your-app-password
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```

### Option 2: Railway

1. Connect your GitHub repo to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically

### Option 3: Render

1. Create new Web Service on Render
2. Connect your GitHub repo
3. Add environment variables
4. Deploy

### Option 4: Your Own Server

1. Install Node.js on your server
2. Clone the repository
3. Run `npm install`
4. Set up `.env` file
5. Use PM2 to run:
   ```bash
   npm install -g pm2
   pm2 start server.js --name timeboxed-auth
   ```

## Update iOS App

After deploying, update the API URL in your iOS app:

**File:** `TimeBoxed/Utils/APIService.swift`

```swift
static let baseURL = "https://your-deployed-url.com/api"
```

For local testing:
```swift
static let baseURL = "http://localhost:3000/api"
```

**Note:** For iOS Simulator, use `http://localhost:3000`
**Note:** For physical device, use your computer's IP address: `http://192.168.x.x:3000`

## Troubleshooting

### Email not sending?

1. Check `.env` file has correct credentials
2. Verify App Password is correct (16 digits, no spaces)
3. Make sure 2-Step Verification is enabled
4. Check server logs for error messages

### CORS errors?

The server has CORS enabled. If you still get errors, make sure:
- The API URL in iOS app matches your backend URL
- You're using HTTPS in production

### OTP not working?

1. Check server logs
2. Verify email was sent (check spam folder)
3. Make sure OTP hasn't expired (5 minutes)
4. Check rate limiting (max 3 per hour)

## Security Notes

- ⚠️ Never commit `.env` file
- ⚠️ Use environment variables in production
- ⚠️ Consider using Redis for OTP storage in production
- ⚠️ Add request validation and rate limiting
- ⚠️ Use HTTPS in production
- ⚠️ Consider implementing JWT tokens for authenticated sessions
