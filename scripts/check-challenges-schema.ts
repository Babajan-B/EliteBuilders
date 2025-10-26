#!/usr/bin/env ts-node
/**
 * Check challenges table schema
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function checkChallengesSchema() {
  console.log('🔍 Checking Challenges Table Schema\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get a sample challenge to see the schema
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching challenges:', error);
      return;
    }

    if (challenges && challenges.length > 0) {
      console.log('Challenges table columns:');
      console.log(Object.keys(challenges[0]));
      console.log('\nSample challenge:');
      console.log(JSON.stringify(challenges[0], null, 2));
    } else {
      console.log('No challenges found in table');
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

checkChallengesSchema();
