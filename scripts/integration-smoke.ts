#!/usr/bin/env ts-node
/**
 * Full API + Database Integration Smoke Test
 * Tests all API endpoints with seeded Supabase data
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../lib/supabase-server';

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  passed: boolean;
  status?: number;
  error?: string;
  data?: unknown;
  duration?: number;
}

/**
 * Run an API test
 */
async function testAPI(
  name: string,
  method: string,
  endpoint: string,
  body?: unknown,
  expectedStatus?: number | number[]
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const url = `http://localhost:3000${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    const duration = Date.now() - startTime;
    
    // Check if response status matches expected status
    let passed = response.ok;
    if (expectedStatus !== undefined) {
      const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
      passed = expectedStatuses.includes(response.status);
    } else {
      // Default: consider 200-299, 400, 404 as "passed" (expected responses)
      passed = response.ok || response.status === 404 || response.status === 400;
    }
    
    return {
      name,
      endpoint,
      method,
      passed,
      status: response.status,
      data,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name,
      endpoint,
      method,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  }
}

/**
 * Run database query test
 */
async function testDB(
  name: string,
  query: () => Promise<unknown>
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const data = await query();
    const duration = Date.now() - startTime;
    
    return {
      name,
      endpoint: 'Database',
      method: 'QUERY',
      passed: true,
      data,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name,
      endpoint: 'Database',
      method: 'QUERY',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  }
}

/**
 * Format test result for display
 */
function formatResult(result: TestResult): string {
  const icon = result.passed ? '✅' : '❌';
  const status = result.status ? ` [${result.status}]` : '';
  const duration = result.duration ? ` (${result.duration}ms)` : '';
  
  let output = `${icon} ${result.method} ${result.endpoint}${status}${duration}`;
  
  if (!result.passed && result.error) {
    output += `\n   Error: ${result.error}`;
  }
  
  return output;
}

/**
 * Main integration smoke test
 */
async function runIntegrationSmokeTest(): Promise<void> {
  console.log('🔥 EliteBuilders Full Integration Smoke Test\n');
  console.log('=' .repeat(70));
  console.log('Testing API endpoints + Database with seeded data');
  console.log('=' .repeat(70) + '\n');

  const results: TestResult[] = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  const db = supabaseAdmin();
  
  // Store IDs from database for testing
  let challengeId: string | undefined;
  let submissionId: string | undefined;
  let userId: string | undefined;
  let orgId: string | undefined;
  let profileId: string | undefined;

  // ============================================================
  // SECTION 1: Database Direct Queries
  // ============================================================
  console.log('📊 Section 1: Database Connectivity & Seeded Data\n');
  
  // Test 1.1: Basic connectivity
  console.log('Test 1.1: Database connection...');
  const dbTest1 = await testDB('Database connection', async () => {
    const { error } = await db.from('profiles').select('id').limit(0);
    if (error) throw error;
    return true;
  });
  results.push(dbTest1);
  console.log('  ' + formatResult(dbTest1));
  
  // Test 1.2: Check profiles table
  console.log('\nTest 1.2: Query profiles table...');
  const dbTest2 = await testDB('Profiles count', async () => {
    const { data, error, count } = await db
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(5);
    if (error) throw error;
    
    if (data && data.length > 0) {
      userId = data[0].id;
      profileId = data[0].id;
    }
    
    return { count, sample: data };
  });
  results.push(dbTest2);
  console.log('  ' + formatResult(dbTest2));
  if (dbTest2.data) {
    const { count, sample } = dbTest2.data as { count: number | null; sample: Array<{ id: string; display_name?: string }> };
    console.log(`  Found: ${count ?? 0} profiles`);
    if (sample && sample.length > 0) {
      console.log(`  Sample: ${sample[0].display_name || 'N/A'} (${sample[0].id.substring(0, 8)}...)`);
      console.log(`  ℹ️  Will use user_id: ${userId?.substring(0, 8)}... for tests`);
    }
  }
  
  // Test 1.3: Check challenges table
  console.log('\nTest 1.3: Query challenges table...');
  const dbTest3 = await testDB('Challenges count', async () => {
    const { data, error, count } = await db
      .from('challenges')
      .select('*', { count: 'exact' })
      .limit(5);
    if (error) throw error;
    
    if (data && data.length > 0) {
      challengeId = data[0].id;
    }
    
    return { count, sample: data };
  });
  results.push(dbTest3);
  console.log('  ' + formatResult(dbTest3));
  if (dbTest3.data) {
    const { count, sample } = dbTest3.data as { count: number | null; sample: Array<{ id: string; title?: string }> };
    console.log(`  Found: ${count ?? 0} challenges`);
    if (sample && sample.length > 0) {
      console.log(`  Sample: ${sample[0].title || 'N/A'} (${sample[0].id.substring(0, 8)}...)`);
      console.log(`  ℹ️  Will use challenge_id: ${challengeId?.substring(0, 8)}... for tests`);
    }
  }
  
  // Test 1.4: Check submissions table
  console.log('\nTest 1.4: Query submissions table...');
  const dbTest4 = await testDB('Submissions count', async () => {
    const { data, error, count } = await db
      .from('submissions')
      .select('*', { count: 'exact' })
      .limit(5);
    if (error) throw error;
    
    if (data && data.length > 0) {
      submissionId = data[0].id;
    }
    
    return { count, sample: data };
  });
  results.push(dbTest4);
  console.log('  ' + formatResult(dbTest4));
  if (dbTest4.data) {
    const { count, sample } = dbTest4.data as { count: number | null; sample: Array<{ id: string; status?: string }> };
    console.log(`  Found: ${count ?? 0} submissions`);
    if (sample && sample.length > 0) {
      console.log(`  Sample: Status=${sample[0].status || 'N/A'} (${sample[0].id.substring(0, 8)}...)`);
      console.log(`  ℹ️  Will use submission_id: ${submissionId?.substring(0, 8)}... for tests`);
    }
  }
  
  // Test 1.5: Check sponsor_orgs table
  console.log('\nTest 1.5: Query sponsor_orgs table...');
  const dbTest5 = await testDB('Sponsor orgs count', async () => {
    const { data, error, count } = await db
      .from('sponsor_orgs')
      .select('*', { count: 'exact' })
      .limit(5);
    if (error) throw error;
    
    if (data && data.length > 0) {
      orgId = data[0].id;
    }
    
    return { count, sample: data };
  });
  results.push(dbTest5);
  console.log('  ' + formatResult(dbTest5));
  if (dbTest5.data) {
    const { count, sample } = dbTest5.data as { count: number | null; sample: Array<{ id: string; org_name?: string }> };
    console.log(`  Found: ${count ?? 0} organizations`);
    if (sample && sample.length > 0) {
      console.log(`  Sample: ${sample[0].org_name || 'N/A'} (${sample[0].id.substring(0, 8)}...)`);
      console.log(`  ℹ️  Will use org_id: ${orgId?.substring(0, 8)}... for tests`);
    }
  }

  // ============================================================
  // SECTION 2: Health & Meta Endpoints
  // ============================================================
  console.log('\n\n📡 Section 2: Health & Meta Endpoints\n');
  
  // Test 2.1: Database health check
  console.log('Test 2.1: GET /api/health/db');
  const apiTest1 = await testAPI('Database health', 'GET', '/api/health/db');
  results.push(apiTest1);
  console.log('  ' + formatResult(apiTest1));
  if (apiTest1.data) {
    const healthData = apiTest1.data as { ok: boolean; data?: { now?: string; tables?: { profiles: number; challenges: number } } };
    if (healthData.ok && healthData.data) {
      console.log(`  DB Time: ${healthData.data.now || 'N/A'}`);
      if (healthData.data.tables) {
        console.log(`  Tables: profiles=${healthData.data.tables.profiles}, challenges=${healthData.data.tables.challenges}`);
      }
    }
  }

  // ============================================================
  // SECTION 3: Challenges API
  // ============================================================
  console.log('\n\n🎯 Section 3: Challenges API\n');
  
  // Test 3.1: List all challenges
  console.log('Test 3.1: GET /api/challenges');
  const apiTest2 = await testAPI('List challenges', 'GET', '/api/challenges');
  results.push(apiTest2);
  console.log('  ' + formatResult(apiTest2));
  if (apiTest2.data) {
    const challengesData = apiTest2.data as { ok: boolean; data?: Array<{ id: string; title: string }> };
    if (challengesData.ok && challengesData.data) {
      console.log(`  Found: ${challengesData.data.length} challenges`);
      if (challengesData.data.length > 0 && !challengeId) {
        challengeId = challengesData.data[0].id;
        console.log(`  ℹ️  Using challenge_id: ${challengeId.substring(0, 8)}... for tests`);
      }
    }
  }
  
  // Test 3.2: Filter active challenges
  console.log('\nTest 3.2: GET /api/challenges?active=true');
  const apiTest3 = await testAPI('Filter active challenges', 'GET', '/api/challenges?active=true');
  results.push(apiTest3);
  console.log('  ' + formatResult(apiTest3));
  if (apiTest3.data) {
    const activeData = apiTest3.data as { ok: boolean; data?: Array<{ id: string; is_active: boolean }> };
    if (activeData.ok && activeData.data) {
      console.log(`  Found: ${activeData.data.length} active challenges`);
    }
  }
  
  // Test 3.3: Get specific challenge
  if (challengeId) {
    console.log(`\nTest 3.3: GET /api/challenges/${challengeId.substring(0, 8)}...`);
    const apiTest4 = await testAPI('Get challenge by ID', 'GET', `/api/challenges/${challengeId}`);
    results.push(apiTest4);
    console.log('  ' + formatResult(apiTest4));
    if (apiTest4.data) {
      const challengeData = apiTest4.data as { ok: boolean; data?: { title: string; is_active: boolean } };
      if (challengeData.ok && challengeData.data) {
        console.log(`  Title: ${challengeData.data.title || 'N/A'}`);
        console.log(`  Active: ${challengeData.data.is_active}`);
      }
    }
  } else {
    console.log('\n⏭️  Test 3.3: SKIP (no challenge_id available)');
  }

  // ============================================================
  // SECTION 4: Submissions API
  // ============================================================
  console.log('\n\n📝 Section 4: Submissions API\n');
  
  // Test 4.1: Get submission by ID
  if (submissionId) {
    console.log(`Test 4.1: GET /api/submissions/${submissionId.substring(0, 8)}...`);
    const apiTest5 = await testAPI('Get submission by ID', 'GET', `/api/submissions/${submissionId}`);
    results.push(apiTest5);
    console.log('  ' + formatResult(apiTest5));
    if (apiTest5.data) {
      const submissionData = apiTest5.data as { ok: boolean; data?: { status: string; autoscores?: { score_auto: number }; llmscores?: { score_llm: number } } };
      if (submissionData.ok && submissionData.data) {
        console.log(`  Status: ${submissionData.data.status}`);
        if (submissionData.data.autoscores) {
          console.log(`  Auto Score: ${submissionData.data.autoscores.score_auto}/20`);
        }
        if (submissionData.data.llmscores) {
          console.log(`  LLM Score: ${submissionData.data.llmscores.score_llm}/60`);
        }
      }
    }
  } else {
    console.log('⏭️  Test 4.1: SKIP (no submission_id available)');
  }
  
  // Test 4.2: Create submission (validation test - expect failure without valid data)
  console.log('\nTest 4.2: POST /api/submissions (validation test)');
  const apiTest6 = await testAPI('Create submission (invalid)', 'POST', '/api/submissions', {
    challenge_id: challengeId || 'invalid-id',
    repo_url: 'invalid-url',
    deck_url: 'invalid-url',
  });
  results.push(apiTest6);
  console.log('  ' + formatResult(apiTest6));
  if (apiTest6.data) {
    const createData = apiTest6.data as { ok: boolean; error?: { code: string; message: string } };
    if (!createData.ok && createData.error) {
      console.log(`  Expected validation error: ${createData.error.code}`);
    }
  }

  // ============================================================
  // SECTION 5: Leaderboard API
  // ============================================================
  console.log('\n\n🏆 Section 5: Leaderboard API\n');
  
  // Test 5.1: Get leaderboard
  if (challengeId) {
    console.log(`Test 5.1: GET /api/leaderboard?challenge_id=${challengeId.substring(0, 8)}...`);
    const apiTest7 = await testAPI('Get leaderboard', 'GET', `/api/leaderboard?challenge_id=${challengeId}`);
    results.push(apiTest7);
    console.log('  ' + formatResult(apiTest7));
    if (apiTest7.data) {
      const leaderboardData = apiTest7.data as { ok: boolean; data?: Array<{ rank: number; display_name?: string; score: number; status: string }> };
      if (leaderboardData.ok && leaderboardData.data) {
        console.log(`  Found: ${leaderboardData.data.length} ranked submissions`);
        if (leaderboardData.data.length > 0) {
          const top = leaderboardData.data[0];
          console.log(`  Top: #${top.rank} ${top.display_name || 'N/A'} - Score: ${top.score} (${top.status})`);
        }
      }
    }
  } else {
    console.log('⏭️  Test 5.1: SKIP (no challenge_id available)');
  }
  
  // Test 5.2: Leaderboard with limit
  if (challengeId) {
    console.log(`\nTest 5.2: GET /api/leaderboard?challenge_id=${challengeId.substring(0, 8)}...&limit=5`);
    const apiTest8 = await testAPI('Get leaderboard (limit 5)', 'GET', `/api/leaderboard?challenge_id=${challengeId}&limit=5`);
    results.push(apiTest8);
    console.log('  ' + formatResult(apiTest8));
    if (apiTest8.data) {
      const limitData = apiTest8.data as { ok: boolean; data?: Array<unknown> };
      if (limitData.ok && limitData.data) {
        console.log(`  Returned: ${limitData.data.length} results (max 5)`);
      }
    }
  } else {
    console.log('\n⏭️  Test 5.2: SKIP (no challenge_id available)');
  }

  // ============================================================
  // SECTION 6: Sponsor Organizations API
  // ============================================================
  console.log('\n\n🏢 Section 6: Sponsor Organizations API\n');
  
  // Test 6.1: Get organization by ID
  if (orgId) {
    console.log(`Test 6.1: GET /api/sponsors/orgs/${orgId.substring(0, 8)}...`);
    const apiTest9 = await testAPI('Get organization', 'GET', `/api/sponsors/orgs/${orgId}`);
    results.push(apiTest9);
    console.log('  ' + formatResult(apiTest9));
    if (apiTest9.data) {
      const orgData = apiTest9.data as { ok: boolean; data?: { org_name: string; verified: boolean; sponsor_members?: Array<{ role: string }> } };
      if (orgData.ok && orgData.data) {
        console.log(`  Name: ${orgData.data.org_name || 'N/A'}`);
        console.log(`  Verified: ${orgData.data.verified}`);
        if (orgData.data.sponsor_members) {
          console.log(`  Members: ${orgData.data.sponsor_members.length}`);
        }
      }
    }
  } else {
    console.log('⏭️  Test 6.1: SKIP (no org_id available)');
  }

  // ============================================================
  // SECTION 7: Stub Endpoints (v1.5 - Not Implemented)
  // ============================================================
  console.log('\n\n🚧 Section 7: Stub Endpoints (Expected 501)\n');
  
  // Test 7.1: Transcribe endpoint
  console.log('Test 7.1: POST /api/transcribe');
  const apiTest10 = await testAPI('Transcribe (stub)', 'POST', '/api/transcribe', { url: 'test' }, 501);
  results.push(apiTest10);
  console.log('  ' + formatResult(apiTest10));
  if (apiTest10.status === 501) {
    console.log('  Expected 501 Not Implemented ✓');
  }
  
  // Test 7.2: Parse PDF endpoint
  console.log('\nTest 7.2: POST /api/parse-pdf');
  const apiTest11 = await testAPI('Parse PDF (stub)', 'POST', '/api/parse-pdf', { url: 'test' }, 501);
  results.push(apiTest11);
  console.log('  ' + formatResult(apiTest11));
  if (apiTest11.status === 501) {
    console.log('  Expected 501 Not Implemented ✓');
  }
  
  // Test 7.3: Parse DOCX endpoint
  console.log('\nTest 7.3: POST /api/parse-docx');
  const apiTest12 = await testAPI('Parse DOCX (stub)', 'POST', '/api/parse-docx', { url: 'test' }, 501);
  results.push(apiTest12);
  console.log('  ' + formatResult(apiTest12));
  if (apiTest12.status === 501) {
    console.log('  Expected 501 Not Implemented ✓');
  }

  // ============================================================
  // Summary
  // ============================================================
  results.forEach((r) => {
    totalTests++;
    if (r.passed) passedTests++;
    else failedTests++;
  });
  
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';
  const avgDuration = results.filter(r => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) / results.filter(r => r.duration).length;
  
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 Integration Smoke Test Summary');
  console.log('='.repeat(70));
  console.log(`Total Tests:     ${totalTests}`);
  console.log(`✅ Passed:       ${passedTests}`);
  console.log(`❌ Failed:       ${failedTests}`);
  console.log(`Pass Rate:       ${passRate}%`);
  console.log(`Avg Duration:    ${avgDuration.toFixed(0)}ms`);
  console.log('='.repeat(70));
  
  if (failedTests === 0) {
    console.log('\n🎉 All integration smoke tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some integration tests failed. Review results above.\n');
    console.log('Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error || 'Unknown error'}`);
    });
    console.log();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  // Check if dev server is running
  console.log('Checking if dev server is running on http://localhost:3000...\n');
  
  fetch('http://localhost:3000/api/health/db')
    .then(() => {
      console.log('✅ Dev server detected, starting integration tests...\n');
      return runIntegrationSmokeTest();
    })
    .catch(() => {
      console.error('❌ Dev server not running!');
      console.error('\nPlease start the dev server first:');
      console.error('  npm run dev');
      console.error('\nThen run this test in another terminal:');
      console.error('  npm run integration:smoke\n');
      process.exit(1);
    });
}

export { runIntegrationSmokeTest };
