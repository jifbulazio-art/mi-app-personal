-- ===========================================================
-- MI APP PERSONAL — Supabase Schema
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- EXERCISES
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  muscle text not null default 'Otro',
  description text,
  created_at timestamptz default now()
);

-- ROUTINES
create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  day_label text,
  rest_seconds int not null default 60,
  exercises jsonb not null default '[]',
  created_at timestamptz default now()
);

-- WORKOUT HISTORY
create table if not exists workout_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_name text not null,
  duration_seconds int not null default 0,
  total_series int not null default 0,
  done_series int not null default 0,
  exercises_names text[] default '{}',
  date_key date not null default current_date,
  created_at timestamptz default now()
);

-- FOODS
create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  portion text not null default '100g',
  prot numeric(6,1) not null default 0,
  carb numeric(6,1) not null default 0,
  fat numeric(6,1) not null default 0,
  kcal numeric(7,1) not null default 0,
  created_at timestamptz default now()
);

-- RECIPES
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  servings int not null default 1,
  ingredients jsonb not null default '[]',
  prot numeric(6,1) not null default 0,
  carb numeric(6,1) not null default 0,
  fat numeric(6,1) not null default 0,
  kcal numeric(7,1) not null default 0,
  created_at timestamptz default now()
);

-- SHOPPING ITEMS
create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  quantity text,
  category text not null default 'Otro',
  done boolean not null default false,
  created_at timestamptz default now()
);

-- NOTES
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  type text not null default 'nota',
  done boolean not null default false,
  date_key date not null default current_date,
  created_at timestamptz default now()
);

-- WEEKLY SCHEDULE (una fila por usuario, json con todo el horario)
create table if not exists weekly_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  schedule jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — cada usuario solo ve sus datos
-- ============================================================

alter table exercises enable row level security;
alter table routines enable row level security;
alter table workout_history enable row level security;
alter table foods enable row level security;
alter table recipes enable row level security;
alter table shopping_items enable row level security;
alter table notes enable row level security;
alter table weekly_schedule enable row level security;

-- Policies: el usuario solo puede ver/editar sus propias filas
do $$ 
declare
  t text;
begin
  foreach t in array array['exercises','routines','workout_history','foods','recipes','shopping_items','notes','weekly_schedule']
  loop
    execute format('
      create policy "%s_user_policy" on %s
      for all using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    ', t, t);
  end loop;
end $$;
