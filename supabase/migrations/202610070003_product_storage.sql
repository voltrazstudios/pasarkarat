begin;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-submission-images','product-submission-images',false,5242880,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,5242880,array['image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "product submission owner insert"
on storage.objects for insert to authenticated
with check(
  bucket_id='product-submission-images'
  and (storage.foldername(name))[1]=auth.uid()::text
  and name ~ '^[a-f0-9-]+/[a-f0-9-]+\.webp$'
);

create policy "product submission owner or admin read"
on storage.objects for select to authenticated
using(
  bucket_id='product-submission-images'
  and ((storage.foldername(name))[1]=auth.uid()::text or public.is_marketplace_admin())
);

create policy "product submission owner or admin delete"
on storage.objects for delete to authenticated
using(
  bucket_id='product-submission-images'
  and ((storage.foldername(name))[1]=auth.uid()::text or public.is_marketplace_admin())
);

create policy "approved product public read"
on storage.objects for select to public
using(bucket_id='product-images');

create policy "approved product admin insert"
on storage.objects for insert to authenticated
with check(
  bucket_id='product-images'
  and public.is_marketplace_admin()
  and name ~ '^approved/[a-f0-9-]+\.webp$'
);

create policy "approved product admin delete"
on storage.objects for delete to authenticated
using(bucket_id='product-images' and public.is_marketplace_admin());

commit;
