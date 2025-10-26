#!/usr/bin/env ts-node
/**
 * API Scaffold Validation Script
 * Verifies that all required API routes exist and follow standards
 */

import fs from 'fs';
import path from 'path';

// Required API route files
const REQUIRED_ROUTES = [
  'challenges/route.ts',
  'challenges/[id]/route.ts',
  'submissions/route.ts',
  'submissions/[id]/route.ts',
  'score/route.ts',
  'leaderboard/route.ts',
  'judge/lock/route.ts',
  'sponsors/orgs/route.ts',
  'sponsors/orgs/[orgId]/route.ts',
  'sponsors/orgs/[orgId]/members/route.ts',
  'sponsors/orgs/[orgId]/members/[profileId]/route.ts',
  'transcribe/route.ts',
  'parse-pdf/route.ts',
  'parse-docx/route.ts',
];

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate API scaffold
 */
export function validateApiScaffold(): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  const apiDir = path.join(process.cwd(), 'app', 'api');

  console.log('🔍 Validating API scaffold...\n');

  // Check if app/api directory exists
  if (!fs.existsSync(apiDir)) {
    result.passed = false;
    result.errors.push('app/api directory does not exist');
    return result;
  }

  // Validate each required route
  for (const routePath of REQUIRED_ROUTES) {
    const fullPath = path.join(apiDir, routePath);
    const displayPath = `app/api/${routePath}`;

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      result.passed = false;
      result.errors.push(`❌ Missing: ${displayPath}`);
      continue;
    }

    console.log(`✓ Found: ${displayPath}`);

    // Read file content
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Check for runtime export
    if (!content.includes("export const runtime = 'nodejs'")) {
      result.passed = false;
      result.errors.push(`❌ Missing runtime export in: ${displayPath}`);
    }

    // Check for standardized response patterns
    // The actual implementation uses success() and error() from lib/errors.ts
    // Also check for ok() and fail() which are aliases
    const hasSuccessResponse =
      content.includes('successResponse') || 
      content.includes('success(') || 
      content.includes('ok(');
    const hasErrorResponse = 
      content.includes('errorResponse') || 
      content.includes('error(') || 
      content.includes('fail(');

    if (!hasSuccessResponse) {
      result.warnings.push(
        `⚠️  No success response helper (success/ok/successResponse) found in: ${displayPath}`
      );
    }

    if (!hasErrorResponse) {
      result.warnings.push(
        `⚠️  No error response helper (error/fail/errorResponse) found in: ${displayPath}`
      );
    }
  }

  return result;
}

/**
 * Main execution
 */
if (require.main === module) {
  try {
    const result = validateApiScaffold();

    console.log('\n' + '='.repeat(60));

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((warning) => console.log(`  ${warning}`));
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error) => console.log(`  ${error}`));
    }

    console.log('\n' + '='.repeat(60));

    if (result.passed) {
      console.log('\n✅ API scaffold validation passed!\n');
      process.exit(0);
    } else {
      console.log('\n❌ API scaffold validation failed!\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation script error:', error);
    process.exit(1);
  }
}
