-- ─────────────────────────────────────────────────────────────────────────────
-- El Profesor | Código Hispano — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── conversations ─────────────────────────────────────────────────────────────
create table if not exists conversations (
  id          uuid         default gen_random_uuid() primary key,
  user_id     uuid         references auth.users(id) on delete cascade,
  fecha       text,
  codigo      text,
  resumen     text,
  response    text,
  created_at  timestamp    default now()
);

create index if not exists conversations_user_id_idx on conversations(user_id);

alter table conversations enable row level security;

create policy "users can see own conversations" on conversations
  for all
  using (auth.uid() = user_id);


-- ── game_stats ────────────────────────────────────────────────────────────────
create table if not exists game_stats (
  user_id      uuid     primary key references auth.users(id) on delete cascade,
  xp           integer  default 0,
  level        integer  default 1,
  streak       integer  default 0,
  last_played  date
);

alter table game_stats enable row level security;

create policy "users manage own game_stats" on game_stats
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── offline_quizzes ───────────────────────────────────────────────────────────
-- One row per user — upsert replaces existing quizzes on each generation.
create table if not exists offline_quizzes (
  user_id     uuid         primary key references auth.users(id) on delete cascade,
  content     jsonb        not null,
  created_at  timestamptz  default now()
);

alter table offline_quizzes enable row level security;

create policy "users manage own offline_quizzes" on offline_quizzes
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
