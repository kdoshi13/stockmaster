// authRoutes.js (example using Express)
import express from 'express';
import { db } from './database.js'; // Your database connection
import { sendVerificationEmail, generateVerificationToken } from './emailService.js';
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, name, role, phone } = req.body; // Added name, role, and optional phone

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = generateVerificationToken();

  // Save user to database
  const sql = `INSERT INTO users (email, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [email, name, phone, hashedPassword, role], function (err) {
    if (err) {
      // Handle error (e.g., email already exists)
      return res.status(400).json({ message: 'Registration failed.' });
    }

    // Send verification email
    sendVerificationEmail(email, verificationToken);
    // Note: We are not saving the token on initial registration in this new flow.
    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  });
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Verification token is missing.');
  }

  const findUserSql = `SELECT * FROM users WHERE verification_token = ?`;
  db.get(findUserSql, [token], (err, user) => {
    if (err || !user) {
      return res.status(400).send('Invalid or expired verification token.');
    }

    // User found, update their status
    const updateUserSql = `UPDATE users SET verified = 1, verification_token = NULL WHERE id = ?`;
    db.run(updateUserSql, [user.id], (updateErr) => {
      if (updateErr) {
        return res.status(500).send('Error verifying email.');
      }
      
      // Redirect to a "verified" page on your frontend
      res.redirect('http://localhost:5173/email-verified'); 
    });
  });
});

// New route to verify OTP and log in
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  const findUserSql = `SELECT * FROM users WHERE email = ?`;
  db.get(findUserSql, [email], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if token is valid and not expired
    const isTokenExpired = new Date() > new Date(user.verification_token_expires);
    if (!user.verification_token || isTokenExpired) {
      return res.status(400).json({ message: 'OTP is invalid or has expired. Please try logging in again.' });
    }

    // Compare the provided OTP with the stored one
    if (otp !== user.verification_token) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // OTP is correct, verify the user and clear the token
    const updateUserSql = `UPDATE users SET verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?`;
    db.run(updateUserSql, [user.id], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ message: 'Error verifying account.' });
      }
      // Here you would typically create a JWT and send it back
      res.json({ message: 'Login successful! Your account is now verified.' });
    });
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const sql = `SELECT * FROM users WHERE email = ?`;
  db.get(sql, [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // If user is already verified, log them in directly
    if (user.verified) {
      // Return user data and token for frontend
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      };
      
      // Generate a simple token (in production, use proper JWT)
      const token = `token-${user.id}-${Date.now()}`;
      
      return res.json({ 
        message: 'Login successful.',
        user: userData,
        token: token
      });
    }

    // --- NEW FLOW FOR UNVERIFIED USERS ---
    // Generate a new OTP, set an expiry (e.g., 10 minutes), and save it
    const otp = generateVerificationToken();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const updateUserSql = `UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?`;
    db.run(updateUserSql, [otp, expires.toISOString(), user.id], async (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ message: 'Failed to prepare verification.' });
      }
      // Send the new OTP to the user's email
      await sendVerificationEmail(user.email, otp);
      // Inform the client that OTP verification is required
      return res.status(200).json({ verificationRequired: true, email: user.email });
    });
  });
});

export default router;
