// emailService.js
import nodemailer from 'nodemailer';

// 1. Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or any other SMTP service
  auth: {
    user: process.env.EMAIL_USER, // Your email from .env file
    pass: process.env.EMAIL_PASS, // Your password from .env file
  },
});

// 2. Function to send verification email with an OTP
export async function sendVerificationEmail(userEmail, token) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'StockMaster - Your Verification Code',
    html: `
      <h1>Welcome to StockMaster!</h1>
      <p>Your verification code is:</p>
      <h2 style="font-size: 24px; letter-spacing: 2px;">${token}</h2>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Could not send verification email.');
  }
}

// 3. Function to generate a 6-digit OTP
export function generateVerificationToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
