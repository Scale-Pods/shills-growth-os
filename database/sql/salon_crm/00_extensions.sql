-- =============================================================
-- 00_extensions.sql
-- Run first — all subsequent files depend on these extensions.
-- =============================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
