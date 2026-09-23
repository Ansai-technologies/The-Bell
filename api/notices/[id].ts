// GET /api/notices/:id — single notice lookup. Serverless port of server.ts.
import { getDb } from '../_db';
import { notices } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const db = getDb();
    const raw = req.query.id;
    const id = parseInt(Array.isArray(raw) ? raw[0] : raw);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const results = await db.select().from(notices).where(eq(notices.id, id)).limit(1);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    res.status(200).json(results[0]);
  } catch (error: any) {
    console.error('Error fetching notice details:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
