#!/usr/bin/env ts-node
/**
 * Check Database Schema
 * Queries the actual structure of tables in Supabase
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../lib/supabase-server';

async function checkSchema() {
  console.log('🔍 Checking Database Schema\n');

  const db = supabaseAdmin();

  try {
    // Query to get profiles table structure
    console.log('📋 PROFILES TABLE STRUCTURE:');
    console.log('=' .repeat(80));

    const { data: columns, error } = await db
      .rpc('exec_sql', {
        sql: `
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = 'profiles'
          ORDER BY ordinal_position;
        `
      });

    if (error) {
      // Try alternative method - just select from profiles to see what columns exist
      console.log('Using alternative method (querying actual table)...\n');

      const { data: profiles, error: profileError } = await db
        .from('profiles')
        .select('*')
        .limit(1);

      if (profileError) {
        throw profileError;
      }

      if (profiles && profiles.length > 0) {
        console.log('Columns found in profiles table:');
        Object.keys(profiles[0]).forEach((col, idx) => {
          console.log(`  ${idx + 1}. ${col}: ${typeof profiles[0][col]}`);
        });
      } else {
        console.log('No data in profiles table, checking with select...');

        // Try to select with specific columns based on our assumptions
        const testColumns = [
          'id',
          'email',
          'display_name',
          'role',
          'avatar_url',
          'github_url',
          'linkedin_url',
          'profile_picture_url',
          'created_at',
          'updated_at'
        ];

        console.log('\nTesting which columns exist:');
        for (const col of testColumns) {
          try {
            await db.from('profiles').select(col).limit(0);
            console.log(`  ✅ ${col} - EXISTS`);
          } catch (e) {
            console.log(`  ❌ ${col} - DOES NOT EXIST`);
          }
        }
      }
    } else {
      console.table(columns);
    }

    // Check RLS policies
    console.log('\n📋 ROW LEVEL SECURITY POLICIES:');
    console.log('=' .repeat(80));

    const { data: policies, error: policyError } = await db
      .rpc('exec_sql', {
        sql: `
          SELECT
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies
          WHERE tablename = 'profiles';
        `
      });

    if (policyError) {
      console.log('Could not fetch RLS policies (may need to check manually in Supabase)');
    } else if (policies && policies.length > 0) {
      console.table(policies);
    } else {
      console.log('No RLS policies found on profiles table');
    }

    // Check if RLS is enabled
    console.log('\n📋 RLS STATUS:');
    console.log('=' .repeat(80));

    const { data: rlsStatus, error: rlsError } = await db
      .rpc('exec_sql', {
        sql: `
          SELECT
            tablename,
            rowsecurity
          FROM pg_tables
          WHERE tablename = 'profiles'
          AND schemaname = 'public';
        `
      });

    if (rlsError) {
      console.log('Could not fetch RLS status');
    } else {
      console.log(rlsStatus);
    }

  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
