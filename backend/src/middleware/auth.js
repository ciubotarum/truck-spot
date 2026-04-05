const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim()) return secret;
  // Dev fallback; for production this MUST be set.
  return 'dev_only_insecure_secret_change_me';
};

const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
    }

    const payload = jwt.verify(token, getJwtSecret());
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};

module.exports = {
  requireAuth,
  getJwtSecret
};
