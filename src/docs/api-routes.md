# Universal Job Application Platform - API Routes

## Base URL
```
Production: https://api.jobflow.io/v1
Development: http://localhost:8000/api
```

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Auth Routes

### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

### POST /auth/login
Authenticate and get tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

### POST /auth/logout
Invalidate current session.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### GET /auth/me
Get current authenticated user.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

## Profile Routes

### GET /profile
Get the current user's profile.

**Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "address": "123 Main St",
  "city": "Austin",
  "state": "TX",
  "zip_code": "78701",
  "country": "United States",
  "linkedin_url": "linkedin.com/in/johndoe",
  "portfolio_url": "johndoe.com",
  "github_url": "github.com/johndoe",
  "current_title": "Product Manager",
  "years_of_experience": "5-10",
  "desired_salary": "$150,000",
  "work_authorization": "US Citizen",
  "requires_sponsorship": false,
  "generic_cover_letter": "I am passionate about...",
  "skills": ["Python", "Product Management", "SQL"],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### POST /profile
Create user profile (first time).

**Request Body:** (Same structure as GET response)

**Response (201):** Profile object

### PUT /profile
Update user profile.

**Request Body:** Partial profile object (only fields to update)

**Response (200):** Updated profile object

---

## Education Routes

### GET /profile/education
Get user's education entries.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "school": "University of Texas at Austin",
    "degree": "Bachelor",
    "field_of_study": "Computer Science",
    "start_date": "2015-08",
    "end_date": "2019-05",
    "gpa": "3.8"
  }
]
```

### POST /profile/education
Add education entry.

### PUT /profile/education/:id
Update education entry.

### DELETE /profile/education/:id
Delete education entry.

---

## Experience Routes

### GET /profile/experience
Get user's work experience entries.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "company": "TechCorp",
    "title": "Senior Product Manager",
    "location": "Austin, TX",
    "start_date": "2020-01",
    "end_date": null,
    "is_current": true,
    "description": "Led product strategy for..."
  }
]
```

### POST /profile/experience
Add experience entry.

### PUT /profile/experience/:id
Update experience entry.

### DELETE /profile/experience/:id
Delete experience entry.

---

## Documents Routes

### GET /documents
List user's documents.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "document_type": "resume",
    "file_name": "John_Doe_Resume.pdf",
    "file_url": "https://storage.example.com/resumes/uuid.pdf",
    "file_size": 245678,
    "uploaded_at": "2024-01-15T10:00:00Z"
  }
]
```

### POST /documents/upload
Upload a document (resume).

**Request:** multipart/form-data
```
file: <binary PDF file>
document_type: "resume"
```

**Response (201):**
```json
{
  "id": "uuid",
  "file_name": "resume.pdf",
  "file_url": "https://storage.example.com/resumes/uuid.pdf",
  "uploaded_at": "2024-01-15T10:00:00Z"
}
```

### DELETE /documents/:id
Delete a document.

---

## Jobs Routes (Search)

### GET /jobs/search
Search for jobs using JSearch/RapidAPI.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (job title, keywords) |
| location | string | City, state, or "remote" |
| remote | boolean | Filter for remote jobs only |
| salary_min | number | Minimum salary filter |
| salary_max | number | Maximum salary filter |
| job_type | string | full-time, part-time, contract, internship |
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 20) |

**Example:**
```
GET /jobs/search?q=product%20manager&location=austin&remote=true&salary_min=100000
```

**Response (200):**
```json
{
  "jobs": [
    {
      "id": "uuid",
      "external_id": "jsearch_123",
      "title": "Senior Product Manager",
      "company": "TechCorp",
      "location": "Austin, TX",
      "salary_min": 140000,
      "salary_max": 180000,
      "description": "We are looking for...",
      "apply_url": "https://techcorp.com/apply/123",
      "job_type": "full-time",
      "is_remote": true,
      "source": "linkedin",
      "logo_url": "https://logo.clearbit.com/techcorp.com",
      "posted_at": "2024-01-14"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "has_more": true
}
```

### GET /jobs/:id
Get detailed job information.

---

## Application Queue Routes

### GET /queue
Get user's application queue.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| page | number | Page number |

**Response (200):**
```json
{
  "queue": [
    {
      "id": "uuid",
      "job": {
        "id": "uuid",
        "title": "Senior Product Manager",
        "company": "TechCorp",
        "location": "Austin, TX",
        "apply_url": "https://techcorp.com/apply"
      },
      "status": "pending",
      "error_message": null,
      "created_at": "2024-01-15T10:00:00Z",
      "applied_at": null
    }
  ],
  "stats": {
    "total": 10,
    "pending": 3,
    "processing": 1,
    "applied": 4,
    "failed": 1,
    "manual_required": 1
  }
}
```

### POST /queue
Add jobs to the application queue.

**Request Body:**
```json
{
  "job_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (201):**
```json
{
  "added": 3,
  "queue_items": [...]
}
```

### DELETE /queue/:id
Remove a job from the queue.

### PUT /queue/:id
Update queue item status (admin/system use).

**Request Body:**
```json
{
  "status": "applied",
  "error_message": null
}
```

---

## Automation Routes

### POST /queue/process
Trigger automation processing for pending applications.

**Request Body (optional):**
```json
{
  "job_ids": ["uuid1", "uuid2"]  // Process specific jobs, or all pending if omitted
}
```

**Response (202):**
```json
{
  "message": "Processing started",
  "jobs_to_process": 5,
  "estimated_time_seconds": 150
}
```

### GET /queue/process/status
Get current automation processing status.

**Response (200):**
```json
{
  "is_processing": true,
  "current_job": "uuid",
  "progress": {
    "total": 5,
    "completed": 2,
    "remaining": 3
  }
}
```

---

## Webhooks (For External Integrations)

### POST /webhooks/application-result
Callback URL for async application results.

**Request Body:**
```json
{
  "queue_id": "uuid",
  "status": "applied",
  "message": "Application submitted successfully",
  "fields_filled": ["first_name", "last_name", "email", "phone"],
  "timestamp": "2024-01-15T10:05:00Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "constraint": "email"
    }
  }
}
```

### Common Error Codes:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| /auth/* | 10 requests/minute |
| /jobs/search | 30 requests/minute |
| /queue/process | 5 requests/minute |
| Other endpoints | 100 requests/minute |

---

## FastAPI Implementation Example

```python
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="JobFlow API", version="1.0.0")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Models
class ProfileCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    linkedin_url: Optional[str]
    # ... other fields

class JobSearchParams(BaseModel):
    q: str
    location: Optional[str] = None
    remote: bool = False
    salary_min: Optional[int] = None

# Routes
@app.get("/profile")
async def get_profile(token: str = Depends(oauth2_scheme)):
    user = await verify_token(token)
    return await db.get_profile(user.id)

@app.post("/queue")
async def add_to_queue(job_ids: List[str], token: str = Depends(oauth2_scheme)):
    user = await verify_token(token)
    return await db.add_jobs_to_queue(user.id, job_ids)

@app.post("/queue/process")
async def process_queue(
    background_tasks: BackgroundTasks,
    token: str = Depends(oauth2_scheme)
):
    user = await verify_token(token)
    background_tasks.add_task(run_automation, user.id)
    return {"message": "Processing started"}
```
