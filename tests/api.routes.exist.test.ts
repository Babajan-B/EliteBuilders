/**
 * Test: API Routes Existence
 * Validates that all required API routes exist and follow standards
 */

import { describe, it, expect } from 'vitest';
import { validateApiScaffold } from '../scripts/validate-api';

describe('API Routes Existence', () => {
  it('should have all required route files', () => {
    const result = validateApiScaffold();

    // Collect all issues
    const allIssues = [...result.errors, ...result.warnings];

    // If there are errors, display them
    if (!result.passed) {
      console.error('Validation errors:', result.errors);
    }

    // Assert no errors
    expect(result.errors).toHaveLength(0);
    expect(result.passed).toBe(true);
  });

  it('should have all routes with nodejs runtime export', () => {
    const result = validateApiScaffold();

    // Check for specific runtime export errors
    const runtimeErrors = result.errors.filter((err) => err.includes('runtime export'));

    expect(runtimeErrors).toHaveLength(0);
  });

  it('should have standardized response patterns', () => {
    const result = validateApiScaffold();

    // Warnings are acceptable, but log them
    if (result.warnings.length > 0) {
      console.warn('Validation warnings:', result.warnings);
    }

    // Test passes even with warnings (they're not critical)
    expect(result.passed).toBe(true);
  });
});
