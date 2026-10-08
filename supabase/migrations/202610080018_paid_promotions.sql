begin;

alter table public.marketplace_products
  add column if not exists boosted_until timestamptz;

alter table public.marketplace_profiles
  add column if not exists featured_until timestamptz;

create table if not exists public.marketplace_promotion_payments (
  bill_id text primary key check(char_length(bill_id) between 3 and 100),
  user_id uuid not null references public.marketplace_profiles(id) on delete cascade,
  promotion_type text not null check(promotion_type in ('product_boost','featured_store')),
  product_id uuid references public.marketplace_products(id) on delete set null,
  amount integer not null check(amount>0),
  duration_days integer not null default 7 check(duration_days=7),
  status text not null default 'due' check(status in ('due','paid','deleted','failed')),
  paid_at timestamptz,
  activated_until timestamptz,
  created_at timestamptz not null default now(),
  check(
    (promotion_type='product_boost' and product_id is not null)
    or (promotion_type='featured_store' and product_id is null)
  )
);

create index if not exists marketplace_promotion_payments_user_idx
  on public.marketplace_promotion_payments(user_id,created_at desc);

create index if not exists marketplace_products_boosted_until_idx
  on public.marketplace_products(boosted_until desc)
  where boosted_until is not null;

create index if not exists marketplace_profiles_featured_until_idx
  on public.marketplace_profiles(featured_until desc)
  where featured_until is not null;

alter table public.marketplace_promotion_payments enable row level security;
revoke all on public.marketplace_promotion_payments from public,anon,authenticated;
grant select,insert,update,delete on public.marketplace_promotion_payments to service_role;

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
    set boosted_until=new_until
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
      paid_at=coalesce(p_paid_at,now()),
      activated_until=new_until
  where bill_id=p_bill_id;

  return new_until;
end
$$;

create or replace function public.marketplace_featured_stores()
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',profile.id,
        'store_name',profile.display_name,
        'description',profile.description,
        'avatar_path',profile.avatar_path,
        'featured_until',profile.featured_until,
        'products',(
          select count(*)
          from public.marketplace_products product
          where product.submitted_by=profile.id
            and product.status='approved'
        )
      )
      order by profile.featured_until desc
    ),
    '[]'::jsonb
  )
  from (
    select *
    from public.marketplace_profiles profile
    where profile.featured_until is not null
      and profile.featured_until>now()
      and exists(
        select 1
        from public.marketplace_products product
        where product.submitted_by=profile.id
          and product.status='approved'
      )
    order by profile.featured_until desc
    limit 4
  ) profile
$$;

revoke all on function public.marketplace_activate_promotion_payment(text,integer,timestamptz)
from public,anon,authenticated;
grant execute on function public.marketplace_activate_promotion_payment(text,integer,timestamptz)
to service_role;

revoke all on function public.marketplace_featured_stores()
from public,anon,authenticated;
grant execute on function public.marketplace_featured_stores()
to anon,authenticated;

commit;
