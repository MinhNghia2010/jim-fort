-- Supabase Auth expects imported email/password users to belong to the
-- default GoTrue instance. Rows imported with a null instance_id cannot be
-- found by the password grant, which causes "Invalid login credentials".

update auth.users
set
  instance_id = '00000000-0000-0000-0000-000000000000',
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, ''),
  updated_at = now()
where email is not null
  and (
    instance_id is null
    or confirmation_token is null
    or recovery_token is null
    or email_change_token_new is null
    or email_change is null
    or email_change_token_current is null
    or phone_change is null
    or phone_change_token is null
    or reauthentication_token is null
  );
