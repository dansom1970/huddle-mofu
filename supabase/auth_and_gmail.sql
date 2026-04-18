-- User profiles (maps Supabase user to Nicole/Danny)
create table user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  owner_name text check (owner_name in ('Nicole', 'Danny')),
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;
create policy "users_own_profile" on user_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Gmail OAuth tokens (one row per user)
create table gmail_tokens (
  user_id uuid references auth.users(id) on delete cascade primary key,
  access_token text not null,
  refresh_token text,
  token_expiry timestamptz,
  gmail_email text,
  updated_at timestamptz default now()
);

alter table gmail_tokens enable row level security;
create policy "users_own_tokens" on gmail_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
