import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'db.json');

const defaultData = { orders: [], messages: [], subscribers: [] };

const adapter = new JSONFile(dbFile);
export const db = new Low(adapter, defaultData);

export async function initDb() {
    const fs = await import('fs');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    await db.read();
    db.data ||= defaultData;
    await db.write();
}
