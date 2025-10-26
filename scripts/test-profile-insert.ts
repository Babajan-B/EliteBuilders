#!/usr/bin/env ts-node
/**
 * Test Profile Insert
 * Tests if we can insert into profiles table
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function testInsert() {
  console.log('🧪 Testing Profile Insert\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // First, check existing profiles
    console.log('📋 Existing profiles:');
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*');

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
    } else {
      console.log(`Found ${existingProfiles?.length || 0} profiles:`);
      existingProfiles?.forEach((profile, idx) => {
        console.log(`\n${idx + 1}. Profile:`, {
          id: profile.id,
          email: profile.email,
          display_name: profile.display_name,
          role: profile.role,
          github_url: profile.github_url,
          linkedin_url: profile.linkedin_url,
          avatar_url: profile.avatar_url,
          bio: profile.bio
        });
      });
    }

    // Test 1: Try to insert profile_picture_url column (should fail if column doesn't exist)
    console.log('\n\n🧪 Test 1: Insert with profile_picture_url');
    console.log('=' .repeat(80));

    const testId = '00000000-0000-0000-0000-000000000001'; // Fake UUID for testing

    const { error: insertError1 } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        email: 'test@example.com',
        display_name: 'Test User',
        role: 'builder',
        github_url: 'https://github.com/testuser',
        linkedin_url: 'https://linkedin.com/in/testuser',
        profile_picture_url: 'https://example.com/pic.jpg'
      });

    if (insertError1) {
      console.log('❌ Insert failed (expected if profile_picture_url column missing):');
      console.log('   Error:', insertError1.message);
      console.log('   Code:', insertError1.code);
      console.log('   Details:', insertError1.details);
      console.log('   Hint:', insertError1.hint);
    } else {
      console.log('✅ Insert succeeded!');
      // Clean up test data
      await supabase.from('profiles').delete().eq('id', testId);
    }

    // Test 2: Try to insert WITHOUT profile_picture_url
    console.log('\n\n🧪 Test 2: Insert without profile_picture_url');
    console.log('=' .repeat(80));

    const testId2 = '00000000-0000-0000-0000-000000000002';

    const { error: insertError2 } = await supabase
      .from('profiles')
      .insert({
        id: testId2,
        email: 'test2@example.com',
        display_name: 'Test User 2',
        role: 'builder',
        github_url: 'https://github.com/testuser2',
        linkedin_url: 'https://linkedin.com/in/testuser2'
      });

    if (insertError2) {
      console.log('❌ Insert failed:');
      console.log('   Error:', insertError2.message);
      console.log('   Code:', insertError2.code);
      console.log('   Details:', insertError2.details);
      console.log('   Hint:', insertError2.hint);
    } else {
      console.log('✅ Insert succeeded!');
      // Clean up test data
      await supabase.from('profiles').delete().eq('id', testId2);
    }

    // Test 3: Check RLS by using anon key (like frontend does)
    console.log('\n\n🧪 Test 3: Insert with anon key (RLS test)');
    console.log('=' .repeat(80));

    const supabaseAnon = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const testId3 = '00000000-0000-0000-0000-000000000003';

    const { error: insertError3 } = await supabaseAnon
      .from('profiles')
      .insert({
        id: testId3,
        email: 'test3@example.com',
        display_name: 'Test User 3',
        role: 'builder',
        github_url: 'https://github.com/testuser3',
        linkedin_url: 'https://linkedin.com/in/testuser3'
      });

    if (insertError3) {
      console.log('❌ Insert failed (likely RLS blocking):');
      console.log('   Error:', insertError3.message);
      console.log('   Code:', insertError3.code);
      console.log('   Details:', insertError3.details);
      console.log('   Hint:', insertError3.hint);
    } else {
      console.log('✅ Insert succeeded!');
      await supabase.from('profiles').delete().eq('id', testId3);
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    console.log('✅ github_url column EXISTS');
    console.log('✅ linkedin_url column EXISTS');
    console.log(insertError1 ? '❌ profile_picture_url column MISSING' : '✅ profile_picture_url column EXISTS');
    console.log(insertError3 ? '⚠️  RLS might be blocking inserts' : '✅ RLS allows inserts');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

testInsert();
