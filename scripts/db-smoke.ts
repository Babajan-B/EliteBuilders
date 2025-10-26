#!/usr/bin/env ts-node
/**
 * Database Connectivity Smoke Test
 * Verifies database connection and basic table access
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../lib/supabase-server';

interface SmokeTestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Redact URL for safe logging
 */
function redactUrl(url: string | undefined): string {
  if (!url) return '***';
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}/***`;
  } catch {
    return '***';
  }
}

/**
 * Run a smoke test check
 */
async function runCheck(
  name: string,
  fn: () => Promise<unknown>
): Promise<SmokeTestResult> {
  try {
    const data = await fn();
    return { name, passed: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { name, passed: false, error: errorMessage };
  }
}

/**
 * Main smoke test execution
 */
async function runSmokeTests(): Promise<void> {
  console.log('🔍 Running Database Connectivity Smoke Tests\n');
  console.log(`Database URL: ${redactUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)}\n`);

  const results: SmokeTestResult[] = [];
  let allPassed = true;

  try {
    const db = supabaseAdmin();

    // Test 1: Basic connectivity - SELECT 1
    console.log('Test 1: Basic connectivity (SELECT 1)...');
    const result1 = await runCheck('Basic connectivity', async () => {
      const { data, error } = await db.rpc('sql', { query: 'SELECT 1 as value' }).single();
      if (error) throw error;
      return data;
    });

    // Fallback if RPC not available - use a simple query
    if (!result1.passed) {
      const fallback = await runCheck('Basic connectivity (fallback)', async () => {
        const { error } = await db.from('profiles').select('id').limit(0);
        if (error) throw error;
        return true;
      });
      results.push(fallback);
      console.log(fallback.passed ? '  ✅ PASS' : `  ❌ FAIL: ${fallback.error}`);
      allPassed = allPassed && fallback.passed;
    } else {
      results.push(result1);
      console.log('  ✅ PASS');
    }

    // Test 2: Count profiles
    console.log('Test 2: Count profiles table...');
    const result2 = await runCheck('Count profiles', async () => {
      const { count, error } = await db
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return { count };
    });
    results.push(result2);
    if (result2.passed) {
      const count = (result2.data as { count: number | null }).count ?? 0;
      console.log(`  ✅ PASS (${count} rows)`);
    } else {
      console.log(`  ❌ FAIL: ${result2.error}`);
      allPassed = false;
    }

    // Test 3: Count challenges
    console.log('Test 3: Count challenges table...');
    const result3 = await runCheck('Count challenges', async () => {
      const { count, error } = await db
        .from('challenges')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return { count };
    });
    results.push(result3);
    if (result3.passed) {
      const count = (result3.data as { count: number | null }).count ?? 0;
      console.log(`  ✅ PASS (${count} rows)`);
    } else {
      console.log(`  ❌ FAIL: ${result3.error}`);
      allPassed = false;
    }

    // Test 4: Query challenges ordered by deadline
    console.log('Test 4: Query challenges (ORDER BY deadline_utc LIMIT 3)...');
    const result4 = await runCheck('Query challenges', async () => {
      const { data, error } = await db
        .from('challenges')
        .select('id, title, deadline_utc')
        .order('deadline_utc', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    });
    results.push(result4);
    if (result4.passed) {
      const rows = result4.data as Array<{ id: string; title: string; deadline_utc: string }>;
      console.log(`  ✅ PASS (${rows.length} rows returned)`);
      if (rows.length > 0) {
        rows.forEach((row, idx) => {
          console.log(`    ${idx + 1}. ${row.title} (deadline: ${row.deadline_utc})`);
        });
      }
    } else {
      console.log(`  ❌ FAIL: ${result4.error}`);
      allPassed = false;
    }

    // Test 5: Query leaderboard view (optional)
    console.log('Test 5: Query leaderboard view (LIMIT 3)...');
    const result5 = await runCheck('Query leaderboard', async () => {
      const { data, error } = await db
        .from('leaderboard')
        .select('*')
        .limit(3);
      if (error) {
        // Check if error is because view doesn't exist
        if (error.message.includes('does not exist') || error.code === '42P01') {
          throw new Error('VIEW_NOT_FOUND');
        }
        throw error;
      }
      return data;
    });

    if (result5.error === 'VIEW_NOT_FOUND') {
      console.log('  ⏭️  SKIP: View not found (expected in early setup)');
    } else if (result5.passed) {
      const rows = result5.data as Array<Record<string, unknown>>;
      console.log(`  ✅ PASS (${rows.length} rows returned)`);
    } else {
      console.log(`  ⚠️  WARN: ${result5.error}`);
      // Don't fail on leaderboard view - it's optional
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`  Total tests: ${results.length}`);
    console.log(`  Passed: ${results.filter((r) => r.passed).length}`);
    console.log(`  Failed: ${results.filter((r) => !r.passed).length}`);
    console.log('='.repeat(60) + '\n');

    if (allPassed) {
      console.log('✅ All critical database smoke tests passed!\n');
      process.exit(0);
    } else {
      console.log('❌ Some database smoke tests failed!\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during smoke tests:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
    } else {
      console.error(`  ${String(error)}`);
    }
    console.log();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runSmokeTests().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export { runSmokeTests };
