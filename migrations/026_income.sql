-- Migration 026: Income table
-- Stores imported income/revenue transactions separately from expenses

create table if not exists public.income (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  account_id       uuid references public.accounts(id) on delete cascade,
  company_name     text not null,
  year             text not null,
  month            text not null,
  date             text not null,
  description      text not null,
  amount           numeric(12, 2) not null,
  income_type      text not null default 'other',
  -- check | bank_deposit | cash | credit | other
  source           text,
  -- who/where the income came from (payer name, client, etc.)
  filename         text,
  raw_data         text[],
  payment_method   text,
  notes            text,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now()
);

-- Indexes
create index if not exists income_user_id_idx        on public.income(user_id);
create index if not exists income_account_id_idx     on public.income(account_id);
create index if not exists income_company_name_idx   on public.income(company_name);
create index if not exists income_year_idx           on public.income(year);
create index if not exists income_month_idx          on public.income(month);
create index if not exists income_deleted_at_idx     on public.income(deleted_at);

-- RLS
alter table public.income enable row level security;

-- Account members can read their account's income
create policy "account members can read income"
  on public.income for select
  using (
    account_id in (
      select account_id from public.account_users
      where user_id = auth.uid() and status = 'active'
    )
    or user_id = auth.uid()
  );

-- Account members can insert income
create policy "account members can insert income"
  on public.income for insert
  with check (
    account_id in (
      select account_id from public.account_users
      where user_id = auth.uid() and status = 'active'
    )
    or user_id = auth.uid()
  );

-- Account members can update income
create policy "account members can update income"
  on public.income for update
  using (
    account_id in (
      select account_id from public.account_users
      where user_id = auth.uid() and status = 'active'
    )
    or user_id = auth.uid()
  );

-- Account members can delete income
create policy "account members can delete income"
  on public.income for delete
  using (
    account_id in (
      select account_id from public.account_users
      where user_id = auth.uid() and status = 'active'
    )
    or user_id = auth.uid()
  );
