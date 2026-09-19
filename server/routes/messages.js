import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { notifyBusiness } from '../mailer.js';
import { adminAuth } from '../middleware/adminAuth.js';

export const messagesRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/messages — the contact page's "Send Message" form. Previously
// this only ever wrote to the visitor's own localStorage, so the business
// never actually received it; now it's durably stored + emailed if SMTP is
// configured.
messagesRouter.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
        return res.status(400).json({ success: false, error: 'A valid email is required' });
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
        return res.status(400).json({ success: false, error: 'Subject is required' });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
        return res.status(400).json({ success: false, error: 'Message must be at least 10 characters' });
    }

    const entry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
    };

    db.data.messages.unshift(entry);
    await db.write();

    notifyBusiness(`New contact message: ${entry.subject}`, `From: ${entry.name} <${entry.email}>\n\n${entry.message}`).catch(() => {});

    res.status(201).json({ success: true });
});

// GET /api/messages — admin dashboard only
messagesRouter.get('/', adminAuth, async (req, res) => {
    res.json(db.data.messages);
});
