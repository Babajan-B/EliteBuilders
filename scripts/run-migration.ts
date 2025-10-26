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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running database migration for invitations table...');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '005_invitations_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon to execute each statement separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✓ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err);
      }
    }

    console.log('\n✓ Migration completed!');
    console.log('\nNote: If you see errors about missing functions or permissions,');
    console.log('you may need to run this migration manually in the Supabase SQL editor.');
    console.log('You can find the migration file at: supabase/migrations/005_invitations_table.sql');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
