import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { verifyPaystackTransaction } from '../paystack.js';
import { notifyBusiness } from '../mailer.js';
import { adminAuth } from '../middleware/adminAuth.js';

export const ordersRouter = Router();

function isValidOrderPayload(body) {
    const { customer, items, totals, paymentReference } = body || {};
    if (!customer || typeof customer !== 'object') return 'Missing customer details';
    for (const field of ['fullName', 'phone', 'email', 'address', 'city', 'state']) {
        if (!customer[field] || typeof customer[field] !== 'string' || !customer[field].trim()) {
            return `Missing customer.${field}`;
        }
    }
    if (!Array.isArray(items) || items.length === 0) return 'Order must contain at least one item';
    if (!totals || typeof totals.total !== 'number' || totals.total <= 0) return 'Missing or invalid totals.total';
    if (!paymentReference || typeof paymentReference !== 'string') return 'Missing paymentReference';
    return null;
}

// POST /api/orders — called by checkout.html right after Paystack's client-side
// callback fires (or the demo-mode simulate path). We don't trust that alone:
// a real paymentReference gets re-checked against Paystack's Verify API here,
// server-side, using the secret key. The order is always recorded either way
// (marked unverified if it can't be confirmed) so nothing silently vanishes —
// but "unverified" tells the business not to ship until they've checked it.
ordersRouter.post('/', async (req, res) => {
    const error = isValidOrderPayload(req.body);
    if (error) return res.status(400).json({ success: false, error });

    const { customer, items, totals, paymentReference } = req.body;
    const isDemoReference = paymentReference.startsWith('DEMO-');

    let verified = false;
    let verificationNote = '';

    if (isDemoReference) {
        verificationNote = 'Demo/simulated payment — no live Paystack key was configured in the browser at checkout.';
    } else {
        const expectedAmountKobo = Math.round(totals.total * 100);
        const result = await verifyPaystackTransaction(paymentReference, expectedAmountKobo);
        verified = result.verified;
        verificationNote = result.verified ? 'Verified against Paystack.' : `Not verified: ${result.reason}`;
    }

    const order = {
        id: crypto.randomUUID(),
        reference: paymentReference,
        createdAt: new Date().toISOString(),
        status: verified ? 'paid' : 'unverified',
        verified,
        verificationNote,
        customer,
        items,
        totals,
    };

    db.data.orders.unshift(order);
    await db.write();

    const itemLines = items.map(i => `  - ${i.name}${i.size ? ` (${i.size})` : ''} x${i.quantity} — ₦${(i.price * i.quantity).toLocaleString()}`).join('\n');
    notifyBusiness(
        `New order ${verified ? '(paid)' : '(needs review — unverified)'}: ${paymentReference}`,
        `Customer: ${customer.fullName} <${customer.email}>, ${customer.phone}\n` +
        `Ship to: ${customer.address}, ${customer.city}, ${customer.state}\n\n` +
        `Items:\n${itemLines}\n\n` +
        `Total: ₦${totals.total.toLocaleString()}\n` +
        `Payment: ${verificationNote}`
    ).catch(() => {});

    res.status(201).json({ success: true, orderId: order.id, verified });
});

// GET /api/orders — admin dashboard only
ordersRouter.get('/', adminAuth, async (req, res) => {
    res.json(db.data.orders);
});
