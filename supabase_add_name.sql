-- Добавляем колонку с именем игрока в уже созданную таблицу results
alter table results
  add column player_name text not null default 'Аноним'
  check (char_length(player_name) between 1 and 40);
