-- Create table for storing Push API subscriptions
create table if not exists user_push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure unique subscription per user device (optional, but good practice to avoid dupes)
  -- We can use the endpoint as a unique constraint since it's unique per browser profile
  constraint unique_subscription_endpoint unique(user_id, subscription)
);

-- Enable RLS
alter table user_push_subscriptions enable row level security;

-- Create Policies
create policy "Users can insert their own subscriptions"
  on user_push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own subscriptions"
  on user_push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
  on user_push_subscriptions for delete
  using (auth.uid() = user_id);

-- Note: The Cron Job API route will use the SERVICE_ROLE_KEY to bypass these policies
-- and read ALL subscriptions when sending notifications.
