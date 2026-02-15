# Career Input (CareerInput)

Career Input is a universal job search + application-tracking prototype that pulls listings from multiple job platforms into one place, so you can search once, compare results, and manage a single “application queue”.

Instead of bouncing between tabs (Indeed, LinkedIn, Glassdoor, etc.), Career Input focuses on one workflow:  
**Search → shortlist → queue → track outcomes → jump to the original posting to apply**.

---

## What this repo contains

This repository is a full-stack project with two main parts:

- **Frontend (React + TypeScript + Tailwind)**: the user interface for searching, filtering, viewing job details, selecting jobs, and managing your application queue.
- **Optional backend proxy (Node + Express)**: a job-aggregation server that fetches from sources that are difficult to access directly from the browser (mostly due to CORS and scraping limitations).

---

## Core features (what users can do)

### 1) Multi-platform job search
- Search for roles by keyword (and optionally location).
- Filter results (example: remote-only, salary range).
- View job cards and a job-details panel to compare listings quickly.
- Every result routes you back to a **real source link**, so you can confirm the posting and apply on the official page.

### 2) Source transparency (“where did these results come from?”)
Career Input tracks whether each job source succeeded and how many results it returned. This helps you understand coverage and reliability per search.

### 3) Batch selection + application queue
- Select individual jobs or select all results.
- Add selected jobs into an **application queue**.
- Use the dashboard to track queue status (pending, processing, applied, failed, manual required).

**Note:** The “batch apply” concept in this repo is implemented as a **queue + status simulation** (useful for demonstrating product flow). In real-world production, fully automating applications across third-party job sites is usually blocked by logins, CAPTCHAs, and frequently changing form structures—so this project treats automation as a “best effort” concept and falls back to “apply manually” when needed.

### 4) Universal profile + resume upload (local)
A profile/settings area lets you fill out key application info once (contact info, links, experience, education, skills, work authorization, etc.) and upload a resume PDF.

This is designed as the foundation for “universal application autofill” behavior.

---

## How job searching works (two modes)

### Mode A — With the backend proxy (recommended for full coverage)
When the backend proxy is running, the frontend automatically detects it and sends a single search request to the backend.

The backend then:
- Queries multiple job sources (some via APIs, others via scraping/RSS)
- Normalizes listings into a consistent `Job` shape
- Returns one combined list to the frontend
- Applies filtering + de-duplication so results are cleaner

Why this exists: many job boards block browser-based fetching or scraping. A server-side proxy avoids most CORS issues and is generally more reliable.

### Mode B — Frontend-only fallback (works, but less reliable)
If the backend isn’t available, the frontend switches to “direct fetch” mode:
- It tries public APIs/RSS where possible
- For blocked sources, it attempts requests through public CORS proxies
- If a source still fails, the UI may include a “search link” style result so the user can still jump to that platform and continue there

This fallback makes the app usable even without the server—but results can vary more depending on rate limits, bot protection, and proxy availability.

---

## Job sources

Career Input aggregates from a mix of:
- public APIs (more stable)
- RSS feeds (usually stable)
- scraping (most fragile; can break when site markup changes)

Because the repo supports both backend mode and frontend-only mode, the *exact* set of sources depends on how you run the app. The UI is built to show which sources succeeded for a given search.

---

## Application dashboard (what “batch apply” means here)

The dashboard is a tracking tool for your queue:
- “Pending” items are jobs you selected but haven’t processed yet
- “Processing” simulates an automation attempt
- Outcomes include:
  - **Applied** (success path)
  - **Manual required** (e.g., CAPTCHA/login detected)
  - **Failed** (e.g., form structure not recognized)

For “manual required,” the UI keeps you moving by sending you to the original job posting so you can apply normally.

---

## Data storage & privacy notes

- This project is currently **single-user and local-first**.
- Profile info, resume metadata, and the application queue are stored locally in the browser (so they persist between reloads).
- Resume upload uses a local browser file URL approach; depending on browser behavior, you may need to re-upload after a refresh/session change.

If you evolve this project into a real product, you’d typically add:
- real authentication
- secure document storage
- a database-backed application tracker
- server-side caching / rate limiting for job-source fetches

---

## Tech stack (high level)

- Frontend: React, TypeScript, Vite, Tailwind CSS
- State: Zustand (with persistence)
- Backend (optional): Node.js, Express, Axios, Cheerio (scraping), XML parsing utilities

---

## Repo structure (mental map)

- `src/`: frontend app (pages, components, state store, job-source services, types)
- `server/`: backend job proxy server (source adapters + aggregation endpoint)

---

## Known limitations (honest expectations)

- Scraping-based sources can break or rate-limit without warning.
- Frontend-only mode depends on public CORS proxies, which can be unstable.
- “Batch apply” is represented as a product workflow + queue simulation; it does not guarantee real automated submission on third-party job sites.
- Some fields (salary, job type, experience level) vary by source and may be missing or estimated.

---

## Roadmap ideas (practical next steps)

- Add caching on the backend to reduce repeated scraping and speed up searches
- Add a database so applications are tracked reliably across devices
- Add auth so the profile becomes truly “universal”
- Improve normalization (consistent job types, seniority, salary units, location parsing)
- Add export options (CSV/JSON) for application history
