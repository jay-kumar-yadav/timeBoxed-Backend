const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();

const User = require('./src/models/User');
const { signToken } = require('./src/middleware/auth');
const nfcRoutes = require('./src/routes/nfc');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log(' MONGO_URI not set - NFC and JWT user persistence disabled');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Store OTPs temporarily (use Redis in production)
// Key format: "email:user@example.com" or "phone:+1234567890"
const otpStore = new Map();

// Email transporter setup with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Twilio client setup
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log(' Twilio SMS is configured');
} else {
  console.log(' Twilio credentials not configured (phone OTP will not work)');
}

// Verify email configuration on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email configuration error:', error);
    console.log('\n Please check your Gmail credentials in .env file');
  } else {
    console.log(' Email server is ready to send messages');
  }
});

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Helper function to normalize phone number
function normalizePhoneNumber(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // Add + if not present and ensure country code
  if (!cleaned.startsWith('+')) {
    // If starts with 1 and length is 11, assume US number
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return '+' + cleaned;
    }
    // Otherwise, assume US number and add +1
    if (cleaned.length === 10) {
      return '+1' + cleaned;
    }
    return '+' + cleaned;
  }
  return cleaned;
}

// NFC routes (JWT required)
app.use('/api/nfc', nfcRoutes);

// Root – so opening the Render link shows a message instead of "Cannot GET /"
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Time Boxed API',
    health: '/health',
    api: '/api/auth/send-otp, /api/auth/verify-otp, /api/nfc/verify'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Time Boxed Auth API is running' });
});

// Send OTP endpoint (supports both email and phone)
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, phone } = req.body;
    const isEmail = !!email;
    const isPhone = !!phone;
    const identifier = isEmail ? email : (isPhone ? normalizePhoneNumber(phone) : null);
    const type = isEmail ? 'email' : 'phone';

    // Validate input
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }

    if (isEmail && !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required'
      });
    }

    if (isPhone && identifier.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number is required'
      });
    }

    // Rate limiting: max 3 requests per identifier per hour
    const storeKey = `${type}:${identifier}`;
    const existingData = otpStore.get(storeKey);
    if (existingData && existingData.requestCount >= 3) {
      const timeSinceFirstRequest = Date.now() - existingData.firstRequestTime;
      if (timeSinceFirstRequest < 60 * 60 * 1000) { // 1 hour
        const remainingMinutes = Math.ceil((60 * 60 * 1000 - timeSinceFirstRequest) / (60 * 1000));
        return res.status(429).json({
          success: false,
          message: `Too many requests. Please try again in ${remainingMinutes} minutes.`
        });
      } else {
        // Reset counter after 1 hour
        otpStore.delete(storeKey);
      }
    }

    const otp = generateOTP();

    // Store OTP with expiration (5 minutes)
    const requestData = otpStore.get(storeKey) || { requestCount: 0, firstRequestTime: Date.now() };
    otpStore.set(storeKey, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      requestCount: requestData.requestCount + 1,
      firstRequestTime: requestData.firstRequestTime || Date.now(),
      type: type,
      identifier: identifier
    });

    // Send OTP via email or SMS
    if (isEmail) {
      // Send email
      const mailOptions = {
        from: {
          name: 'Time Boxed',
          address: process.env.GMAIL_USER
        },
        to: email,
        subject: 'Your Time Boxed Login Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Time Boxed</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Your Login Code</h2>
              <p style="color: #666; font-size: 16px;">Your verification code is:</p>
              <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${otp}</span>
              </div>
              <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
            </div>
          </div>
        `,
        text: `Your Time Boxed login code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`
      };

      await transporter.sendMail(mailOptions);
      console.log(`OTP sent to email: ${email}`);
    } else if (isPhone && twilioClient) {
      // Send SMS via Twilio
      const message = await twilioClient.messages.create({
        body: `Your Time Boxed login code is: ${otp}. This code will expire in 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: identifier
      });
      console.log(`OTP sent to phone: ${identifier} (SID: ${message.sid})`);
    } else if (isPhone && !twilioClient) {
      return res.status(500).json({
        success: false,
        message: 'SMS service not configured. Please contact support.'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again later.'
    });
  }
});

// Verify OTP endpoint (supports both email and phone) - creates/finds User and returns JWT
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    // Validate input
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    const isEmail = !!email;
    const isPhone = !!phone;
    const identifier = isEmail ? email : (isPhone ? normalizePhoneNumber(phone) : null);
    const type = isEmail ? 'email' : 'phone';

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }

    const storeKey = `${type}:${identifier}`;
    const stored = otpStore.get(storeKey);

    if (!stored) {
      return res.json({
        success: false,
        message: 'OTP not found or expired. Please request a new code.'
      });
    }

    // Check if OTP expired
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(storeKey);
      return res.json({
        success: false,
        message: 'OTP has expired. Please request a new code.'
      });
    }

    // Verify OTP
    if (stored.otp !== otp) {
      return res.json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // OTP verified successfully
    otpStore.delete(storeKey);
    console.log(`OTP verified for ${type}: ${identifier}`);

    // Find or create user in MongoDB and return JWT (fallback to simple token if DB not connected)
    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({ identifier });
      if (!user) {
        user = await User.create({ identifier, type });
        console.log(`New user created: ${user._id}`);
      }
      const token = signToken(user._id);
      return res.json({
        success: true,
        message: 'OTP verified successfully',
        token
      });
    }
    const token = Buffer.from(`${identifier}:${Date.now()}`).toString('base64');
    res.json({
      success: true,
      message: 'OTP verified successfully',
      token
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n Time Boxed Auth API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Send OTP: POST http://localhost:${PORT}/api/auth/send-otp`);
  console.log(`Verify OTP: POST http://localhost:${PORT}/api/auth/verify-otp`);
  console.log(`NFC Verify: POST http://localhost:${PORT}/api/nfc/verify (Bearer JWT)\n`);
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('  WARNING: Gmail credentials not configured!');
    console.log('   Please create a .env file with GMAIL_USER and GMAIL_APP_PASSWORD\n');
  }
  
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('  WARNING: Twilio credentials not configured!');
    console.log('   Phone OTP will not work. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env\n');
  }
});
