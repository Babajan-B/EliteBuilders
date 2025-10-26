# EliteBuilders API Documentation

API layer for the EliteBuilders platform - where sponsors post AI challenges, builders submit solutions, and LLMs help with scoring.

## Base Response Format

All endpoints return responses in the following format:

### Success Response
```json
{
  "ok": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Error Codes

- `VALIDATION_ERROR` (400) - Request validation failed
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict (e.g., duplicate)
- `INTERNAL_ERROR` (500) - Internal server error
- `NOT_IMPLEMENTED` (501) - Feature not yet implemented

## Endpoints

### Challenges

#### GET /api/challenges
List challenges with optional filters.

**Query Parameters:**
- `q` (optional) - Search query for title/description
- `tag` (optional) - Filter by tag
- `active` (optional) - Filter by active status ("true" or "false")

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "sponsor_org_id": "uuid",
      "title": "Build an AI Assistant",
      "brief_md": "...",
      "rubric_json": { ... },
      "tags": ["ai", "nlp"],
      "deadline_utc": "2025-12-31T23:59:59Z",
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/challenges/[id]
Get a specific challenge by ID.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "sponsor_org_id": "uuid",
    "title": "Build an AI Assistant",
    "brief_md": "...",
    "rubric_json": { ... },
    "tags": ["ai", "nlp"],
    "deadline_utc": "2025-12-31T23:59:59Z",
    "is_active": true
  }
}
```

#### POST /api/challenges
Create a new challenge (sponsor owner/manager only).

**Request Body:**
```json
{
  "sponsor_org_id": "uuid",
  "title": "Build an AI Assistant",
  "brief_md": "Challenge description in markdown",
  "rubric_json": {
    "demo_clarity": 15,
    "functionality": 20,
    "reproducibility": 15,
    "impact": 10
  },
  "tags": ["ai", "nlp"],
  "deadline_utc": "2025-12-31T23:59:59Z",
  "is_active": true
}
```

#### PATCH /api/challenges/[id]
Update a challenge (sponsor owner/manager only).

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "brief_md": "Updated description",
  "rubric_json": { ... },
  "tags": ["updated", "tags"],
  "deadline_utc": "2025-12-31T23:59:59Z",
  "is_active": false
}
```

### Submissions

#### POST /api/submissions
Create a new submission.

**Request Body:**
```json
{
  "challenge_id": "uuid",
  "repo_url": "https://github.com/user/repo",
  "deck_url": "https://example.com/deck.pdf",
  "demo_url": "https://example.com/demo",
  "writeup_md": "# My Solution\n\nDetailed write-up..."
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "challenge_id": "uuid",
    "repo_url": "...",
    "deck_url": "...",
    "demo_url": "...",
    "writeup_md": "...",
    "status": "QUEUED",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

#### GET /api/submissions/[id]
Get submission details with scores.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "challenge_id": "uuid",
    "status": "PROVISIONAL",
    "autoscores": {
      "score_auto": 18,
      "checks_json": { ... }
    },
    "llmscores": {
      "score_llm": 52,
      "rubric_scores_json": { ... },
      "rationale_md": "..."
    },
    "judge_reviews": {
      "final_score": 68,
      "delta_pct": 5,
      "locked_bool": true
    }
  }
}
```

### Scoring

#### POST /api/score
Trigger scoring job for a submission.

**Request Body:**
```json
{
  "submissionId": "uuid"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "submissionId": "uuid",
    "status": "SCORING",
    "message": "Scoring job initiated"
  }
}
```

### Leaderboard

#### GET /api/leaderboard
Get ranked submissions for a challenge.

**Query Parameters:**
- `challenge_id` (required) - Challenge UUID
- `limit` (optional) - Max number of results (default: 100)

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "rank": 1,
      "submission_id": "uuid",
      "user_id": "uuid",
      "display_name": "John Doe",
      "score": 68.5,
      "score_type": "final",
      "status": "FINAL",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Judge

#### PATCH /api/judge/lock
Lock a judge review and set final score.

**Request Body:**
```json
{
  "submissionId": "uuid",
  "delta_pct": 5,
  "notes": "Excellent implementation with minor improvements needed"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "submission_id": "uuid",
    "final_score": 68.5,
    "status": "FINAL",
    "locked_at": "2025-01-01T00:00:00Z"
  }
}
```

### Sponsor Organizations

#### POST /api/sponsors/orgs
Create a new sponsor organization.

**Request Body:**
```json
{
  "org_name": "Acme Corp",
  "verified": false
}
```

#### GET /api/sponsors/orgs/[orgId]
Get organization details with members.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "org_name": "Acme Corp",
    "owner_profile_id": "uuid",
    "verified": true,
    "sponsor_members": [
      {
        "profile_id": "uuid",
        "role": "owner",
        "profiles": {
          "display_name": "John Doe",
          "email": "john@acme.com"
        }
      }
    ]
  }
}
```

#### POST /api/sponsors/orgs/[orgId]/members
Add a member to the organization.

**Request Body:**
```json
{
  "profile_id": "uuid",
  "role": "manager"
}
```

#### DELETE /api/sponsors/orgs/[orgId]/members/[profileId]
Remove a member from the organization.

### Parsing Services (v1.5 - Not Implemented)

The following endpoints are stubs and will return 501 Not Implemented:

- `POST /api/transcribe` - Audio/video transcription
- `POST /api/parse-pdf` - PDF document parsing
- `POST /api/parse-docx` - DOCX document parsing

## Submission Status Flow

```
QUEUED → SCORING → PROVISIONAL → FINAL
```

- **QUEUED**: Initial state after submission
- **SCORING**: LLM scoring in progress
- **PROVISIONAL**: Auto + LLM scores complete
- **FINAL**: Judge has locked the final score

## Score Calculation

### Provisional Score
```
provisional = 0.2 * auto_score + 0.6 * llm_score
```

- `auto_score` (0-20): Presence checks (repo, deck, demo, writeup)
- `llm_score` (0-60): LLM evaluation based on rubric

### Final Score
```
final = provisional * (1 + delta_pct/100)
```

- `delta_pct` (-20 to +20): Judge adjustment percentage
- Judge can adjust ±10-20% of provisional score
