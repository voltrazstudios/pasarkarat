begin;

create or replace function public.marketplace_public_seller_product_metrics(p_seller uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select coalesce(
    jsonb_object_agg(
      p.id::text,
      jsonb_build_object(
        'saved_count',(
          select count(*)
          from public.marketplace_account_saves s
          where s.product_key=p.id::text
        ),
        'approved_at',p.approved_at
      )
    ),
    '{}'::jsonb
  )
  from public.marketplace_products p
  where p.submitted_by=p_seller
    and p.status='approved'
$$;

revoke all on function public.marketplace_public_seller_product_metrics(uuid)
from public,anon,authenticated;

grant execute on function public.marketplace_public_seller_product_metrics(uuid)
to anon,authenticated;

commit;
