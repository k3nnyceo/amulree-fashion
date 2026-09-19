import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { adminAuth } from '../middleware/adminAuth.js';

export const subscribersRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/subscribers — the homepage newsletter form.
subscribersRouter.post('/', async (req, res) => {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
        return res.status(400).json({ success: false, error: 'A valid email is required' });
    }

    const normalized = email.trim().toLowerCase();
    const alreadySubscribed = db.data.subscribers.some(s => s.email.toLowerCase() === normalized);

    if (!alreadySubscribed) {
        db.data.subscribers.unshift({ id: crypto.randomUUID(), email: email.trim(), createdAt: new Date().toISOString() });
        await db.write();
    }

    res.status(201).json({ success: true });
});

// GET /api/subscribers — admin dashboard only
subscribersRouter.get('/', adminAuth, async (req, res) => {
    res.json(db.data.subscribers);
});
