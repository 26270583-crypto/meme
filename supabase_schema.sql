-- Таблица результатов для Supabase (Postgres)
create table results (
  id         bigint generated always as identity primary key,
  meme_code  text        not null,                              -- doge, grumpy, fine, distracted, pikachu
  percent    smallint    not null check (percent between 0 and 100),
  scores     jsonb       not null,                              -- баллы по всем мемам
  created_at timestamptz not null default now()
);

-- Включаем защиту строк и разрешаем сайту только ДОБАВЛЯТЬ записи
alter table results enable row level security;

create policy "anon can insert results"
  on results for insert
  to anon
  with check (true);
