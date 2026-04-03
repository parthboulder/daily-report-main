-- Create user_passwords table for custom password management
-- Passwords are bcrypt-hashed; admin can reset without Supabase Auth admin API
CREATE TABLE IF NOT EXISTS user_passwords (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- RLS: only service_role can read/write (edge functions use service_role key)
ALTER TABLE user_passwords ENABLE ROW LEVEL SECURITY;

-- No policies = no access via anon/authenticated keys, only service_role bypasses RLS
