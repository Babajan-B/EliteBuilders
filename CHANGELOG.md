# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added (2025-10-26) - Frontend UI Implementation

#### Step 0: Auth & Gating (Login + Registration + Protected Actions) ✅

**Context**: Implemented complete authentication system with NextAuth.js, including login, registration (profile onboarding), and route protection middleware.

**Features Implemented**:

1. **Authentication Infrastructure**:
   - NextAuth.js integration with GitHub OAuth and Email (Credentials) providers
   - Session management with JWT strategy
   - Custom type extensions for user profile fields (display_name, role, avatarUrl)

2. **Auth Pages**:
   - `/login` - Sign in page with GitHub OAuth and email/password options
   - `/signup` - NEW: Dedicated sign up page with account creation
   - `/register` - Profile onboarding form (display_name, role selection)
   - `/403` - Access denied page for unauthorized access
   - Auth flow: Signup → Login → Registration (profile completion) → Protected route

3. **Route Protection** (`middleware.ts`):
   - Protect `/submit`, `/judge`, `/profile` routes
   - Redirect to login if not authenticated
   - Redirect to registration if profile incomplete
   - Role-based access control (judge routes require judge/admin role)
   - Preserve `?next=` redirect parameter throughout auth flow

4. **API Endpoints**:
   - `POST /api/profiles` - Create/update user profile during onboarding
   - `/api/auth/[...nextauth]` - NextAuth route handler with custom callbacks

5. **UI Foundation** (Tailwind + shadcn/ui):
   - Installed and configured Tailwind CSS with custom design tokens
   - Created base UI components: Button, Card, Badge
   - Implemented responsive Header with user session display
   - Root layout with SessionProvider and global styles
   - Custom CSS variables for theming (indigo primary, high contrast)

6. **Client & Server Utilities**:
   - `lib/auth.client.ts` - Client-side `useAuth()` hook, profile completion check
   - `lib/auth.server.ts` - Server-side session helpers
   - `lib/http.ts` - API fetch wrapper with error handling
   - `lib/ui.ts` - Utility functions (cn, truncate, fmtDate, fmtScore)
   - `lib/types.ts` - Shared TypeScript interfaces

**Testing**:
- ✅ TypeScript: No compilation errors
- ✅ Dev server: Running on http://localhost:3000
- ✅ Build: Successfully compiling with Tailwind CSS v4

**Build Configuration**:
- Updated to Tailwind CSS v4 with `@tailwindcss/postcss` plugin
- Modified `postcss.config.js` to use new Tailwind PostCSS integration
- Updated `app/globals.css` to use `@import "tailwindcss"` syntax (v4 approach)

**Next Steps**: Step 1 - Base Shell & Theme

---

### Fixed (2025-01-XX)

#### Core API Gap Fixes - Integration Smoke Test Issues

**Context**: Integration smoke test revealed two critical endpoint issues that prevented production readiness:
1. Leaderboard showing "N/A" for display names and undefined scores
2. Sponsors org endpoint returning 404 even for valid organization members

**Changes**:

##### 1. Leaderboard API (`/api/leaderboard`)
- **Problem**: Response returned undefined scores and "N/A" display names
- **Root Cause**: Relied on potentially missing database view, incorrect field mapping
- **Solution**:
  - Removed dependency on `leaderboard` view - now always computes scores manually
  - Changed response format from `{score, score_type}` to `{score_auto, score_llm, score_display}`
  - Always join with `profiles` table to ensure `display_name` is populated
  - Server-side score computation: `score_display = locked_bool && final_score ? final_score : (0.2 * score_auto + 0.6 * score_llm)`
  - Added proper handling for both array (test mock) and object (real DB) join results
- **Impact**: Leaderboard now consistently returns valid numeric scores and user display names
- **Files Changed**:
  - `app/api/leaderboard/route.ts` - Complete rewrite of scoring logic
  - `tests/api.leaderboard.test.ts` - Updated assertions to match new response format

##### 2. Sponsors Organization API (`/api/sponsors/orgs/[orgId]`)
- **Problem**: Always returned 404, even for valid org members
- **Root Cause**: No authentication checks, incorrect query structure
- **Solution**:
  - Implemented authentication via `getUser()` and `getSponsorOrgRole()`
  - Added authorization: only org members and admins can access org details
  - Returns 404 for non-members (consistent with security-by-obscurity pattern)
  - Split into two queries to avoid complex nested joins:
    1. Query org + sponsor_members
    2. Separately query profiles by ID list, then merge
  - Response now includes full member details: `{profile_id, role, display_name, avatar_url}`
- **Impact**: Members can now access their org details; non-members properly denied
- **Files Changed**:
  - `app/api/sponsors/orgs/[orgId]/route.ts` - Added auth and proper data fetching
  - `tests/api.sponsors.orgs.test.ts` - NEW: 6 comprehensive tests covering auth scenarios
  - `lib/auth.ts` - Changed mock user ID to seeded test user who has org membership

##### 3. Judge Lock API (`/api/judge/lock`)
- **Problem**: Final score computation returning 0 in tests
- **Root Cause**: Same mock array handling issue as leaderboard
- **Solution**: Added array/object format detection for autoscores/llmscores
- **Files Changed**: `app/api/judge/lock/route.ts`

##### 4. Test Infrastructure Improvements
- **Enhanced Supabase Mock** (`tests/utils/supabase-mock.ts`):
  - Added support for one-to-many relationships (e.g., `sponsor_members`, `autoscores`)
  - Implemented nested join parsing: `sponsor_members(role, profiles(display_name))`
  - Special case handling for non-standard foreign keys (e.g., `sponsor_orgs.org_id`)
  - Proper detection of relationship cardinality (one-to-one vs one-to-many)
- **Auth Mock Updates**: Changed from generic `mock-user-id-123` to actual seeded user `33333333-3333-3333-3333-333333333333` who exists in test data

**Test Results**:
- Before: 72/77 tests passing (93.5%)
- After: **77/77 tests passing (100%)** ✅
- New test file: `tests/api.sponsors.orgs.test.ts` with 6 tests covering:
  - Member access (200 with full org data)
  - Non-member access (404)
  - Admin access (200)
  - Member details include display_name
  - Non-existent org (404)
  - JSON envelope structure

**Integration Test Status**:
- Unit tests: ✅ 100% passing (77/77)
- Type checking: ✅ No errors
- Linting: ✅ Only minor warnings (no errors)
- Integration smoke test: ⏸️ Requires dev server (manual verification needed)

**Breaking Changes**:
- Leaderboard API response format changed:
  - **Removed**: `score: number`, `score_type: "provisional" | "final"`
  - **Added**: `score_auto: number`, `score_llm: number`, `score_display: number`
  - Clients must update to use `score_display` for display purposes

**Migration Notes**:
- Frontend leaderboard components should:
  - Replace `entry.score` with `entry.score_display`
  - Optionally show `score_auto` and `score_llm` for transparency
  - Remove `score_type` logic (use `status` field instead: "PROVISIONAL" or "FINAL")

---

