#!/usr/bin/env ts-node
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function checkSponsorProfile() {
  console.log('🔍 Checking Sponsor Profiles\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check for existing sponsor profile
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '55555555-5555-5555-5555-555555555555');

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    if (profiles && profiles.length > 0) {
      console.log('✅ Found existing sponsor profile:');
      console.log(JSON.stringify(profiles[0], null, 2));
    } else {
      console.log('❌ Sponsor profile not found');
      
      // Check all profiles with sponsor role
      const { data: allSponsors } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'sponsor');
      
      console.log('\nAll sponsor profiles:');
      console.log(JSON.stringify(allSponsors, null, 2));
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

checkSponsorProfile();
