#!/usr/bin/env ts-node
/**
 * Verify RLS Policies
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function verifyPolicies() {
  console.log('🔍 Verifying RLS Policies\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check if RLS is enabled
    console.log('📋 Checking RLS Status:');
    console.log('='.repeat(80));

    const { data: tables, error: tableError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .in('tablename', ['profiles', 'invitations'])
      .eq('schemaname', 'public');

    if (tableError) {
      console.log('Using raw query...');
      // Try with raw SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT tablename, rowsecurity
          FROM pg_tables
          WHERE tablename IN ('profiles', 'invitations')
          AND schemaname = 'public';
        `
      });

      if (error) {
        console.log('Could not check RLS status:', error.message);
      } else {
        console.log('Tables:', data);
      }
    } else {
      console.table(tables);
    }

    // Check policies on profiles
    console.log('\n📋 Policies on PROFILES table:');
    console.log('='.repeat(80));

    const { data: profilePolicies, error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          SUBSTRING(qual::text, 1, 100) as qual_preview,
          SUBSTRING(with_check::text, 1, 100) as with_check_preview
        FROM pg_policies
        WHERE tablename = 'profiles'
        ORDER BY policyname;
      `
    });

    if (policyError) {
      console.log('Error fetching policies:', policyError.message);
    } else {
      console.log('\nFound', profilePolicies?.length || 0, 'policies:');
      profilePolicies?.forEach((policy: any, idx: number) => {
        console.log(`\n${idx + 1}. ${policy.policyname}`);
        console.log(`   Command: ${policy.cmd}`);
        console.log(`   Roles: ${policy.roles}`);
        console.log(`   Using (qual): ${policy.qual_preview}`);
        console.log(`   With Check: ${policy.with_check_preview}`);
      });
    }

    // Test INSERT with authenticated user simulation
    console.log('\n\n📋 Testing Profile Insert with Service Role:');
    console.log('='.repeat(80));

    const testId = '00000000-0000-0000-0000-999999999999';

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        email: 'test-verify@example.com',
        display_name: 'Test Verify User',
        role: 'builder',
        github_url: 'https://github.com/testverify',
        linkedin_url: 'https://linkedin.com/in/testverify',
        profile_picture_url: 'https://example.com/pic.jpg'
      });

    if (insertError) {
      console.log('❌ Insert with service role FAILED:');
      console.log('   Message:', insertError.message);
      console.log('   Code:', insertError.code);
      console.log('   Details:', insertError.details);
      console.log('   Hint:', insertError.hint);
    } else {
      console.log('✅ Insert with service role SUCCEEDED');
      // Clean up
      await supabase.from('profiles').delete().eq('id', testId);
      console.log('   (cleaned up test data)');
    }

    // Test with anon key (like frontend)
    console.log('\n\n📋 Testing Profile Insert with Anon Key (like frontend):');
    console.log('='.repeat(80));

    const anonSupabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const testId2 = '00000000-0000-0000-0000-888888888888';

    const { error: anonError } = await anonSupabase
      .from('profiles')
      .insert({
        id: testId2,
        email: 'test-anon@example.com',
        display_name: 'Test Anon User',
        role: 'builder',
        github_url: 'https://github.com/testanon',
        linkedin_url: 'https://linkedin.com/in/testanon',
        profile_picture_url: 'https://example.com/pic2.jpg'
      });

    if (anonError) {
      console.log('❌ Insert with anon key FAILED (expected - RLS blocks unauthenticated):');
      console.log('   Message:', anonError.message);
      console.log('   Code:', anonError.code);
    } else {
      console.log('✅ Insert with anon key SUCCEEDED (unexpected!)');
      await supabase.from('profiles').delete().eq('id', testId2);
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('DIAGNOSIS:');
    console.log('='.repeat(80));
    console.log('The issue is that during signup, the user session is not yet');
    console.log('authenticated when we try to insert the profile.');
    console.log('\nSOLUTION: We need to either:');
    console.log('1. Use a database trigger to auto-create profiles');
    console.log('2. Create profile via backend API with service role');
    console.log('3. Wait for session to be established before inserting');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

verifyPolicies();
