#!/usr/bin/env ts-node
/**
 * Check all users and their profiles
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function checkUserProfiles() {
  console.log('🔍 Checking All Users and Profiles\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    console.log(`Found ${authUsers.users.length} users in auth.users:\n`);

    // Get all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return;
    }

    console.log(`Found ${profiles?.length || 0} profiles in profiles table:\n`);

    // Check each user
    for (const user of authUsers.users) {
      const profile = profiles?.find(p => p.id === user.id);

      console.log('─'.repeat(80));
      console.log(`User: ${user.email}`);
      console.log(`  Auth ID: ${user.id}`);
      console.log(`  Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`  Metadata:`, user.user_metadata);

      if (profile) {
        console.log(`  ✅ Profile EXISTS:`);
        console.log(`     display_name: ${profile.display_name}`);
        console.log(`     role: ${profile.role}`);
        console.log(`     github_url: ${profile.github_url || 'null'}`);
        console.log(`     linkedin_url: ${profile.linkedin_url || 'null'}`);
        console.log(`     profile_picture_url: ${profile.profile_picture_url || 'null'}`);
      } else {
        console.log(`  ❌ Profile MISSING!`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log(`  Total Users: ${authUsers.users.length}`);
    console.log(`  Total Profiles: ${profiles?.length || 0}`);
    console.log(`  Missing Profiles: ${authUsers.users.length - (profiles?.length || 0)}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

checkUserProfiles();
