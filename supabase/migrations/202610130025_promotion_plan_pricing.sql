begin;

-- Product Boost now supports 3-day and 7-day plans.
-- Featured Store Placement remains a 7-day placement.
alter table public.marketplace_promotion_payments
  drop constraint if exists marketplace_promotion_payments_duration_days_check;

alter table public.marketplace_promotion_payments
  drop constraint if exists marketplace_promotion_payments_plan_duration_check;

alter table public.marketplace_promotion_payments
  add constraint marketplace_promotion_payments_plan_duration_check
  check(
    (promotion_type='product_boost' and duration_days in (3,7))
    or
    (promotion_type='featured_store' and duration_days=7)
  );

notify pgrst,'reload schema';

commit;
