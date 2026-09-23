// GET /api/notices — paginated notice search.
// Serverless port of the Express route in server.ts; search semantics identical:
// text match over subject_line / raw_text / act_cited, plus exact numeric match
// on notice_number and notice_year for digit-only queries (PR #1 behavior).
import { getDb } from './_db';
import { notices } from '../src/db/schema';
import { desc, ilike, or, eq } from 'drizzle-orm';

const MAX_INT32 = 2_147_483_647;
const MIN_NOTICE_YEAR = 1000;
const MAX_NOTICE_YEAR = 9999;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const limit = parseInt(first(req.query.limit) as string) || 20;
    const offset = (page - 1) * limit;

    const rawSearchQuery = first(req.query.q);
    if (req.query.q !== undefined && typeof rawSearchQuery !== 'string') {
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
                ...(yearQuery !== null ? [eq(notices.noticeYear, yearQuery)] : []),
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

    res.status(200).json({ data: results, page, limit });
  } catch (error: any) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
