-- Add not_needed flag to checklist_items for "not needed" toggle (read-only / struck-through display)
alter table public.checklist_items
  add column if not exists not_needed boolean not null default false;
