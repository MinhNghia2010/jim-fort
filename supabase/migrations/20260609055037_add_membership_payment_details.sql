alter table public.membership_payments
  add column if not exists payer_name text,
  add column if not exists payer_phone text,
  add column if not exists cardholder_name text,
  add column if not exists card_last_four text,
  add column if not exists card_expiry text;

alter table public.membership_payments
  drop constraint if exists membership_payments_card_last_four_digits;

alter table public.membership_payments
  drop constraint if exists membership_payments_card_expiry_format;

alter table public.membership_payments
  add constraint membership_payments_card_last_four_digits
  check (card_last_four is null or card_last_four ~ '^[0-9]{4}$');

alter table public.membership_payments
  add constraint membership_payments_card_expiry_format
  check (card_expiry is null or card_expiry ~ '^(0[1-9]|1[0-2])/[0-9]{2}$');

comment on column public.membership_payments.payer_name is
  'Name collected for cash payments.';

comment on column public.membership_payments.payer_phone is
  'Phone number collected for cash payments.';

comment on column public.membership_payments.cardholder_name is
  'Cardholder name collected at checkout; full card numbers are not stored.';

comment on column public.membership_payments.card_last_four is
  'Last four digits of the card collected at checkout.';

comment on column public.membership_payments.card_expiry is
  'Card expiry collected at checkout in MM/YY format.';
