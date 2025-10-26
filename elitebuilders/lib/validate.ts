/**
 * Zod validation utilities
 */

import { z } from 'zod';
import { ErrorCode, error, type ApiErrorResponse } from './errors';

/**
 * Validate data against a Zod schema
 * Returns parsed data or an error response
 */
export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: ApiErrorResponse } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const messages = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    return {
      success: false,
      error: error(ErrorCode.VALIDATION_ERROR, messages.join('; ')),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Parse and validate JSON from request body
 */
export async function parseAndValidate<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: ApiErrorResponse }> {
  try {
    const body = await request.json();
    return validate(schema, body);
  } catch (err) {
    return {
      success: false,
      error: error(ErrorCode.BAD_REQUEST, 'Invalid JSON in request body'),
    };
  }
}

/**
 * Parse and validate URL search params
 */
export function parseSearchParams<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: ApiErrorResponse } {
  const obj: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    const existing = obj[key];
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        obj[key] = [existing, value];
      }
    } else {
      obj[key] = value;
    }
  });

  return validate(schema, obj);
}

// ============================================================================
// API Route Schemas
// ============================================================================

/**
 * Challenges
 */
export const CreateChallengeSchema = z.object({
  sponsor_org_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  brief_md: z.string(),
  rubric_json: z.record(z.unknown()),
  tags: z.array(z.string()).default([]),
  deadline_utc: z.string().datetime(),
  prize_md: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const PatchChallengeSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  brief_md: z.string().optional(),
  rubric_json: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  deadline_utc: z.string().datetime().optional(),
  prize_md: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const GetChallengesQuerySchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
  active: z.enum(['true', 'false']).optional(),
});

/**
 * Submissions
 */
export const CreateSubmissionSchema = z.object({
  challenge_id: z.string().uuid(),
  repo_url: z.string().url().optional(),
  deck_url: z.string().url().optional(),
  demo_url: z.string().url().optional(),
  writeup_md: z.string().optional(),
});

/**
 * Score
 */
export const ScoreSchema = z.object({
  submissionId: z.string().uuid(),
});

/**
 * Judge Lock
 */
export const JudgeLockSchema = z.object({
  submissionId: z.string().uuid(),
  delta_pct: z.number().min(-20).max(20),
  notes_md: z.string().min(10),
});

/**
 * Leaderboard
 */
export const LeaderboardQuerySchema = z.object({
  challenge_id: z.string().uuid(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * Sponsors
 */
export const OrgCreateSchema = z.object({
  org_name: z.string().min(1).max(255),
  verified: z.boolean().default(false),
});

export const OrgAddMemberSchema = z.object({
  profile_id: z.string().uuid(),
  role: z.enum(['owner', 'manager', 'member']),
});

/**
 * User Profile
 */
export const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(255).optional(),
  github_url: z.string().url().regex(/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/, {
    message: 'Must be a valid GitHub profile URL (e.g., https://github.com/username)',
  }).optional(),
  linkedin_url: z.string().url().regex(/^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9_-]+\/?$/, {
    message: 'Must be a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)',
  }).optional(),
  profile_picture_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});
