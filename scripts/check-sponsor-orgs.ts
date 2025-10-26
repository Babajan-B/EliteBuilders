#!/usr/bin/env ts-node
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function checkSponsorOrgs() {
  console.log('🔍 Checking Sponsor Orgs Table\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check sponsor_orgs table structure
    const { data: sponsorOrgs, error } = await supabase
      .from('sponsor_orgs')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Error fetching sponsor_orgs:', error);
    } else {
      console.log('✅ Sponsor Orgs found:');
      console.log(JSON.stringify(sponsorOrgs, null, 2));
      
      if (sponsorOrgs && sponsorOrgs.length > 0) {
        console.log('\nTable columns:');
        console.log(Object.keys(sponsorOrgs[0]));
      }
    }

    // Check existing challenges to see what sponsor_org_id they use
    const { data: challenges, error: challengeError } = await supabase
      .from('challenges')
      .select('id, title, sponsor_org_id')
      .limit(1);

    if (!challengeError && challenges && challenges.length > 0) {
      console.log('\n\nExisting challenge sponsor_org_id:');
      console.log(challenges[0]);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

checkSponsorOrgs();
