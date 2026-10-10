begin;

alter table public.marketplace_products
  add column if not exists boosted_at timestamptz;

-- Backfill the latest successful paid Product Boost time for existing boosted products.
update public.marketplace_products product
set boosted_at=latest.paid_at
from (
  select distinct on (payment.product_id)
    payment.product_id,
    payment.paid_at
  from public.marketplace_promotion_payments payment
  where payment.promotion_type='product_boost'
    and payment.status='paid'
    and payment.product_id is not null
    and payment.paid_at is not null
  order by payment.product_id,payment.paid_at desc
) latest
where product.id=latest.product_id
  and product.boosted_at is null;

create index if not exists marketplace_products_boosted_at_idx
  on public.marketplace_products(boosted_at desc)
  where boosted_at is not null;

create or replace function public.marketplace_activate_promotion_payment(
  p_bill_id text,
  p_paid_amount integer,
  p_paid_at timestamptz
) returns timestamptz
language plpgsql
security definer
set search_path=''
as $$
declare
  payment public.marketplace_promotion_payments%rowtype;
  current_until timestamptz;
  new_until timestamptz;
  activation_time timestamptz := coalesce(p_paid_at,now());
begin
  select * into payment
  from public.marketplace_promotion_payments
  where bill_id=p_bill_id
  for update;

  if not found then
    raise exception 'Promotion payment not found';
  end if;

  if payment.status='paid' then
    return payment.activated_until;
  end if;

  if p_paid_amount<payment.amount then
    raise exception 'Paid amount does not match';
  end if;

  if payment.promotion_type='product_boost' then
    select boosted_until into current_until
    from public.marketplace_products
    where id=payment.product_id
      and submitted_by=payment.user_id
      and status='approved'
    for update;

    if not found then
      raise exception 'Approved product not found';
    end if;

    new_until:=greatest(coalesce(current_until,now()),now())
      + make_interval(days=>payment.duration_days);

    update public.marketplace_products
    set boosted_until=new_until,
        boosted_at=activation_time
    where id=payment.product_id;
  elsif payment.promotion_type='featured_store' then
    select featured_until into current_until
    from public.marketplace_profiles
    where id=payment.user_id
    for update;

    if not found then
      raise exception 'Seller profile not found';
    end if;

    if not exists(
      select 1
      from public.marketplace_products
      where submitted_by=payment.user_id and status='approved'
    ) then
      raise exception 'Seller needs an approved product';
    end if;

    new_until:=greatest(coalesce(current_until,now()),now())
      + make_interval(days=>payment.duration_days);

    update public.marketplace_profiles
    set featured_until=new_until,updated_at=now()
    where id=payment.user_id;
  else
    raise exception 'Unknown promotion type';
  end if;

  update public.marketplace_promotion_payments
  set status='paid',
      paid_at=activation_time,
      activated_until=new_until
  where bill_id=p_bill_id;

  return new_until;
end
$$;

revoke all on function public.marketplace_activate_promotion_payment(text,integer,timestamptz)
from public,anon,authenticated;
grant execute on function public.marketplace_activate_promotion_payment(text,integer,timestamptz)
to service_role;

notify pgrst,'reload schema';

commit;
