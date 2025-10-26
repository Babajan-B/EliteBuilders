#!/usr/bin/env ts-node
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function checkDBStructure() {
  console.log('🔍 Checking Database Structure\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get the existing challenge and its sponsor_org_id
    console.log('1. Checking existing challenge:');
    const { data: challenge } = await supabase
      .from('challenges')
      .select('id, title, sponsor_org_id')
      .limit(1)
      .single();
    
    if (challenge) {
      console.log('   Challenge:', challenge.title);
      console.log('   Sponsor Org ID:', challenge.sponsor_org_id);
      console.log('');
    }

    // Try to get sponsor org with that ID
    console.log('2. Looking for sponsor_orgs table (might not exist):');
    const { data: sponsorOrg, error: sponsorError } = await supabase
      .from('sponsor_orgs')
      .select('*')
      .eq('id', challenge?.sponsor_org_id)
      .maybeSingle();

    if (sponsorError) {
      console.log('   ❌ Error or table does not exist:', sponsorError.message);
    } else if (sponsorOrg) {
      console.log('   ✅ Found sponsor org:');
      console.log('   ', JSON.stringify(sponsorOrg, null, 2));
    } else {
      console.log('   ⚠️  No sponsor org found with that ID');
    }

    // Check all tables to see relationships
    console.log('\n3. Checking if we can query sponsor_orgs at all:');
    const { data: allOrgs, error: allError } = await supabase
      .from('sponsor_orgs')
      .select('*')
      .limit(10);

    if (allError) {
      console.log('   ❌ Table might not exist or no access:', allError.message);
    } else {
      console.log('   ✅ Found', allOrgs?.length || 0, 'sponsor orgs');
      if (allOrgs && allOrgs.length > 0) {
        console.log('   First org:', JSON.stringify(allOrgs[0], null, 2));
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

checkDBStructure();
