// Server-side verification of a Paystack transaction reference. The public
// key on the frontend can be exposed to the browser, but a payment must
// never be trusted just because the client says it succeeded — a customer
// (or a bug) could call completeOrder() with a fake reference. This calls
// Paystack's own Verify Transaction API using the secret key, which lives
// only in .env and never reaches the browser.
export async function verifyPaystackTransaction(reference, expectedAmountKobo) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        return { verified: false, reason: 'PAYSTACK_SECRET_KEY not configured on the server' };
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
    });

    if (!res.ok) {
        return { verified: false, reason: `Paystack API returned ${res.status}` };
    }

    const body = await res.json();
    const data = body?.data;

    if (!data || data.status !== 'success') {
        return { verified: false, reason: 'Transaction not successful according to Paystack' };
    }

    if (typeof expectedAmountKobo === 'number' && data.amount !== expectedAmountKobo) {
        return { verified: false, reason: `Amount mismatch: expected ${expectedAmountKobo}, Paystack recorded ${data.amount}` };
    }

    return { verified: true, data };
}
