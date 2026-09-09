import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { queryOne, executeWithId, execute } from '../config/dbHelper.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

if (!GOOGLE_CLIENT_ID) {
  console.warn('⚠️  GOOGLE_CLIENT_ID not configured in environment variables. Google Sign-In will not work.');
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/verify', async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      console.error('❌ GOOGLE_CLIENT_ID not configured');
      return res.status(500).json({ success: false, error: 'Google OAuth not configured on server' });
    }

    const { credential } = req.body;

    if (!credential) {
      console.error('❌ No credential received in request body');
      return res.status(400).json({ success: false, error: 'Google credential required' });
    }

    console.log('🔐 Verifying Google token...');
    console.log('Token (first 50 chars):', credential.substring(0, 50) + '...');
    console.log('Using Client ID:', GOOGLE_CLIENT_ID);
    
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      console.log('✅ Token verified successfully');
    } catch (verifyError) {
      console.error('❌ Token verification failed!');
      console.error('Error name:', verifyError.name);
      console.error('Error message:', verifyError.message);
      console.error('Error code:', verifyError.code);
      throw verifyError;
    }
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified } = payload;

    console.log(`👤 Google user: ${email} (verified: ${email_verified})`);

    if (!email_verified) {
      console.error(`❌ Email not verified: ${email}`);
      return res.status(400).json({ success: false, error: 'Email not verified with Google' });
    }

    console.log('🔍 Looking up customer in database...');
    let customer = await queryOne('SELECT * FROM Customers WHERE email = ?', [email]);

    if (!customer) {
      console.log(`📝 Creating new customer: ${email}`);
      const customerId = await executeWithId(
        'INSERT INTO Customers (name, email, phone, google_id, avatar) VALUES (?, ?, ?, ?, ?)',
        [name, email, '', googleId, picture]
      );
      console.log(`✅ Customer created with ID: ${customerId}`);
      customer = { id: customerId, name, email, google_id: googleId, avatar: picture };
    } else {
      console.log(`✅ Customer found: ID ${customer.id}`);
      if (!customer.google_id) {
        console.log(`📝 Updating customer with google_id`);
        await execute(
          'UPDATE Customers SET google_id = ?, avatar = ? WHERE id = ?',
          [googleId, picture, customer.id]
        );
        customer = { ...customer, google_id: googleId, avatar: picture };
      }
    }

    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { id: customer.id, email: customer.email, name: customer.name, type: 'customer' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log(`✅ Authentication successful for ${email}`);
    res.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        avatar: customer.avatar,
      },
    });
  } catch (error) {
    console.error('❌ Google auth error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Full error object:', JSON.stringify({
      name: error.name,
      message: error.message,
      code: error.code,
    }, null, 2));
    
    // Provide more specific error messages
    if (error.message && error.message.includes('Invalid value for: id_token')) {
      console.error('💡 Issue: Token validation failed');
      return res.status(401).json({ success: false, error: 'Invalid Google token. Please try again.' });
    }
    if (error.message && error.message.includes('audience')) {
      console.error('💡 Issue: Audience mismatch - Client ID issue');
      return res.status(401).json({ success: false, error: 'Google Client ID mismatch. Please refresh the page and try again.' });
    }
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      console.error('💡 Issue: Duplicate google_id detected');
      return res.status(400).json({ success: false, error: 'This Google account is already linked to another profile.' });
    }
    if (error.message && (error.message.includes('SQLITE_ERROR') || error.message.includes('database'))) {
      console.error('💡 Issue: Database error');
      return res.status(500).json({ success: false, error: 'Database error. Please try again later.' });
    }
    
    console.error('💡 Issue: Unknown error');
    res.status(401).json({ success: false, error: 'Failed to authenticate with Google. Please try again.' });
  }
});

export default router;