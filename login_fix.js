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
