// Adds social handle columns + directory opt-in to profiles table
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

const sql = `
  ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS discord_handle   text,
    ADD COLUMN IF NOT EXISTS twitter_handle   text,
    ADD COLUMN IF NOT EXISTS github_handle    text,
    ADD COLUMN IF NOT EXISTS bio_updated      text,
    ADD COLUMN IF NOT EXISTS show_in_directory boolean DEFAULT false;
`

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
  },
  body: JSON.stringify({ sql }),
})

if (res.ok) {
  console.log('Migration succeeded.')
} else {
  // exec_sql RPC may not exist — print the SQL for manual run
  console.log('Auto-migration not available. Run this SQL in your Supabase SQL editor:\n')
  console.log(sql)
}
