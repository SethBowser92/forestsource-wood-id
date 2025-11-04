create table if not exists species (
  id text primary key,
  common_name text not null,
  scientific_name text,
  verified boolean not null default false,
  updated_at timestamptz default now()
);

create table if not exists species_aliases (
  alias text primary key,
  species_id text not null references species(id) on delete cascade
);

create or replace view species_verified as
  select id, common_name, scientific_name from species where verified = true;
