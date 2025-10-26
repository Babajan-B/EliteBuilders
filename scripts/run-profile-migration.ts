import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('Running database migration for profiles table...');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_add_profile_fields.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Migration SQL:');
    console.log('---');
    console.log(sql);
    console.log('---\n');

    // Execute the entire SQL as one query using Supabase's query method
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error executing migration:', error);
      console.log('\nAlternative: Copy the SQL above and run it manually in Supabase Dashboard:');
      console.log(`https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql`);
      process.exit(1);
    }

    console.log('✓ Migration completed successfully!');
    console.log('\nThe following changes were made:');
    console.log('- Added github_url column to profiles table');
    console.log('- Added linkedin_url column to profiles table');
    console.log('- Added profile_picture_url column to profiles table');
    console.log('- Enabled Row Level Security on profiles table');
    console.log('- Created RLS policies for viewing and updating profiles');

  } catch (error) {
    console.error('Migration failed:', error);
    console.log('\n🔧 Manual Migration Required:');
    console.log('Please copy the SQL from the migration file and run it manually in Supabase Dashboard:');
    console.log(`File: /Users/jaan/Desktop/Hackathon/supabase/migrations/001_add_profile_fields.sql`);
    console.log('\nSupabase SQL Editor:');
    console.log(`https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql`);
    process.exit(1);
  }
}

runMigration();
