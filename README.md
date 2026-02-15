Career Input (CareerInput)

Career Input is a universal job search + application-tracking prototype that pulls listings from multiple job platforms into one place. Search once, compare results, and manage a single application queue.

Instead of bouncing between tabs (Indeed, LinkedIn, Glassdoor, etc.), Career Input focuses on one workflow:

Search → Shortlist → Queue → Track Outcomes → Apply via Original Posting

What This Repo Contains

This repository is a full-stack project with two main parts:

Frontend

React + TypeScript + Tailwind CSS

UI for searching, filtering, viewing job details, selecting jobs, and managing the application queue

Optional Backend Proxy

Node.js + Express

Aggregation server that fetches from sources difficult to access directly from the browser (CORS and scraping limitations)

Core Features
1) Multi-Platform Job Search

Search roles by keyword (and optionally location)

Filter results (e.g., remote-only, salary range)

View job cards and a detailed comparison panel

Each result links back to the original source posting for verification and application

2) Source Transparency

Career Input tracks which job sources succeeded and how many results each returned.
This helps users understand coverage and reliability per search.

3) Batch Selection + Application Queue

Select individual jobs or all results

Add selected jobs to an application queue

Track queue status via dashboard:

Pending

Processing

Applied

Manual Required

Failed

Note: “Batch apply” is implemented as a queue + status simulation.
Real-world automated applications are often blocked by logins, CAPTCHAs, and dynamic form structures. The app falls back to “apply manually” when automation isn’t feasible.

4) Universal Profile + Resume Upload (Local)

Fill application info once (contact details, links, experience, education, skills, work authorization, etc.)

Upload a resume PDF (stored locally in browser)

Foundation for future “universal autofill” behavior

How Job Searching Works
Mode A — With Backend Proxy (Recommended)

When the backend is running, the frontend automatically sends a single request to the proxy server.

The backend:

Queries multiple job sources (APIs, RSS, scraping)

Normalizes listings into a consistent Job format

Returns a combined result list

Applies filtering and de-duplication

Why this exists: Many job boards block browser-based scraping. A server-side proxy avoids most CORS issues and improves reliability.

Mode B — Frontend-Only Fallback

If the backend is unavailable:

Uses public APIs/RSS when possible

Attempts blocked sources through public CORS proxies

Provides “search link” style results when direct fetch fails

This keeps the app usable without the server, though results may vary due to rate limits or bot protection.

Job Sources

Career Input aggregates listings from:

Public APIs (most stable)

RSS feeds (generally stable)

Scraping adapters (most fragile)

The UI indicates which sources succeeded for each search.

Application Dashboard

The dashboard tracks your queue lifecycle:

Pending – Selected but not processed

Processing – Simulated automation attempt

Applied – Successful path

Manual Required – CAPTCHA/login detected

Failed – Form structure not recognized

For “Manual Required”, the app redirects you to the original posting so you can complete the application normally.

Data Storage & Privacy

Current implementation is single-user and local-first:

Profile info, resume metadata, and queue stored in browser storage

Resume uses local file URL; may require re-upload after refresh/session change

Suggested Production Enhancements

Real authentication

Secure document storage

Database-backed application tracking

Server-side caching and rate limiting for job-source requests

Tech Stack

Frontend

React

TypeScript

Vite

Tailwind CSS

Zustand (state management with persistence)

Backend (Optional)

Node.js

Express

Axios

Cheerio (scraping)

XML parsing utilities

Repo Structure (Mental Map)
src/       # Frontend app (pages, components, state store, services, types)
server/    # Backend proxy (source adapters + aggregation endpoint)
Known Limitations

Scraping-based sources can break or rate-limit without warning

Frontend-only mode depends on public CORS proxies (unstable)

“Batch apply” is a simulated workflow, not guaranteed automation

Some fields (salary, job type, experience level) may be missing or estimated due to source variation

Roadmap Ideas

Backend caching to reduce repeated scraping and speed up searches

Database support for cross-device application tracking

Authentication for a truly universal profile

Improved normalization (job types, seniority, salary units, location parsing)

Export options (CSV/JSON) for application history
