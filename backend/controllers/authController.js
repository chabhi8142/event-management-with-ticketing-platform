const https = require('https');
const { getAuth } = require('../config/firebase');
const { createUserProfile, getUserProfile } = require('../models/userModel');

const auth = getAuth();

function getActionCodeSettings() {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  return {
    url: `${clientUrl}/auth/confirm`,
    handleCodeInApp: true,
  };
}

function signInWithPassword(email, password) {
  const apiKey = process.env.FIREBASE_AUTH_API_KEY;
  if (!apiKey) {
    throw new Error('Missing FIREBASE_AUTH_API_KEY in environment');
  }

  const payload = JSON.stringify({
    email,
    password,
    returnSecureToken: true,
  });

  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const request = https.request(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      requestOptions,
      (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          const data = JSON.parse(body);
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(data.error?.message || 'Unable to sign in')); 
          }
        });
      }
    );

    request.on('error', (error) => reject(error));
    request.write(payload);
    request.end();
  });
}

async function createUserAccount(req, res) {
  try {
    const { name, email, password, role = 'attendee' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    const isApproved = role === 'attendee'; // Attendees are auto-approved, organisers need admin approval

    if (isApproved) {
      await auth.setCustomUserClaims(userRecord.uid, { role });
    }

    await createUserProfile(userRecord.uid, {
      name,
      email,
      role,
      status: 'active',
      isApproved,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    });

    const verificationLink = await auth.generateEmailVerificationLink(email, getActionCodeSettings());

    const message = role === 'organiser'
      ? 'Your organiser account has been created and is pending admin approval.'
      : 'Account created. Please check your email for verification instructions.';

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      role,
      isApproved,
      verificationLink,
      message,
    });
  } catch (error) {
    console.error('Account creation error:', error);
    res.status(400).json({ error: error.message });
  }
}


async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const loginResponse = await signInWithPassword(email, password);
    const decodedToken = await auth.verifyIdToken(loginResponse.idToken);
    const profile = await getUserProfile(decodedToken.uid);

    // Use Firestore profile role as source of truth
    const userRole = profile?.role || decodedToken.role || 'attendee';

    res.json({
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userRole,
      emailVerified: decodedToken.email_verified,
      idToken: loginResponse.idToken,
      refreshToken: loginResponse.refreshToken,
      profile,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Unable to log in' });
  }
}

async function verifyIdToken(req, res) {
  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    if (!idToken) {
      return res.status(401).json({ error: 'Authorization header is required.' });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get user profile from Firestore as source of truth for role
    const userProfile = await getUserProfile(decodedToken.uid);
    
    res.json({ 
      uid: decodedToken.uid, 
      email: decodedToken.email, 
      role: userProfile?.role || decodedToken.role || 'attendee' 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

async function sendVerificationEmail(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const verificationLink = await auth.generateEmailVerificationLink(email, getActionCodeSettings());
    res.json({ email, verificationLink });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({ error: 'Unable to create verification link.' });
  }
}

async function sendPasswordResetLink(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const resetLink = await auth.generatePasswordResetLink(email, getActionCodeSettings());
    res.json({ email, resetLink });
  } catch (error) {
    console.error('Password reset link error:', error);
    res.status(500).json({ error: 'Unable to create password reset link.' });
  }
}

module.exports = {
  createUserAccount,
  loginUser,
  verifyIdToken,
  sendVerificationEmail,
  sendPasswordResetLink,
};
