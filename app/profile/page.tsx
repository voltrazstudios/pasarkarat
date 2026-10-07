import Link from 'next/link';
import { redirect } from 'next/navigation';
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
    .select('display_name,description,full_name,phone,gender,date_of_birth,avatar_path')
    .eq('id',user.id)
    .maybeSingle();

  const avatarUrl=data?.avatar_path
    ? client.storage.from('marketplace-profile-images').getPublicUrl(data.avatar_path).data.publicUrl
    : '';

  return <main id="main" className="container profile-page">
    <section className="profile-editor-card">
      <div className="profile-editor-heading">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>Edit profile</h1>
        <p>Update your account details and the identity shown on your shop.</p>
      </div>

      <ProfileForm
        username={data?.display_name||String(user.user_metadata?.display_name||'Marketplace Member')}
        description={data?.description||''}
        fullName={data?.full_name||''}
        email={user.email||''}
        phone={data?.phone||''}
        gender={data?.gender||''}
        dateOfBirth={data?.date_of_birth||''}
        avatarUrl={avatarUrl}
      />

      <div className="profile-editor-links">
        <Link className="text-link" href="/my-submissions" prefetch={false}>My submissions</Link>
        <Link className="text-link" href="/saved" prefetch={false}>Saved finds</Link>
      </div>
    </section>
  </main>;
}
