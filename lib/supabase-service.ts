import { createClient } from '@supabase/supabase-js';

export function serviceConfigured(){
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function serviceDb(){
  if(!serviceConfigured())throw new Error('Supabase server payment access is not configured.');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {auth:{persistSession:false,autoRefreshToken:false}}
  );
}
