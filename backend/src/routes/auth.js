const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/sqlite');
const { requireAuth, getJwtSecret } = require('../middleware/auth');

const router = express.Router();

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isValidEmail = (email) => {
  // Basic validation; keep minimal.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const makeId = () => {
  // Prefer crypto.randomUUID when available.
  const crypto = require('crypto');
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
};

const signToken = ({ userId, email }) => {
  return jwt.sign(
    { email },
    getJwtSecret(),
    {
      subject: userId,
      expiresIn: '7d'
    }
  );
};

// POST /api/auth/register
// body: { email, password, truckName, cuisine?, description?, phone? }
router.post('/register', (req, res) => {
  try {
    const db = getDb();
    const {
      email,
      password,
      truckName,
      cuisine = null,
      description = null,
      phone = null
    } = req.body || {};

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }
    if (!truckName || !String(truckName).trim()) {
      return res.status(400).json({ success: false, error: 'Truck name is required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const userId = makeId();
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(String(password), 10);

    db.exec('BEGIN');
    try {
      db.prepare(
        'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)'
      ).run(userId, normalizedEmail, passwordHash, now);

      db.prepare(
        `INSERT INTO truck_profiles
           (user_id, truck_name, cuisine, description, phone, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, String(truckName).trim(), cuisine, description, phone, now, now);

      db.exec('COMMIT');
    } catch (txErr) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore rollback errors
      }
      throw txErr;
    }

    const token = signToken({ userId, email: normalizedEmail });
    const profile = db.prepare(
      'SELECT user_id as userId, truck_name as truckName, cuisine, description, phone FROM truck_profiles WHERE user_id = ?'
    ).get(userId);

    return res.json({
      success: true,
      data: {
        token,
        user: { id: userId, email: normalizedEmail },
        profile
      },
      timestamp: now
    });
  } catch (e) {
    console.error('[AUTH][REGISTER]', e);
    return res.status(500).json({ success: false, error: 'Failed to register' });
  }
});

// POST /api/auth/login
// body: { email, password }
router.post('/login', (req, res) => {
  try {
    const db = getDb();
    const { email, password } = req.body || {};

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const ok = bcrypt.compareSync(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = signToken({ userId: user.id, email: user.email });
    const profile = db.prepare(
      'SELECT user_id as userId, truck_name as truckName, cuisine, description, phone FROM truck_profiles WHERE user_id = ?'
    ).get(user.id);

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email },
        profile
      },
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('[AUTH][LOGIN]', e);
    return res.status(500).json({ success: false, error: 'Failed to login' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const profile = db.prepare(
      'SELECT user_id as userId, truck_name as truckName, cuisine, description, phone FROM truck_profiles WHERE user_id = ?'
    ).get(req.user.id);

    return res.json({
      success: true,
      data: {
        user: req.user,
        profile: profile || null
      },
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('[AUTH][ME]', e);
    return res.status(500).json({ success: false, error: 'Failed to load user' });
  }
});

module.exports = router;
