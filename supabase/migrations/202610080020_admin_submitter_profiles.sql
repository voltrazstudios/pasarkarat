begin;

create or replace function public.marketplace_admin_pending()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare result jsonb;
begin
  if not public.is_marketplace_admin() then
    raise exception 'Admin access required' using errcode='42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id,
    'slug',p.slug,
    'name',p.name,
    'description',p.description,
    'price',p.price,
    'min_price',p.min_price,
    'max_price',p.max_price,
    'category',p.category,
    'pending_image_path',p.pending_image_path,
    'submitted_at',p.submitted_at,
    'submitter',jsonb_build_object(
      'id',u.id,
      'email',u.email,
      'display_name',profile.display_name,
      'avatar_path',profile.avatar_path,
      'approved_products',(
        select count(*)
        from public.marketplace_products approved
        where approved.submitted_by=p.submitted_by
          and approved.status='approved'
      )
    ),
    'links',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'platform',l.platform,
          'seller_url',l.seller_url,
          'affiliate_url',l.affiliate_url
        )
        order by l.platform
      )
      from public.marketplace_product_links l
      where l.product_id=p.id
    ),'[]'::jsonb)
  ) order by p.submitted_at),'[]'::jsonb)
  into result
  from public.marketplace_products p
  join auth.users u on u.id=p.submitted_by
  left join public.marketplace_profiles profile on profile.id=p.submitted_by
  where p.status='pending';

  return result;
end
$$;

revoke all on function public.marketplace_admin_pending() from public,anon,authenticated;
grant execute on function public.marketplace_admin_pending() to authenticated;

notify pgrst,'reload schema';

commit;
