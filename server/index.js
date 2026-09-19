import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import { ordersRouter } from './routes/orders.js';
import { messagesRouter } from './routes/messages.js';
import { subscribersRouter } from './routes/subscribers.js';
import { adminAuth } from './middleware/adminAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.join(__dirname, '..');

await initDb();

const app = express();
app.use(express.json());

app.use('/api/orders', ordersRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/subscribers', subscribersRouter);

// The admin dashboard itself is just a static file, but it must never be
// served without credentials — put the auth check in front of it explicitly
// rather than relying on it being "unlinked".
app.get('/admin.html', adminAuth, (req, res) => {
    res.sendFile(path.join(siteRoot, 'admin.html'));
});

app.use(express.static(siteRoot));

app.use((req, res) => {
    res.status(404).sendFile(path.join(siteRoot, '404.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`AmulRee Fashion server running at http://localhost:${port}`);
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.log('  ⚠ PAYSTACK_SECRET_KEY not set — orders will be recorded as "unverified".');
    }
    if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'change-me') {
        console.log('  ⚠ Set a real ADMIN_PASSWORD in .env before deploying this anywhere public.');
    }
});
