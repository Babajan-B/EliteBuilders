#!/usr/bin/env ts-node
/**
 * Check submissions table schema
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function checkSubmissionsSchema() {
  console.log('🔍 Checking Submissions Table Schema\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get a sample submission to see the schema
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching submissions:', error);
      return;
    }

    if (submissions && submissions.length > 0) {
      console.log('Submissions table columns:');
      console.log(Object.keys(submissions[0]));
      console.log('\nSample submission:');
      console.log(JSON.stringify(submissions[0], null, 2));
    } else {
      console.log('No submissions found in table');
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

checkSubmissionsSchema();
