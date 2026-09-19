import crypto from 'crypto';

function safeEqual(a, b) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

// HTTP Basic Auth gate for the admin dashboard and its API endpoints.
// Credentials come from ADMIN_USER / ADMIN_PASSWORD in .env.
export function adminAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');

    if (scheme === 'Basic' && encoded) {
        const decoded = Buffer.from(encoded, 'base64').toString('utf8');
        const sepIndex = decoded.indexOf(':');
        const user = decoded.slice(0, sepIndex);
        const pass = decoded.slice(sepIndex + 1);

        const expectedUser = process.env.ADMIN_USER || '';
        const expectedPass = process.env.ADMIN_PASSWORD || '';

        if (expectedUser && expectedPass && safeEqual(user, expectedUser) && safeEqual(pass, expectedPass)) {
            return next();
        }
    }

    res.set('WWW-Authenticate', 'Basic realm="AmulRee Admin"');
    res.status(401).send('Authentication required.');
}
