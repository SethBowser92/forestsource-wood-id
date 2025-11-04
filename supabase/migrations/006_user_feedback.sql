create table if not exists user_feedback (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  identification_id bigint references identifications(id) on delete set null,
  sha256 char(64) not null,
  was_correct boolean not null,
  correct_species_id text references species(id) on delete set null,
  notes text,
  created_at timestamptz default now(),
  unique (user_id, sha256)
);

alter table user_feedback enable row level security;

create policy user_feedback_insert_self on user_feedback for insert to authenticated with check (auth.uid() = user_id);
create policy user_feedback_select_self on user_feedback for select to authenticated using (auth.uid() = user_id);
