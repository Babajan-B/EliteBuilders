# API Validation Suite

Comprehensive validation tools for the EliteBuilders API scaffold.

## Overview

This validation suite ensures that the API scaffold is complete, follows standards, and functions correctly. It includes:

1. **Validation Script** - Verifies route files and standards
2. **Unit Tests** - Tests individual endpoints with mocked dependencies
3. **Integration Tests** - Validates cross-cutting concerns like sorting and scoring

## Files Created

### Scripts

- `scripts/validate-api.ts` - API scaffold validation script
- `tsconfig.scripts.json` - TypeScript configuration for scripts

### Tests

- `tests/api.routes.exist.test.ts` - Route existence validation
- `tests/api.score.stub.test.ts` - Score endpoint tests
- `tests/api.leaderboard.test.ts` - Leaderboard sorting and calculation tests

### Configuration

- `vitest.config.ts` - Vitest test framework configuration
- `.eslintrc.json` - ESLint configuration for code quality

### Updated Files

- `package.json` - Added validation scripts and test dependencies
- `README.md` - Added API Validation section

## Running Validations

### Type Checking

Verifies TypeScript compilation without errors:

```bash
npm run typecheck
```

**Checks:**
- TypeScript compilation succeeds
- No type errors in API routes
- Import paths resolve correctly

### Linting

Checks code quality and style:

```bash
npm run lint
```

**Checks:**
- ESLint rules pass
- Code style consistency
- TypeScript best practices

### API Scaffold Validation

Validates API structure:

```bash
npm run validate:api
```

**Checks:**
- ✓ All 14 required route files exist
- ✓ Each route exports `runtime = 'nodejs'`
- ✓ Standard response patterns used (`successResponse`, `errorResponse`)

**Output Example:**
```
🔍 Validating API scaffold...

✓ Found: app/api/challenges/route.ts
✓ Found: app/api/challenges/[id]/route.ts
✓ Found: app/api/submissions/route.ts
...

============================================================
✅ API scaffold validation passed!
```

### Test Suite

Run all tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Test Coverage

### 1. Route Existence Tests (`api.routes.exist.test.ts`)

**Purpose:** Validates that all required API routes exist and follow standards.

**Tests:**
- All 14 route files exist in correct locations
- Each route has `export const runtime = 'nodejs'`
- Standard response patterns are used

**Example:**
```typescript
it('should have all required route files', () => {
  const result = validateApiScaffold();
  expect(result.errors).toHaveLength(0);
  expect(result.passed).toBe(true);
});
```

### 2. Score Endpoint Tests (`api.score.stub.test.ts`)

**Purpose:** Tests the POST /api/score endpoint with mocked dependencies.

**Tests:**
- Returns JSON envelope `{ ok: true, data }` on success
- Returns validation error for invalid UUID
- Returns error for missing submissionId
- Updates submission status to SCORING

**Mocks:**
- Supabase client
- Next.js headers/cookies
- Authentication

**Example:**
```typescript
it('should return JSON envelope with ok: true on success', async () => {
  const response = await POST(request);
  const json = await response.json();

  expect(json).toHaveProperty('ok');
  expect(json.ok).toBe(true);
  expect(json.data.status).toBe('SCORING');
});
```

### 3. Leaderboard Tests (`api.leaderboard.test.ts`)

**Purpose:** Tests GET /api/leaderboard sorting and score calculation.

**Tests:**
- Returns JSON envelope with sorted data
- Sorts submissions by score (descending)
- Assigns ranks starting from 1
- Calculates provisional scores: `0.2 * auto + 0.6 * llm`
- Uses final scores when judge has locked
- Returns validation error for missing challenge_id

**Mocks:**
- Database rows with different score types
- Supabase client

**Example:**
```typescript
it('should calculate provisional scores correctly', async () => {
  const response = await GET(request);
  const json = await response.json();
  const bobEntry = json.data.find(e => e.display_name === 'Bob');

  // Provisional = 0.2 * 20 + 0.6 * 60 = 40
  expect(bobEntry.score).toBe(40);
  expect(bobEntry.score_type).toBe('provisional');
});
```

## Validation Script Details

### API Routes Checked

The validation script verifies these 14 route files:

1. `challenges/route.ts`
2. `challenges/[id]/route.ts`
3. `submissions/route.ts`
4. `submissions/[id]/route.ts`
5. `score/route.ts`
6. `leaderboard/route.ts`
7. `judge/lock/route.ts`
8. `sponsors/orgs/route.ts`
9. `sponsors/orgs/[orgId]/route.ts`
10. `sponsors/orgs/[orgId]/members/route.ts`
11. `sponsors/orgs/[orgId]/members/[profileId]/route.ts`
12. `transcribe/route.ts`
13. `parse-pdf/route.ts`
14. `parse-docx/route.ts`

### Standard Response Patterns

All routes use helper functions from `lib/errors.ts`:

**Success:**
```typescript
return successResponse({ data: value });
// Returns: { ok: true, data: { data: value } }
```

**Error:**
```typescript
return errorResponse(ErrorCode.NOT_FOUND, 'Resource not found');
// Returns: { ok: false, error: { code: "NOT_FOUND", message: "..." } }
```

### Runtime Configuration

All routes must export:
```typescript
export const runtime = 'nodejs';
```

This ensures routes run on Node.js runtime (required for Supabase server-side client).

## Continuous Integration

Recommended CI pipeline:

```yaml
name: Validate API

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Validate API scaffold
        run: npm run validate:api

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build
```

## Exit Codes

All validation tools follow standard exit code conventions:

- `0` - Success, all checks passed
- `1` - Failure, one or more checks failed

This makes them suitable for CI/CD pipelines.

## Extending Validation

### Adding New Route Checks

Edit `scripts/validate-api.ts`:

```typescript
const REQUIRED_ROUTES = [
  // ... existing routes
  'new-feature/route.ts',  // Add new route
];
```

### Adding New Tests

Create a new test file in `tests/`:

```typescript
// tests/api.new-feature.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '../app/api/new-feature/route';

describe('POST /api/new-feature', () => {
  it('should validate and process request', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### TypeScript Compilation Errors

If `npm run typecheck` fails:
1. Check `tsconfig.json` configuration
2. Verify all imports resolve correctly
3. Ensure `@types/node` is installed

### Validation Script Fails

If `npm run validate:api` fails:
1. Check that all route files exist
2. Verify each route has `export const runtime = 'nodejs'`
3. Ensure helper functions are imported correctly

### Tests Fail

If `npm run test` fails:
1. Check mock setup in test files
2. Verify Vitest configuration
3. Ensure dependencies are installed

## Dependencies

### Runtime
- `next` - Next.js 14 framework
- `@supabase/supabase-js` - Supabase client
- `zod` - Schema validation

### Development
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `vitest` - Test framework
- `eslint` - Code linting
- `@types/node` - Node.js type definitions

## Summary

The validation suite provides:

✅ **Complete coverage** of API routes and standards
✅ **Automated testing** with mocked dependencies
✅ **Type safety** with TypeScript checking
✅ **Code quality** with ESLint
✅ **CI/CD ready** with standard exit codes

All validations can be run with a single command:

```bash
npm run typecheck && npm run lint && npm run validate:api && npm run test
```
