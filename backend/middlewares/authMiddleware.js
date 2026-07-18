const { getAuth } = require('../config/firebase');
const { getUserProfile } = require('../models/userModel');

const auth = getAuth();

async function authenticateFirebaseToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  const idToken = authorization.startsWith('Bearer ') ? authorization.split('Bearer ')[1] : null;

  if (!idToken) {
    return res.status(401).json({ error: 'Firebase ID token is required.' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get user profile from Firestore as source of truth for role
    const userProfile = await getUserProfile(decodedToken.uid);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userProfile?.role || decodedToken.role || 'attendee',
      emailVerified: decodedToken.email_verified,
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied for this role.' });
    }
    next();
  };
}

async function optionalAuthenticateFirebaseToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  const idToken = authorization.startsWith('Bearer ') ? authorization.split('Bearer ')[1] : null;

  if (!idToken) {
    req.user = null;
    return next();
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get user profile from Firestore as source of truth for role
    const userProfile = await getUserProfile(decodedToken.uid);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userProfile?.role || decodedToken.role || 'attendee',
      emailVerified: decodedToken.email_verified,
    };
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
}

module.exports = {
  authenticateFirebaseToken,
  optionalAuthenticateFirebaseToken,
  requireRole,
};
