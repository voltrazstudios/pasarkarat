begin;

-- Explicitly allow the server-only Supabase secret/service role to manage
-- Pro payment records. RLS remains enabled and browser roles remain revoked.
grant select,insert,update,delete
  on table public.marketplace_pro_payments
  to service_role;

commit;
