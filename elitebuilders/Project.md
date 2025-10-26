EliteBuilders — Dev PRD

0) One-liner

Web app where sponsors post AI challenges, builders submit repo/deck/demo, LLM produces provisional scores, judges lock finals, leaderboards + badges surface winners.

1) Hard Constraints / Assumptions
	•	Next.js 14 (App Router). Node runtime for parsing routes.
	•	Supabase (Postgres + Auth + Storage). RLS after MVP.
	•	Scoring LLM: Gemini 1.5 Flash (free tier). Optional Whisper API for ASR later.
	•	No code execution/sandbox in v1.
	•	Provisional score P50 ≤ 5 min; uploads ≤ 10MB.

2) Non-Goals (v1)
	•	Payments/prize payouts, messaging, sandbox execution, advanced RAG/plagiarism.

3) Core Objects
	•	Profile(user/role)
	•	SponsorOrg(company) + SponsorMember
	•	Challenge(rubric, deadline)
	•	Submission(repo, deck, demo, write-up, status)
	•	Scores: AutoScore, LLMScore, JudgeReview
	•	Badge, UserBadge, CareerScore
	•	SponsorFavorite, CandidatePacket
	•	Notification, Event

4) Minimal Data Model (DDL sketch)

Tables (PK → FK):
	•	profiles(id PK -> auth.users.id, display_name, email, role enum, created_at)
	•	sponsor_orgs(id PK, org_name, owner_profile_id -> profiles.id, verified, created_at)
	•	sponsor_members(org_id -> sponsor_orgs.id, profile_id -> profiles.id, role enum, PK(org_id, profile_id))
	•	challenges(id PK, sponsor_org_id -> sponsor_orgs.id, title, brief_md, rubric_json, tags[], deadline_utc, is_active)
	•	challenge_judges(challenge_id -> challenges.id, judge_id -> profiles.id, PK(challenge_id, judge_id))
	•	submissions(id PK, user_id -> profiles.id, challenge_id -> challenges.id, repo_url, deck_url, demo_url, writeup_md, status enum, created_at)
	•	autoscores(submission_id PK -> submissions.id, checks_json, score_auto)
	•	llmscores(submission_id PK -> submissions.id, rubric_scores_json, rationale_md, score_llm, model_id, model_version, prompt_hash, created_at)
	•	judge_reviews(submission_id PK -> submissions.id, judge_id -> profiles.id, delta_pct [-20..20], notes_md, locked_bool, final_score, locked_at)
	•	badges(id PK, name, code, rule, icon) / user_badges(user_id -> profiles.id, badge_id -> badges.id, PK(user_id, badge_id))
	•	career_scores(user_id -> profiles.id, season, score_accum, PK(user_id, season))
	•	sponsor_favorites(org_id -> sponsor_orgs.id, submission_id -> submissions.id, noted_by -> profiles.id, note, PK(org_id, submission_id))
	•	candidate_packets(id PK, org_id -> sponsor_orgs.id, challenge_id -> challenges.id, title, export_url, filters_json, created_at)
	•	notifications(id PK, recipient_id -> profiles.id, submission_id? -> submissions.id, challenge_id? -> challenges.id, type enum, payload, is_read, created_at)
	•	events(id bigserial PK, event_type, actor_id -> profiles.id, submission_id?, challenge_id?, details, created_at)
	•	View leaderboard: join of submissions + autoscores + llmscores + judge_reviews with computed score_display.

5) Status Machine

QUEUED → SCORING → PROVISIONAL → FINAL
	•	Transitions:
	•	on submit: QUEUED→SCORING
	•	after LLMScore saved: →PROVISIONAL
	•	judge lock: →FINAL (+final_score)

6) Scoring Math
	•	Auto = presence checks (repo/deck/demo/write-up length) → 0..20
	•	LLM rubric (weights from rubric_json, default):
	•	demo_clarity(15), functionality(20), reproducibility(15), impact(10) = 0..60
	•	Judge = ±(10–20%) bounded adjustment with rationale (final component 20%)
	•	Display score:
	•	provisional: 0.2*auto + 0.6*llm
	•	final: judge-locked final_score

7) API Contracts (v1)
	•	GET /api/challenges (filters: q, tag, active)
	•	GET /api/challenges/:id
	•	POST /api/challenges (sponsor owner/manager)
	•	PATCH /api/challenges/:id (sponsor owner/manager)
	•	POST /api/submissions (multipart: repo_url, deck.pdf, demo_url, writeup_md)
	•	GET /api/submissions/:id
	•	POST /api/score (body: submissionId) → server job
	•	GET /api/leaderboard?challenge_id=...
	•	PATCH /api/judge/lock (body: submissionId, delta_pct, notes)
	•	POST /api/sponsors/orgs / GET /api/sponsors/orgs/:id
	•	POST /api/sponsors/favorites (org_id, submission_id, note)
	•	POST /api/sponsors/packets (org_id, challenge_id, filters) → export_url
	•	(v1.5) POST /api/transcribe, POST /api/parse-pdf, POST /api/parse-docx, POST /api/ocr

8) Frontend (pages)
	•	/ Challenges list
	•	/challenges/[id] Challenge detail + SubmitForm
	•	/leaderboard Table (provisional/final indicator)
	•	/submissions/[id] Detail: artifacts + scores
	•	/judge Queue + detail + lock
	•	/sponsor Org dashboard (challenge CRUD, ranked results)
	•	/profile Basic profile

9) Workers / Jobs

Score Job (idempotent on submission_id)
	1.	Fetch submission + rubric.
	2.	Parse deck (pdf-parse); (v1.5) parse docx, captions/ASR.
	3.	Compute AutoScore (presence checks).
	4.	Build LLM prompt (rubric + evidence excerpts).
	5.	Call Gemini 1.5 Flash (temperature=0.2; retry with 0 on JSON fail).
	6.	Upsert llmscores; set status → PROVISIONAL.
	7.	Emit events + notifications.

Packet Export Job
	•	Query top-N final (or provisional) + fields; produce CSV/PDF; upload to packets/; return URL.

10) Error Handling / Retries
	•	JSON parse fail → 1 retry w/ temp=0 + “STRICT JSON ONLY”.
	•	Deck fetch fail → score with write-up only; log warning.
	•	LLM 429/5xx → backoff (2, 5, 15s), max 3 attempts.
	•	Idempotent upserts on submission_id for autoscores/llmscores/judge_reviews.

11) Performance Budgets
	•	Provisional P50 ≤ 5 min; P95 ≤ 15 min.
	•	LLM input caps:
	•	writeup ≤ 8k chars
	•	deck_text ≤ 40k chars (truncate)
	•	transcript ≤ 20k chars (v1.5)
	•	Job concurrency: 3–5 per worker. Queue depth metric.

12) Security / Privacy
	•	Signed URLs for deck files (public for demo allowed).
	•	Never expose emails in public views.
	•	Store model_id, model_version, prompt_hash for audit.
	•	RLS (phase-in): builders read own submissions; judges read assigned; sponsors read final on their challenges.

13) Observability
	•	Log per submission_id: steps, sizes, token estimate, retries, duration.
	•	Metrics: jobs/sec, median/95p durations, LLM error rate.
	•	Alerts: LLM error rate >5%, JSON failure >3% of jobs, queue >50 for 10m.

14) Rollout / Milestones
	•	M0 (Walking skeleton, 1–2 days): submit → LLM provisional → leaderboard.
	•	M1 (Judging & Sponsor, +3–5 days): judge lock, badges, sponsor favorites, candidate packet export.
	•	M2 (Quality, +1–2 weeks): ASR (Whisper API/self-host), OCR, DOCX, RLS, analytics, exports polish.

15) Test Plan (high-level)
	•	Unit: parsing utils (pdf, sanitize), score math, JSON coercion.
	•	Integration: /api/submissions → /api/score → DB rows set.
	•	E2E: submit fixture → provisional in UI within budget.
	•	Role tests: builder/judge/sponsor permissions.
	•	Load: 50 submissions burst → queue drains, no 5xx.

16) ENV / Config
	•	NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY(server)
	•	GEMINI_API_KEY (LLM scoring)
	•	OPENAI_API_KEY (optional ASR)
	•	ASR_SERVICE_URL, OCR_SERVICE_URL (if self-hosted)
	•	NEXT_PUBLIC_BASE_URL

