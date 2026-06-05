import { Low } from 'lowdb';
import { JSONFile } from 'lowdb';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'db.json');

const defaultData = {
  campaigns: [],
  targets: [],
  events: [],
  ethereal: null,
};

let dbInstance = null;

export async function getDb() {
  if (!dbInstance) {
    const adapter = new JSONFile(dbPath);
    dbInstance = new Low(adapter, defaultData);
    await dbInstance.read();
    dbInstance.data ||= defaultData;
    await dbInstance.write();
  }
  return dbInstance;
}

export async function resetDb() {
  const db = await getDb();
  db.data.campaigns = [];
  db.data.targets = [];
  db.data.events = [];
  await db.write();
  return db;
}
