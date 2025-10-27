# EliteBuilders - AI-Powered Hackathon Platform

Full-stack web application where sponsors post AI challenges, builders submit solutions, and an AI judge (Gemini 2.5 Flash) produces intelligent provisional scores. Judges can review and lock final scores, with leaderboards and badges surfacing winners.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [LLM Integration](#llm-integration)
- [Frontend](#frontend)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Development](#development)

---

## Features

### Core Functionality
- **Challenge Management**: Sponsors create and manage AI hackathon challenges
- **Submission System**: Builders submit projects with repo, deck, demo, and writeup
- **AI-Powered Scoring**: Gemini 2.5 Flash LLM evaluates submissions based on rubrics
- **AutoScore**: Automatic presence checks (repo, deck, demo, writeup quality)
- **Judge Review**: Human judges can review and lock final scores
- **Leaderboards**: Real-time rankings with provisional and final scores
- **Sponsor Favorites**: Sponsors can save promising candidates
- **Badges & Achievements**: Award winners with custom badges

### Scoring System
- **AutoScore (0-20 points)**: Presence checks for required materials
- **LLM Score (0-60 points)**: AI evaluation based on 4 criteria:
  - Problem Fit (0-15): Solution relevance and problem understanding
  - Technical Depth (0-20): Code quality, architecture, innovation
  - UX & Demo Quality (0-15): User experience and presentation
  - Impact & Clarity (0-10): Real-world impact and documentation
- **Judge Adjustment**: ±20% of provisional score
- **Final Score (0-100)**: Locked by human judges

---

## Tech Stack

### Backend
- **Framework**: Next.js 14 App Router (API Routes)
- **Runtime**: Node.js
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Validation**: Zod schemas
- **AI/LLM**: Google Gemini 2.5 Flash
- **Testing**: Vitest

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom React components
- **State Management**: React hooks
- **API Client**: Fetch with typed responses

---

## Project Structure

```
Hackathon/
├── app/
│   └── api/                          # Backend API Routes
│       ├── challenges/
│       │   ├── route.ts              # GET, POST /api/challenges
│       │   └── [id]/route.ts         # GET, PATCH /api/challenges/:id
│       ├── submissions/
│       │   ├── route.ts              # POST /api/submissions
│       │   └── [id]/route.ts         # GET /api/submissions/:id
│       ├── score/route.ts            # POST /api/score (LLM scoring)
│       ├── leaderboard/route.ts      # GET /api/leaderboard
│       ├── judge/lock/route.ts       # PATCH /api/judge/lock
│       ├── sponsors/orgs/            # Sponsor organization management
│       ├── health/gemini/route.ts    # GET /api/health/gemini
│       └── [transcribe, parse-pdf, parse-docx]  # Future features
│
├── elitebuilders/                    # Frontend Application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.tsx             # Homepage
│   │   │   ├── challenges/           # Challenge browsing & detail
│   │   │   ├── submit/               # Submission flow
│   │   │   └── leaderboard/          # Rankings & scores
│   │   ├── components/               # Reusable React components
│   │   └── lib/api.ts                # API client utilities
│   ├── public/                       # Static assets
│   └── package.json
│
├── lib/
│   ├── supabase-server.ts            # Supabase server client
│   ├── gemini-client.ts              # Gemini LLM integration
│   ├── validate.ts                   # Zod validation utilities
│   └── errors.ts                     # Error handling
│
├── tests/                            # Test suite (77 tests)
│   ├── api.routes.exist.test.ts
│   ├── api.score.stub.test.ts
│   └── api.leaderboard.test.ts
│
├── scripts/
│   ├── START.sh                      # Start both backend & frontend
│   ├── STOP.sh                       # Stop all servers
│   └── validate-api.ts               # API structure validation
│
├── API.md                            # API documentation
├── LLM-INTEGRATION.md                # LLM integration guide
├── Project.md                        # Full PRD
└── README.md                         # This file
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Google Gemini API key (free tier: 1500 requests/day)

### 1. Clone & Install

```bash
cd Hackathon
npm install

# Install frontend dependencies
cd elitebuilders
npm install
cd ..
```

### 2. Environment Setup

Create `.env.local` in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google Gemini API (for LLM scoring)
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get your credentials:**
- **Supabase**: Sign up at [supabase.com](https://supabase.com), create a project, get keys from Settings > API
- **Gemini API**: Get free key at [aistudio.google.com](https://aistudio.google.com/app/apikey)

### 3. Database Setup

Run the SQL schema in your Supabase SQL editor (see `Project.md` section 4):

```sql
-- Create all tables: profiles, sponsor_orgs, challenges, submissions,
-- autoscores, llmscores, judge_reviews, badges, etc.
```

### 4. Start Development Servers

**Option A: Start Both Servers (Recommended)**

```bash
./START.sh
```

This starts:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001

**Option B: Start Individually**

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd elitebuilders && npm run dev
```

**Stop All Servers**

```bash
./STOP.sh
```

### 5. Verify Installation

**Test Gemini API Connection:**

```bash
curl http://localhost:3000/api/health/gemini
```

Expected response:
```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "model": "gemini-1.5-flash",
    "api_key_configured": true,
    "connection_test": "passed",
    "timestamp": "2025-10-26T..."
  }
}
```

**Access Frontend:**

Visit http://localhost:3001 to see the full application.

---

## LLM Integration

### Overview

EliteBuilders uses **Google Gemini 2.5 Flash** for intelligent submission scoring. The LLM evaluates projects based on a structured rubric, providing consistent and detailed feedback.

### How It Works

1. **Automatic Trigger**: When a submission is created, scoring job fires automatically
2. **AutoScore Calculation**: System checks for required materials (repo, deck, demo, writeup)
3. **LLM Evaluation**: Gemini analyzes the submission against the rubric
4. **Structured Output**: LLM returns JSON with scores and rationale
5. **Score Storage**: Results saved to `llmscores` table
6. **Status Update**: Submission status changes to `PROVISIONAL`

### Scoring Rubric

The LLM evaluates on 4 criteria (total 60 points):

| Criterion | Points | Description |
|-----------|--------|-------------|
| **Problem Fit** | 0-15 | How well does the solution address the challenge? |
| **Technical Depth** | 0-20 | Code quality, architecture, innovation |
| **UX & Demo Quality** | 0-15 | User experience, demo presentation |
| **Impact & Clarity** | 0-10 | Real-world impact, documentation quality |

### Configuration

**Model:** `gemini-2.5-flash`
- Fast response (2-5 seconds)
- Free tier: 1500 requests/day
- Consistent scoring (temperature: 0.2)

**Key Features:**
- **Retry Logic**: 2 retries with exponential backoff
- **Fallback**: Deterministic scoring if API fails
- **Error Handling**: Graceful degradation
- **Context Management**: 8000 char writeup limit

### Example LLM Response

```json
{
  "score_llm": 49,
  "rubric_scores_json": {
    "problem_fit": 14,
    "tech_depth": 18,
    "ux_flow": 8,
    "impact": 9
  },
  "rationale_md": "The project clearly identifies a significant problem...",
  "model_id": "gemini-2.5-flash",
  "model_version": "latest"
}
```

For detailed LLM integration documentation, see [LLM-INTEGRATION.md](./LLM-INTEGRATION.md).

---

## Frontend

### Pages

- **Homepage** (`/`): Platform overview and featured challenges
- **Challenges** (`/challenges`): Browse all active challenges
- **Challenge Detail** (`/challenges/:id`): View challenge details and leaderboard
- **Submit** (`/submit/:id`): Submit solution to a challenge
- **Leaderboard** (`/leaderboard/:id`): View rankings for a challenge

### Key Components

- `ChallengeCard`: Display challenge summaries
- `SubmissionForm`: Multi-step submission wizard
- `Leaderboard`: Real-time rankings table
- `ScoreBreakdown`: Detailed score visualization

### API Integration

Frontend uses type-safe API client (`lib/api.ts`):

```typescript
import { api } from '@/lib/api';

// Fetch challenges
const challenges = await api.challenges.list();

// Create submission
const submission = await api.submissions.create({
  challenge_id: '...',
  repo_url: 'https://github.com/...',
  writeup_md: '# My Project...'
});
```

---

## API Documentation

### Standard Response Format

All endpoints return:
- **Success**: `{ ok: true, data: {...} }`
- **Error**: `{ ok: false, error: { code: "ERROR_CODE", message: "..." } }`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/challenges` | List all challenges |
| GET | `/api/challenges/:id` | Get challenge details |
| POST | `/api/submissions` | Create new submission |
| GET | `/api/submissions/:id` | Get submission with scores |
| POST | `/api/score` | Trigger scoring for submission |
| GET | `/api/leaderboard?challenge_id=:id` | Get leaderboard |
| PATCH | `/api/judge/lock` | Lock final score |
| GET | `/api/health/gemini` | Check LLM API status |

For complete API documentation with examples, see [API.md](./API.md).

---

## Testing

### Run All Tests

```bash
npm run test
```

**Current Status**: 77/77 tests passing

### Test Coverage

1. **Route Existence** (`api.routes.exist.test.ts`)
   - Validates all 14 API routes exist
   - Checks for proper exports (`runtime = 'nodejs'`)

2. **Score Endpoint** (`api.score.stub.test.ts`)
   - Tests AutoScore calculation
   - Tests LLM score integration
   - Validates score storage

3. **Leaderboard** (`api.leaderboard.test.ts`)
   - Tests score calculation
   - Tests sorting logic
   - Tests filtering

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### API Validation

```bash
npm run validate:api
```

Checks:
- All required routes exist
- Proper runtime configuration
- Standard response patterns

---

## Development

### Development Workflow

1. **Start servers**: `./START.sh`
2. **Make changes**: Edit code in `app/`, `lib/`, or `elitebuilders/`
3. **Test changes**:
   - Backend: `curl http://localhost:3000/api/...`
   - Frontend: Visit http://localhost:3001
4. **Run tests**: `npm run test`
5. **Stop servers**: `./STOP.sh`

### CI/CD Pipeline

```bash
npm install
npm run typecheck
npm run lint
npm run validate:api
npm run test
npm run build
```

### Development Roadmap

#### M0 - Walking Skeleton (✅ Complete)
- ✅ API scaffolding (14 endpoints)
- ✅ LLM integration (Gemini 2.5 Flash)
- ✅ Frontend pages (challenges, submit, leaderboard)
- ✅ Submit → LLM scoring → Leaderboard flow

#### M1 - Judging & Sponsor (In Progress)
- ⏳ Judge lock functionality
- ⏳ Badges system
- ⏳ Sponsor favorites
- ⏳ Candidate packet export

#### M2 - Quality (Planned)
- ASR (Whisper API for transcription)
- OCR for document parsing
- DOCX parsing
- Row Level Security (RLS)
- Analytics dashboard
- Export polish

### Key Features Implemented

- ✅ **Full-Stack Architecture**: Next.js 14 backend + frontend
- ✅ **AI Scoring**: Gemini 2.5 Flash integration
- ✅ **Database**: Supabase with complete schema
- ✅ **Authentication**: Cookie-based auth
- ✅ **Validation**: Zod schemas throughout
- ✅ **Error Handling**: Standardized error responses
- ✅ **Testing**: 77 passing tests
- ✅ **Type Safety**: Full TypeScript coverage

---

## Project References

- **[API.md](./API.md)**: Complete API documentation with examples
- **[LLM-INTEGRATION.md](./LLM-INTEGRATION.md)**: LLM integration guide and troubleshooting
- **[Project.md](./Project.md)**: Full PRD with requirements and data model

---

## Quick Reference

### Common Commands

```bash
# Start everything
./START.sh

# Stop everything
./STOP.sh

# Install dependencies
npm install && cd elitebuilders && npm install && cd ..

# Run tests
npm run test

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build && cd elitebuilders && npm run build

# Check Gemini health
curl http://localhost:3000/api/health/gemini
```

### Environment Variables

```bash
# Backend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...

# Frontend (elitebuilders/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Ports

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:3001

---

## License

Private project - All rights reserved

---

## Support

For issues, questions, or contributions:
1. Check [API.md](./API.md) and [LLM-INTEGRATION.md](./LLM-INTEGRATION.md)
2. Review test files in `tests/`
3. Consult [Project.md](./Project.md) for architecture details

**Built with Claude Code** - AI-powered development assistant
