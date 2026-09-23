# The Bell — Gazette Watch

Watches Kenya Gazette notices so you don't have to read the Gazette.

## What it does
- Stores gazette notices (subject line, full text, act cited, notice year/number)
  in PostgreSQL via Drizzle ORM
- Paginated search API (`GET /api/notices?q=...`) over subject lines, raw text
  and cited acts
- React + Vite frontend for browsing and filtering notices
- Server-side Gemini integration for notice classification/summarization

## Stack
- Frontend: React 19, Vite 6, Tailwind CSS, React Router
- Server: Express + TypeScript (`server.ts`, bundled with esbuild)
- Data: Drizzle ORM + PostgreSQL
- AI: Google Gemini (server-side)

## Run it
```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and GEMINI_API_KEY
npm run dev            # vite frontend + express server via tsx
```

## Status
Early scaffold (Aug 2026). Labs track under Ansai Technologies — Community
(governance) pillar. First Labs task: define the notice ingestion source and
the alert surface.
