const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkChallenges() {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total challenges found:', data?.length || 0);
    console.log('Challenges:', JSON.stringify(data, null, 2));
  }
}

checkChallenges();
