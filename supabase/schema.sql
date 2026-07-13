-- ============================================================
-- РЕМОНТ БЮДЖЕТ — Supabase схема
-- Изпълни в Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. КАТЕГОРИИ (глобални за потребителя)
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#64748b',
  icon        text not null default '📦',
  created_at  timestamptz not null default now()
);

-- 2. ПРОЕКТИ (всеки ремонт)
create table if not exists projects (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  status            text not null default 'active' check (status in ('active','done','deleted')),
  allocated_amount  numeric(12,2),          -- заделена сума (по избор)
  created_at        timestamptz not null default now()
);

-- 3. ТРАНШОВЕ КЪМ ОБЩИЯ БЮДЖЕТ (не са вързани към проект!)
create table if not exists budget_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0),
  note        text,
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);

-- 4. РАЗХОДИ (винаги към конкретен проект)
create table if not exists expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  project_id   uuid not null references projects(id) on delete cascade,
  category_id  uuid references categories(id) on delete set null,
  amount       numeric(12,2) not null check (amount > 0),
  description  text,
  vendor       text,
  date         date not null default current_date,
  created_at   timestamptz not null default now()
);

-- 5. ПЛАНИРАН БЮДЖЕТ ПО КАТЕГОРИЯ В ПРОЕКТ (планирано vs. реално)
create table if not exists planned_budgets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  project_id      uuid not null references projects(id) on delete cascade,
  category_id     uuid not null references categories(id) on delete cascade,
  planned_amount  numeric(12,2) not null check (planned_amount >= 0),
  unique (project_id, category_id)
);

-- Индекси за бързи заявки
create index if not exists idx_expenses_project on expenses(project_id);
create index if not exists idx_expenses_user_date on expenses(user_id, date);
create index if not exists idx_budget_entries_user on budget_entries(user_id, date);
create index if not exists idx_projects_user on projects(user_id);
create index if not exists idx_categories_user on categories(user_id);

-- ============================================================
-- RLS — всеки потребител вижда само своите редове
-- ============================================================
alter table categories       enable row level security;
alter table projects         enable row level security;
alter table budget_entries   enable row level security;
alter table expenses         enable row level security;
alter table planned_budgets  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['categories','projects','budget_entries','expenses','planned_budgets']
  loop
    execute format('create policy "select_own" on %I for select using (auth.uid() = user_id)', t);
    execute format('create policy "insert_own" on %I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "update_own" on %I for update using (auth.uid() = user_id)', t);
    execute format('create policy "delete_own" on %I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- ============================================================
-- МИГРАЦИЯ (само ако таблиците ВЕЧЕ съществуват от предишна
-- версия на схемата — при чиста инсталация не е нужна)
-- ============================================================
-- alter table projects drop constraint if exists projects_status_check;
-- alter table projects add constraint projects_status_check
--   check (status in ('active','done','deleted'));
