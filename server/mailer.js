import nodemailer from 'nodemailer';

let transporter = null;

function isConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
    if (!isConfigured()) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    }
    return transporter;
}

// Best-effort notification email. Silently skips (with a console note) when
// SMTP isn't configured — the admin dashboard remains the source of truth
// either way, so a missing/failed email is never fatal to the request.
export async function notifyBusiness(subject, text) {
    const t = getTransporter();
    if (!t) {
        console.log(`[mailer] SMTP not configured, skipping email: "${subject}"`);
        return;
    }
    const to = process.env.NOTIFY_EMAIL_TO;
    const from = process.env.NOTIFY_EMAIL_FROM || process.env.SMTP_USER;
    if (!to) {
        console.log('[mailer] NOTIFY_EMAIL_TO not set, skipping email');
        return;
    }
    try {
        await t.sendMail({ from, to, subject, text });
    } catch (err) {
        console.error('[mailer] Failed to send notification email:', err.message);
    }
}
