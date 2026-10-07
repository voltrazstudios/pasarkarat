import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { configured, db } from '@/lib/supabase';
import { ProfileForm } from './profile-form';

export const metadata={title:'Edit Profile'};
export const dynamic='force-dynamic';

export default async function ProfilePage(){
  if(!configured())redirect('/auth?next=/profile');

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/profile');

  const {data}=await client.from('marketplace_profiles')
    .select('display_name,description')
    .eq('id',user.id)
    .maybeSingle();

  const name=data?.display_name||String(user.user_metadata?.display_name||'Marketplace Member');
  const description=data?.description||'';

  return <main id="main" className="container profile-page">
    <section className="profile-editor-card">
      <div className="profile-editor-heading">
        <div className="profile-editor-avatar" aria-hidden="true"><UserRound size={46} strokeWidth={1.55}/></div>
        <p className="eyebrow">YOUR PROFILE</p>
        <h1>Edit profile</h1>
        <p>Update the name and description people see when they view your seller profile.</p>
      </div>

      <ProfileForm name={name} description={description}/>

      <div className="profile-editor-links">
        <Link className="text-link" href="/my-submissions" prefetch={false}>My submissions</Link>
        <Link className="text-link" href="/saved" prefetch={false}>Saved finds</Link>
      </div>
    </section>
  </main>;
}
