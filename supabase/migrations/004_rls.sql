alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table identifications enable row level security;

create policy profiles_select_self on profiles for select using ( auth.uid() = user_id );
create policy profiles_upsert_self on profiles for insert with check ( auth.uid() = user_id );
create policy profiles_update_self on profiles for update using ( auth.uid() = user_id );

create policy subs_select_self on subscriptions for select using ( auth.uid() = user_id );

create policy ids_select_self on identifications for select using ( auth.uid() = user_id );
create policy ids_insert_self on identifications for insert with check ( auth.uid() = user_id );
