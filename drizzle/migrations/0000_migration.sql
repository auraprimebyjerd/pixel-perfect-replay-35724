
-- Roles
create type public.app_role as enum ('admin','user');
create type public.loan_status as enum ('pending','approved','rejected','repaid');
create type public.review_status as enum ('pending','approved','rejected');
create type public.withdrawal_status as enum ('pending','paid','rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Lending rules
create table public.lending_settings (
  id int primary key default 1 check (id = 1),
  min_amount numeric(12,2) not null default 100,
  max_amount numeric(12,2) not null default 5000,
  updated_at timestamptz not null default now()
);
insert into public.lending_settings (id) values (1);
grant select on public.lending_settings to anon, authenticated;
grant update on public.lending_settings to authenticated;
grant all on public.lending_settings to service_role;
alter table public.lending_settings enable row level security;
create policy "settings read" on public.lending_settings for select to anon, authenticated using (true);
create policy "settings admin update" on public.lending_settings for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.loan_terms (
  id uuid primary key default gen_random_uuid(),
  duration_months int not null check (duration_months between 1 and 60),
  monthly_rate_percent numeric(6,3) not null check (monthly_rate_percent >= 0 and monthly_rate_percent <= 100),
  active boolean not null default true,
  unique (duration_months)
);
insert into public.loan_terms (duration_months, monthly_rate_percent) values (1, 5), (3, 4.5), (6, 4), (12, 3.5);
grant select on public.loan_terms to anon, authenticated;
grant insert, update, delete on public.loan_terms to authenticated;
grant all on public.loan_terms to service_role;
alter table public.loan_terms enable row level security;
create policy "terms read" on public.loan_terms for select to anon, authenticated using (true);
create policy "terms admin insert" on public.loan_terms for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "terms admin update" on public.loan_terms for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "terms admin delete" on public.loan_terms for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.payment_methods (name) values ('MTN Mobile Money'), ('Telecel Cash'), ('AirtelTigo Money'), ('Bank transfer');
grant select on public.payment_methods to authenticated;
grant insert, update, delete on public.payment_methods to authenticated;
grant all on public.payment_methods to service_role;
alter table public.payment_methods enable row level security;
create policy "pm read" on public.payment_methods for select to authenticated using (true);
create policy "pm admin insert" on public.payment_methods for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "pm admin update" on public.payment_methods for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "pm admin delete" on public.payment_methods for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- Loans
create table public.loan_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  purpose text not null,
  full_name text not null,
  phone text not null,
  email text not null,
  date_needed date not null,
  amount numeric(12,2) not null,
  duration_months int not null,
  monthly_rate_percent numeric(6,3) not null,
  total_repayment numeric(12,2) not null,
  monthly_repayment numeric(12,2) not null,
  status public.loan_status not null default 'pending',
  admin_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.loan_applications(user_id);
grant select on public.loan_applications to authenticated;
grant all on public.loan_applications to service_role;
alter table public.loan_applications enable row level security;
create policy "loans read" on public.loan_applications for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.loan_repayments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loan_applications(id) on delete cascade,
  user_id uuid not null,
  due_date date not null,
  amount_due numeric(12,2) not null,
  amount_paid numeric(12,2) not null default 0,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.loan_repayments to authenticated;
grant all on public.loan_repayments to service_role;
alter table public.loan_repayments enable row level security;
create policy "repay read" on public.loan_repayments for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- KYC
create table public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  ghana_card_number text not null,
  front_path text not null,
  back_path text not null,
  selfie_path text not null,
  reference1_name text not null,
  reference1_phone text not null,
  reference2_name text not null,
  reference2_phone text not null,
  consent_given boolean not null,
  status public.review_status not null default 'pending',
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.kyc_submissions(user_id);
grant select on public.kyc_submissions to authenticated;
grant all on public.kyc_submissions to service_role;
alter table public.kyc_submissions enable row level security;
create policy "kyc read" on public.kyc_submissions for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- Wallet
create table public.wallets (
  user_id uuid primary key,
  balance numeric(12,2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
grant select on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
create policy "wallet read" on public.wallets for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  amount numeric(12,2) not null,
  description text not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);
create index on public.transactions(user_id);
grant select on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "tx read" on public.transactions for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method_id uuid not null references public.payment_methods(id),
  account_number text not null,
  account_name text not null,
  status public.withdrawal_status not null default 'pending',
  admin_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.withdrawals(user_id);
grant select on public.withdrawals to authenticated;
grant all on public.withdrawals to service_role;
alter table public.withdrawals enable row level security;
create policy "wd read" on public.withdrawals for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications(user_id);
grant select on public.notifications to authenticated;
grant update (read) on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notif read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notif update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit admin read" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- Signup trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', new.email);
  insert into public.wallets (user_id) values (new.id);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  insert into public.notifications (user_id, title, body)
  values (new.id, 'Welcome to EasyLoan', 'Complete your identity verification to get your loan applications reviewed.');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers
create or replace function public.log_audit(_action text, _table text, _id uuid, _details jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_id, action, target_table, target_id, details)
  values (auth.uid(), _action, _table, _id, _details);
$$;
revoke execute on function public.log_audit(text,text,uuid,jsonb) from public, anon, authenticated;

create or replace function public.require_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Not authorised'; end if;
end $$;

-- Calculator (server-side)
create or replace function public.calculate_loan(p_amount numeric, p_duration int)
returns table (amount numeric, duration_months int, monthly_rate_percent numeric, total_interest numeric, total_repayment numeric, monthly_repayment numeric)
language plpgsql stable security definer set search_path = public as $$
declare s record; t record;
begin
  select * into s from public.lending_settings where id = 1;
  if p_amount is null or p_amount < s.min_amount or p_amount > s.max_amount then
    raise exception 'Amount must be between GH₵ % and GH₵ %', s.min_amount, s.max_amount;
  end if;
  select * into t from public.loan_terms lt where lt.duration_months = p_duration and lt.active;
  if not found then raise exception 'That repayment duration is not available'; end if;
  amount := round(p_amount, 2);
  duration_months := p_duration;
  monthly_rate_percent := t.monthly_rate_percent;
  total_interest := round(p_amount * t.monthly_rate_percent / 100 * p_duration, 2);
  total_repayment := amount + total_interest;
  monthly_repayment := round(total_repayment / p_duration, 2);
  return next;
end $$;
grant execute on function public.calculate_loan(numeric,int) to anon, authenticated;

create or replace function public.submit_loan_application(
  p_purpose text, p_full_name text, p_phone text, p_email text, p_date_needed date, p_amount numeric, p_duration int)
returns uuid language plpgsql security definer set search_path = public as $$
declare c record; new_id uuid; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if length(trim(coalesce(p_purpose,''))) < 3 or length(p_purpose) > 500 then raise exception 'Please describe the loan purpose'; end if;
  if length(trim(coalesce(p_full_name,''))) < 2 or length(p_full_name) > 120 then raise exception 'Enter your full name'; end if;
  if p_phone !~ '^\+?[0-9]{9,15}$' then raise exception 'Enter a valid phone number'; end if;
  if p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_email) > 255 then raise exception 'Enter a valid email'; end if;
  if p_date_needed < current_date then raise exception 'Date needed cannot be in the past'; end if;
  if exists (select 1 from public.loan_applications where user_id = uid and status = 'pending') then
    raise exception 'You already have a pending application';
  end if;
  select * into c from public.calculate_loan(p_amount, p_duration);
  insert into public.loan_applications (user_id, purpose, full_name, phone, email, date_needed, amount, duration_months, monthly_rate_percent, total_repayment, monthly_repayment)
  values (uid, trim(p_purpose), trim(p_full_name), p_phone, lower(trim(p_email)), p_date_needed, c.amount, c.duration_months, c.monthly_rate_percent, c.total_repayment, c.monthly_repayment)
  returning id into new_id;
  insert into public.notifications (user_id, title, body) values (uid, 'Application received', 'Your loan application for GH₵ ' || c.amount || ' is under review.');
  perform public.log_audit('loan.submitted', 'loan_applications', new_id, jsonb_build_object('amount', c.amount));
  return new_id;
end $$;
grant execute on function public.submit_loan_application(text,text,text,text,date,numeric,int) to authenticated;

create or replace function public.submit_kyc(
  p_card_number text, p_front text, p_back text, p_selfie text,
  p_ref1_name text, p_ref1_phone text, p_ref2_name text, p_ref2_phone text, p_consent boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); new_id uuid;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if not coalesce(p_consent,false) then raise exception 'Consent is required'; end if;
  if upper(p_card_number) !~ '^GHA-[0-9]{9}-[0-9]$' then raise exception 'Ghana Card number must look like GHA-123456789-0'; end if;
  if p_front not like uid::text || '/%' or p_back not like uid::text || '/%' or p_selfie not like uid::text || '/%' then
    raise exception 'Invalid document upload';
  end if;
  if length(trim(coalesce(p_ref1_name,''))) < 2 or length(trim(coalesce(p_ref2_name,''))) < 2 then raise exception 'Enter both reference names'; end if;
  if p_ref1_phone !~ '^\+?[0-9]{9,15}$' or p_ref2_phone !~ '^\+?[0-9]{9,15}$' then raise exception 'Enter valid reference phone numbers'; end if;
  if exists (select 1 from public.kyc_submissions where user_id = uid and status in ('pending','approved')) then
    raise exception 'You already have a verification under review or approved';
  end if;
  insert into public.kyc_submissions (user_id, ghana_card_number, front_path, back_path, selfie_path, reference1_name, reference1_phone, reference2_name, reference2_phone, consent_given)
  values (uid, upper(p_card_number), p_front, p_back, p_selfie, trim(p_ref1_name), p_ref1_phone, trim(p_ref2_name), p_ref2_phone, true)
  returning id into new_id;
  insert into public.notifications (user_id, title, body) values (uid, 'Verification submitted', 'We are reviewing your identity documents.');
  perform public.log_audit('kyc.submitted', 'kyc_submissions', new_id, null);
  return new_id;
end $$;
grant execute on function public.submit_kyc(text,text,text,text,text,text,text,text,boolean) to authenticated;

create or replace function public.request_withdrawal(p_amount numeric, p_method uuid, p_account_number text, p_account_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); bal numeric; new_id uuid;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter a valid amount'; end if;
  if not exists (select 1 from public.payment_methods where id = p_method and active) then raise exception 'Choose a payment method'; end if;
  if p_account_number !~ '^[0-9]{6,20}$' then raise exception 'Enter a valid account or mobile money number'; end if;
  if length(trim(coalesce(p_account_name,''))) < 2 then raise exception 'Enter the account name'; end if;
  select balance into bal from public.wallets where user_id = uid for update;
  if bal is null or bal < p_amount then raise exception 'Insufficient wallet balance'; end if;
  update public.wallets set balance = balance - p_amount, updated_at = now() where user_id = uid;
  insert into public.withdrawals (user_id, amount, payment_method_id, account_number, account_name)
  values (uid, round(p_amount,2), p_method, p_account_number, trim(p_account_name)) returning id into new_id;
  insert into public.transactions (user_id, kind, amount, description, reference_id)
  values (uid, 'withdrawal', -round(p_amount,2), 'Withdrawal requested', new_id);
  insert into public.notifications (user_id, title, body) values (uid, 'Withdrawal requested', 'Your withdrawal of GH₵ ' || round(p_amount,2) || ' is being processed.');
  perform public.log_audit('withdrawal.requested', 'withdrawals', new_id, jsonb_build_object('amount', p_amount));
  return new_id;
end $$;
grant execute on function public.request_withdrawal(numeric,uuid,text,text) to authenticated;

-- Admin actions
create or replace function public.admin_decide_loan(p_id uuid, p_approve boolean, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare l record; i int;
begin
  perform public.require_admin();
  select * into l from public.loan_applications where id = p_id for update;
  if not found then raise exception 'Application not found'; end if;
  if l.status <> 'pending' then raise exception 'Application already decided'; end if;
  if p_approve then
    if not exists (select 1 from public.kyc_submissions where user_id = l.user_id and status = 'approved') then
      raise exception 'Borrower identity has not been verified yet';
    end if;
    update public.loan_applications set status = 'approved', admin_note = p_note, decided_at = now() where id = p_id;
    update public.wallets set balance = balance + l.amount, updated_at = now() where user_id = l.user_id;
    insert into public.transactions (user_id, kind, amount, description, reference_id)
    values (l.user_id, 'loan_disbursement', l.amount, 'Loan disbursed to wallet', p_id);
    for i in 1..l.duration_months loop
      insert into public.loan_repayments (loan_id, user_id, due_date, amount_due)
      values (p_id, l.user_id, (current_date + (i || ' month')::interval)::date, l.monthly_repayment);
    end loop;
    insert into public.notifications (user_id, title, body) values (l.user_id, 'Loan approved', 'GH₵ ' || l.amount || ' has been added to your wallet.');
  else
    update public.loan_applications set status = 'rejected', admin_note = p_note, decided_at = now() where id = p_id;
    insert into public.notifications (user_id, title, body) values (l.user_id, 'Loan application declined', coalesce(nullif(p_note,''), 'Your application was not approved this time.'));
  end if;
  perform public.log_audit(case when p_approve then 'loan.approved' else 'loan.rejected' end, 'loan_applications', p_id, jsonb_build_object('note', p_note));
end $$;
grant execute on function public.admin_decide_loan(uuid,boolean,text) to authenticated;

create or replace function public.admin_review_kyc(p_id uuid, p_approve boolean, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare k record;
begin
  perform public.require_admin();
  select * into k from public.kyc_submissions where id = p_id for update;
  if not found or k.status <> 'pending' then raise exception 'Submission not pending'; end if;
  update public.kyc_submissions set status = case when p_approve then 'approved'::public.review_status else 'rejected'::public.review_status end,
    admin_note = p_note, reviewed_at = now() where id = p_id;
  insert into public.notifications (user_id, title, body) values (k.user_id,
    case when p_approve then 'Identity verified' else 'Verification needs attention' end,
    case when p_approve then 'Your identity has been verified.' else coalesce(nullif(p_note,''), 'Please resubmit your documents.') end);
  perform public.log_audit(case when p_approve then 'kyc.approved' else 'kyc.rejected' end, 'kyc_submissions', p_id, jsonb_build_object('note', p_note));
end $$;
grant execute on function public.admin_review_kyc(uuid,boolean,text) to authenticated;

create or replace function public.admin_decide_withdrawal(p_id uuid, p_paid boolean, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare w record;
begin
  perform public.require_admin();
  select * into w from public.withdrawals where id = p_id for update;
  if not found or w.status <> 'pending' then raise exception 'Withdrawal not pending'; end if;
  if p_paid then
    update public.withdrawals set status = 'paid', admin_note = p_note, decided_at = now() where id = p_id;
    insert into public.notifications (user_id, title, body) values (w.user_id, 'Withdrawal paid', 'GH₵ ' || w.amount || ' has been sent to your account.');
  else
    update public.withdrawals set status = 'rejected', admin_note = p_note, decided_at = now() where id = p_id;
    update public.wallets set balance = balance + w.amount, updated_at = now() where user_id = w.user_id;
    insert into public.transactions (user_id, kind, amount, description, reference_id)
    values (w.user_id, 'withdrawal_refund', w.amount, 'Withdrawal rejected - refunded', p_id);
    insert into public.notifications (user_id, title, body) values (w.user_id, 'Withdrawal rejected', coalesce(nullif(p_note,''), 'Funds were returned to your wallet.'));
  end if;
  perform public.log_audit(case when p_paid then 'withdrawal.paid' else 'withdrawal.rejected' end, 'withdrawals', p_id, jsonb_build_object('note', p_note));
end $$;
grant execute on function public.admin_decide_withdrawal(uuid,boolean,text) to authenticated;

create or replace function public.admin_record_repayment(p_loan uuid, p_amount numeric, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare l record; remaining numeric := p_amount; r record; pay numeric;
begin
  perform public.require_admin();
  if p_amount is null or p_amount <= 0 then raise exception 'Enter a valid amount'; end if;
  select * into l from public.loan_applications where id = p_loan for update;
  if not found or l.status <> 'approved' then raise exception 'Loan is not active'; end if;
  for r in select * from public.loan_repayments where loan_id = p_loan and amount_paid < amount_due order by due_date loop
    exit when remaining <= 0;
    pay := least(remaining, r.amount_due - r.amount_paid);
    update public.loan_repayments set amount_paid = amount_paid + pay,
      paid_at = case when amount_paid + pay >= amount_due then now() else paid_at end where id = r.id;
    remaining := remaining - pay;
  end loop;
  insert into public.transactions (user_id, kind, amount, description, reference_id)
  values (l.user_id, 'repayment', 0, 'Repayment of GH₵ ' || round(p_amount - remaining, 2) || ' recorded', p_loan);
  if not exists (select 1 from public.loan_repayments where loan_id = p_loan and amount_paid < amount_due) then
    update public.loan_applications set status = 'repaid' where id = p_loan;
    insert into public.notifications (user_id, title, body) values (l.user_id, 'Loan fully repaid', 'Thank you! Your loan is fully repaid.');
  end if;
  perform public.log_audit('loan.repayment', 'loan_applications', p_loan, jsonb_build_object('amount', p_amount, 'note', p_note));
end $$;
grant execute on function public.admin_record_repayment(uuid,numeric,text) to authenticated;

create or replace function public.admin_adjust_wallet(p_user uuid, p_amount numeric, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if p_amount is null or p_amount = 0 then raise exception 'Enter a non-zero amount'; end if;
  if length(trim(coalesce(p_note,''))) < 3 then raise exception 'A reason is required'; end if;
  update public.wallets set balance = balance + p_amount, updated_at = now() where user_id = p_user;
  if not found then raise exception 'Wallet not found'; end if;
  insert into public.transactions (user_id, kind, amount, description) values (p_user, 'adjustment', round(p_amount,2), trim(p_note));
  perform public.log_audit('wallet.adjusted', 'wallets', p_user, jsonb_build_object('amount', p_amount, 'note', p_note));
end $$;
grant execute on function public.admin_adjust_wallet(uuid,numeric,text) to authenticated;

-- First-admin bootstrap: only works while no admin exists
create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if exists (select 1 from public.user_roles where role = 'admin') then return false; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin');
  perform public.log_audit('admin.bootstrap', 'user_roles', auth.uid(), null);
  return true;
end $$;
grant execute on function public.claim_first_admin() to authenticated;

create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'admin')
$$;
grant execute on function public.admin_exists() to authenticated;

-- Storage policies for private kyc bucket
create policy "kyc upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'kyc' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kyc read own or admin" on storage.objects for select to authenticated
  using (bucket_id = 'kyc' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
