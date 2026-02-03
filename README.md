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



**NFC (tags are pre-saved in DB; user does not register):**

Add a tag to DB (admin; set ADMIN_SECRET in .env):
```bash
curl -X POST http://localhost:3000/api/nfc/admin/add \
  -H "Content-Type: application/json" \
 
  -d '{"tagId":"nfc-tag-identifier-123"}'
```

Verify scanned tag (login not required):
```bash
curl -X POST http://localhost:3000/api/nfc/verify \
  -H "Content-Type: application/json" \
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
- ✅ CORS enabled for iOS app
- ✅ Error handling
