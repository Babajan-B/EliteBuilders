#!/usr/bin/env ts-node
/**
 * Check if signup trigger exists in database
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../lib/supabase-server';

async function checkTrigger() {
  console.log('🔍 Checking Database Status for Signup\n');
  
  const db = supabaseAdmin();

  console.log('📝 Note: Trigger existence cannot be checked via API');
  console.log('   System tables (triggers, functions) require dashboard access');
  console.log('   We can check user/profile status instead.\n');

  // Check users vs profiles
  const { count: userCount } = await db
    .from('auth.users')
    .select('*', { count: 'exact', head: true });

  const { count: profileCount } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  console.log('\n📊 User/Profile Status:');
  console.log(`   Users: ${userCount ?? 0}`);
  console.log(`   Profiles: ${profileCount ?? 0}`);

  if ((userCount ?? 0) > (profileCount ?? 0)) {
    console.log('\n⚠️  WARNING: Some users are missing profiles!');
    console.log('   Run COMPLETE_SIGNUP_FIX_ALL_IN_ONE.sql to fix this.');
  } else if (userCount === profileCount) {
    console.log('   ✅ All users have profiles');
  }

  // RLS policies check (skip - requires dashboard)
  console.log('\n📝 RLS policy check requires dashboard access');

  console.log('\n' + '='.repeat(60));
  if ((userCount ?? 0) > (profileCount ?? 0)) {
    console.log('❌ SIGNUP TRIGGER LIKELY MISSING!');
    console.log('   Users without profiles detected.');
    console.log('\n📋 To fix:');
    console.log('1. Open: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql/new');
    console.log('2. Copy SQL from: COMPLETE_SIGNUP_FIX_ALL_IN_ONE.sql');
    console.log('3. Paste and click RUN in browser');
  } else {
    console.log('✅ User/Profile counts match - trigger may be working');
    console.log('   To verify trigger exists, run CHECK_DATABASE_STATUS.sql in Supabase Dashboard');
  }
  console.log('='.repeat(60));
}

checkTrigger().catch(console.error);

