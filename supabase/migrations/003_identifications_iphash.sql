create index if not exists ident_sha_idx on identifications(sha256);
create index if not exists ident_user_idx on identifications(user_id);
create index if not exists ident_ip_idx on identifications(ip_hash);
