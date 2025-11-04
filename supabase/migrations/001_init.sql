create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  created_at timestamptz default now()
);

create table if not exists identifications (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  ip_hash text,
  sha256 char(64),
  top1 text,
  top1_conf float,
  top3 jsonb,
  provider text,
  latency_ms int,
  input_bytes int,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  customer_id text,
  status text,
  plan text,
  current_period_end timestamptz,
  updated_at timestamptz default now()
);
