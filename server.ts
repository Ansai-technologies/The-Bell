import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './src/db/index';
import { notices } from './src/db/schema';
import { desc, ilike, or, eq, and, sql } from 'drizzle-orm';
import { createServer as createViteServer } from 'vite';

const _filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);
const MAX_INT32 = 2_147_483_647;
const MIN_NOTICE_YEAR = 1000;
const MAX_NOTICE_YEAR = 9999;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Get paginated notices with optional search/filtering
  app.get('/api/notices', async (req, res) => {
    try {
      const db = getDb();
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      const rawSearchQuery = req.query.q;
      if (rawSearchQuery !== undefined && typeof rawSearchQuery !== 'string') {
        return res.status(400).json({ error: 'Invalid query parameter: q must be a single string value' });
      }
      const searchQuery = typeof rawSearchQuery === 'string' ? rawSearchQuery : undefined;
      
      let condition = undefined;
      
      if (searchQuery) {
        const trimmed = searchQuery.trim();
        if (trimmed) {
          const numericCandidate = /^\d+$/.test(trimmed) ? Number(trimmed) : null;
          const numericQuery = numericCandidate !== null
            && Number.isSafeInteger(numericCandidate)
            && numericCandidate <= MAX_INT32
            ? numericCandidate
            : null;
          const yearQuery = numericQuery !== null
            && numericQuery >= MIN_NOTICE_YEAR
            && numericQuery <= MAX_NOTICE_YEAR
            ? numericQuery
            : null;
          condition = or(
            ilike(notices.subjectLine, `%${trimmed}%`),
            ilike(notices.rawText, `%${trimmed}%`),
            ilike(notices.actCited, `%${trimmed}%`),
            ...(numericQuery !== null
              ? [
                eq(notices.noticeNumber, numericQuery),
                ...(yearQuery !== null ? [eq(notices.noticeYear, yearQuery)] : [])
              ]
              : [])
          );
        }
      }

      const results = await db.select()
        .from(notices)
        .where(condition)
        .orderBy(desc(notices.noticeYear), desc(notices.noticeNumber))
        .limit(limit)
        .offset(offset);
        
      res.json({ data: results, page, limit });
    } catch (error: any) {
      console.error("Error fetching notices:", error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.get('/api/notices/:id', async (req, res) => {
    try {
      const db = getDb();
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
         return res.status(400).json({ error: 'Invalid ID format' });
      }

      const results = await db.select().from(notices).where(eq(notices.id, id)).limit(1);
      if (results.length === 0) {
        return res.status(404).json({ error: 'Notice not found' });
      }
      res.json(results[0]);
    } catch (error: any) {
      console.error("Error fetching notice details:", error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
