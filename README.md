# Career Input - Universal Job Application Platform

A centralized job search platform that aggregates jobs from 14+ job boards including Indeed, LinkedIn, Glassdoor, and more.

## Features

- 🔍 **Search across 14+ job boards** - Indeed, LinkedIn, Glassdoor, ZipRecruiter, Monster, CareerBuilder, Remotive, RemoteOK, and more
- 📝 **One-click batch apply** - Select multiple jobs and apply to all of them
- 👤 **Universal Profile** - Fill out your info once, use it everywhere
- 📊 **Application Dashboard** - Track all your applications in one place
- 🔗 **Real Job URLs** - Every job links directly to the original posting

## Getting Started

### Frontend Only (Limited Sources)

Without the backend server, the app will still work but with fewer job sources (only APIs that support CORS):

```bash
npm install
npm run dev
```

### With Backend Server (Full Power - Recommended)

For the best experience with all 14+ job sources including Indeed, LinkedIn, Glassdoor, etc., run the backend proxy server:

**Terminal 1 - Start Backend:**
```bash
node server/index.js
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

The backend server runs on `http://localhost:3001` and the frontend will automatically detect and use it.

## Job Sources

### With Backend (14 sources):
| Source | Type | Industries |
|--------|------|------------|
| Indeed | Scrape | All |
| LinkedIn | Scrape | All |
| Glassdoor | Scrape | All |
| ZipRecruiter | Scrape | All |
| Monster | Scrape | All |
| CareerBuilder | Scrape | All |
| USAJobs | API | Government (All) |
| Remotive | API | Remote/Tech |
| RemoteOK | API | Remote/Tech |
| Arbeitnow | API | EU/Tech |
| Himalayas | API | Remote |
| Jobicy | API | Remote |
| The Muse | API | Curated |
| Adzuna | API | Multi-country |

### Without Backend (8 sources):
- Remotive, RemoteOK, Arbeitnow, Himalayas, USAJobs, Jobicy, The Muse, LinkedIn (via CORS proxy)

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **State:** Zustand (with persistence)
- **Backend:** Node.js + Express + Cheerio (for scraping)

## API Endpoints (Backend)

```
GET /api/jobs/search?query=...&location=...   # Aggregate from all sources
GET /api/jobs/indeed?query=...                 # Indeed jobs
GET /api/jobs/linkedin?query=...               # LinkedIn jobs
GET /api/jobs/glassdoor?query=...              # Glassdoor jobs
GET /api/jobs/ziprecruiter?query=...           # ZipRecruiter jobs
GET /api/jobs/monster?query=...                # Monster jobs
GET /api/jobs/careerbuilder?query=...          # CareerBuilder jobs
GET /api/jobs/remotive?query=...               # Remotive jobs
GET /api/jobs/remoteok?query=...               # RemoteOK jobs
GET /api/jobs/usajobs?query=...                # USAJobs jobs
GET /api/jobs/arbeitnow?query=...              # Arbeitnow jobs
GET /api/jobs/himalayas?query=...              # Himalayas jobs
GET /api/jobs/jobicy?query=...                 # Jobicy jobs
GET /api/jobs/themuse?query=...                # The Muse jobs
GET /api/jobs/adzuna?query=...                 # Adzuna jobs
GET /api/health                                # Health check
```

## Notes

- The backend server scrapes job sites, so some sources may occasionally fail due to rate limiting or site changes
- Job URLs always link to the real job posting on the original site
- For production, consider adding caching and rate limiting to the backend
