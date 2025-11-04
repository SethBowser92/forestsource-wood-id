create table if not exists public.species_images (
  id                bigserial primary key,
  species_id        text not null references public.species(id) on delete cascade,
  image_type        text not null check (image_type in ('thumbnail','banner','wood_grain','endgrain','tree','leaves','product')),
  storage_path      text not null,
  cdn_url           text,
  alt_text          text,
  caption           text,
  credit            text,
  source_url        text,
  license           text,
  width             int,
  height            int,
  size_bytes        int,
  exif              jsonb,
  sha256            char(64),
  is_primary        boolean not null default false,
  sort              int not null default 0,
  is_public         boolean not null default true,
  verified          boolean not null default false,
  moderation_status text not null default 'approved' check (moderation_status in ('approved','pending','rejected')),
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists ux_species_thumbnail on public.species_images (species_id) where image_type = 'thumbnail';
create unique index if not exists ux_species_banner on public.species_images (species_id) where image_type = 'banner';
create unique index if not exists ux_species_type_primary on public.species_images (species_id, image_type) where is_primary = true;

create index if not exists ix_species_images_species on public.species_images (species_id);
create index if not exists ix_species_images_type on public.species_images (image_type);
create index if not exists ix_species_images_sha on public.species_images (sha256);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_species_images_updated_at on public.species_images;
create trigger trg_species_images_updated_at before update on public.species_images for each row execute function public.touch_updated_at();

alter table public.species_images enable row level security;
create policy species_images_read_public on public.species_images for select to public using (is_public = true and moderation_status = 'approved');
create policy species_images_insert_auth on public.species_images for insert to authenticated with check (true);
create policy species_images_update_owner on public.species_images for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy species_images_delete_owner on public.species_images for delete to authenticated using (created_by = auth.uid());
