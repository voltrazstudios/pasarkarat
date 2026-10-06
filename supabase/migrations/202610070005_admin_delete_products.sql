begin;

create or replace function public.marketplace_admin_delete_product(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  product public.marketplace_products;
  result jsonb;
begin
  if auth.uid() is null or not public.is_marketplace_admin() then
    raise exception 'Admin access required' using errcode='42501';
  end if;

  select * into product
  from public.marketplace_products
  where id=p_id
  for update;

  if not found then
    raise exception 'Product not found';
  end if;

  if product.status<>'approved' then
    raise exception 'Only published products can be deleted here';
  end if;

  result := jsonb_build_object(
    'id',product.id,
    'name',product.name,
    'public_image_path',product.public_image_path,
    'pending_image_path',product.pending_image_path
  );

  delete from public.marketplace_products where id=p_id;
  return result;
end
$$;

revoke all on function public.marketplace_admin_delete_product(uuid) from public, anon, authenticated;
grant execute on function public.marketplace_admin_delete_product(uuid) to authenticated;

commit;
