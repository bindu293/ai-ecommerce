// Authentication Middleware
// Verifies Firebase ID tokens and protects routes that require authentication

const { auth } = require('../../config/firebase');

/**
 * Middleware to verify JWT token and authenticate user
 * Attaches user information to req.user for use in controllers
 */
const authenticateUser = async (req, res, next) => {
  try {
    if (!auth) {
      return res.status(401).json({
        success: false,
        message: 'Authentication not configured. Set Firebase Admin env variables.'
      });
    }
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Authorization required.' 
      });
    }

    // Extract token
    const idToken = authHeader.split(' ')[1];

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Optionally fetch user record for email info
    let userRecord = null;
    try {
      userRecord = await auth.getUser(decodedToken.uid);
    } catch (_) {}

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: userRecord?.email || decodedToken.email,
      emailVerified: userRecord?.emailVerified ?? decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    const msg = error?.errorInfo?.message || error.message || 'Authentication failed';
    return res.status(401).json({ success: false, message: msg });
  }
};

module.exports = { authenticateUser };
