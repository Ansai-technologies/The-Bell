// GET /api/health — liveness check. Same response as the Express server.
export default function handler(req: any, res: any) {
  res.status(200).json({ status: 'ok' });
}
