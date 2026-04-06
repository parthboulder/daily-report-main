// One-time script to seed projects into Supabase
// Run with: npx tsx scripts/seed-projects.ts

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vnmpumcvitidffgmyeyo.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_KEY) {
  console.error('Set VITE_SUPABASE_ANON_KEY env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Project seed data with full names and codes
const PROJECTS = [
  { name: 'TownePlace Suites – Jackson', code: 'TPSJ' },
  { name: 'Staybridge Suites – Jackson', code: 'SYBJ' },
  { name: 'Candlewood Suites – Jackson', code: 'CWSJ' },
  { name: 'Holiday Inn Express – Stephenville', code: 'HIS' },
  { name: 'Hampton Inn – Baton Rouge', code: 'HIBR' },
  { name: 'Homewood Suites – Gonzales', code: 'HWSG' },
]

async function seed() {
  for (const project of PROJECTS) {
    // Upsert by code to avoid duplicates
    const { error } = await supabase
      .from('projects')
      .upsert(project, { onConflict: 'code' })
    if (error) {
      console.error(`Failed to insert ${project.code}:`, error.message)
    } else {
      console.log(`✓ ${project.code} - ${project.name}`)
    }
  }
  console.log('\nDone!')
}

seed()
