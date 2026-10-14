begin;

-- Auction participation is free from this migration onward.
-- Historical auction-access payment rows are preserved for audit/history,
-- but marketplace_place_bid no longer checks them and the public auction
-- payload no longer exposes paid-access fields.

create or replace function public.marketplace_public_auction(p_product_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $fn$
declare
  product public.marketplace_products;
  auction public.marketplace_product_auctions;
  highest public.marketplace_product_bids;
  bid_count bigint;
  winner_name text;
  status_text text;
  next_bid numeric;
  top_bidders jsonb;
begin
  select * into product
  from public.marketplace_products
  where id=p_product_id and status='approved' and listing_type='rare_limited';

  if not found then return null; end if;

  select * into auction
  from public.marketplace_product_auctions
  where product_id=p_product_id;

  if not found then return null; end if;

  select * into highest
  from public.marketplace_product_bids
  where product_id=p_product_id
  order by amount desc,created_at asc
  limit 1;

  select count(*) into bid_count
  from public.marketplace_product_bids
  where product_id=p_product_id;

  if auction.starts_at is null or auction.ends_at is null then
    status_text:='pending';
  elsif now()<auction.starts_at then
    status_text:='upcoming';
  elsif now()>=auction.ends_at then
    status_text:='ended';
  else
    status_text:='live';
  end if;

  if highest.id is null then
    next_bid:=auction.starting_bid;
  else
    next_bid:=highest.amount+auction.min_increment;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'display_name',coalesce(nullif(profile.display_name,''),'Marketplace bidder'),
    'avatar_path',profile.avatar_path,
    'amount',ranked.amount
  ) order by ranked.amount desc,ranked.first_bid_at asc),'[]'::jsonb)
  into top_bidders
  from (
    select bidder_id,max(amount) as amount,min(created_at) as first_bid_at
    from public.marketplace_product_bids
    where product_id=p_product_id
    group by bidder_id
    order by max(amount) desc,min(created_at) asc
    limit 3
  ) ranked
  left join public.marketplace_profiles profile on profile.id=ranked.bidder_id;

  if status_text='ended' and highest.id is not null then
    select coalesce(nullif(profile.display_name,''),'Marketplace bidder')
    into winner_name
    from public.marketplace_profiles profile
    where profile.id=highest.bidder_id;

    if winner_name is null then winner_name:='Marketplace bidder'; end if;
  end if;

  return jsonb_build_object(
    'status',status_text,
    'starting_bid',auction.starting_bid,
    'min_increment',auction.min_increment,
    'starts_at',auction.starts_at,
    'ends_at',auction.ends_at,
    'bid_count',bid_count,
    'current_bid',case when highest.id is null then null else highest.amount end,
    'next_minimum_bid',next_bid,
    'winner_name',winner_name,
    'bidders',top_bidders
  );
end
$fn$;

create or replace function public.marketplace_place_bid(
  p_product_id uuid,
  p_amount numeric
) returns jsonb
language plpgsql
security definer
set search_path=''
as $fn$
declare
  actor uuid:=auth.uid();
  product public.marketplace_products;
  auction public.marketplace_product_auctions;
  highest numeric;
  required_amount numeric;
begin
  if actor is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  if p_amount is null
    or p_amount<=0
    or p_amount>9999999999.99
    or p_amount<>round(p_amount,2)
  then
    raise exception 'Invalid bid amount';
  end if;

  select * into product
  from public.marketplace_products
  where id=p_product_id
  for update;

  if not found
    or product.status<>'approved'
    or product.listing_type<>'rare_limited'
  then
    raise exception 'Auction product is unavailable';
  end if;

  if product.submitted_by=actor then
    raise exception 'Sellers cannot bid on their own product' using errcode='42501';
  end if;

  select * into auction
  from public.marketplace_product_auctions
  where product_id=p_product_id
  for update;

  if not found
    or auction.starts_at is null
    or auction.ends_at is null
  then
    raise exception 'Auction is unavailable';
  end if;

  if now()<auction.starts_at then
    raise exception 'Auction has not started';
  end if;

  if now()>=auction.ends_at then
    raise exception 'Auction has ended';
  end if;

  select max(amount) into highest
  from public.marketplace_product_bids
  where product_id=p_product_id;

  required_amount:=case
    when highest is null then auction.starting_bid
    else highest+auction.min_increment
  end;

  if p_amount<required_amount then
    raise exception 'Bid must be at least %',required_amount;
  end if;

  insert into public.marketplace_product_bids(product_id,bidder_id,amount)
  values(p_product_id,actor,p_amount);

  return public.marketplace_public_auction(p_product_id);
end
$fn$;

revoke all on function public.marketplace_public_auction(uuid) from public,anon,authenticated;
grant execute on function public.marketplace_public_auction(uuid) to anon,authenticated;

revoke all on function public.marketplace_place_bid(uuid,numeric) from public,anon,authenticated;
grant execute on function public.marketplace_place_bid(uuid,numeric) to authenticated;

notify pgrst,'reload schema';

commit;
