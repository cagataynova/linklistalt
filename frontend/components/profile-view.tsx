import Image from 'next/image';
import type { Profile } from '@/lib/types';
import { ListCard } from './list-card';
import { SocialActions } from './social-actions';

export function ProfileView({ profile }: { profile: Profile }) {
  return <main><section className="profile-wrap"><div className="profile-head">{profile.avatarUrl ? <div className="profile-avatar image-avatar"><Image src={profile.avatarUrl} alt={profile.displayName} fill sizes="96px" /></div> : <div className="profile-avatar" aria-hidden="true">{profile.displayName[0]}</div>}<div className="profile-copy"><div className="eyebrow">@{profile.username}</div><h1>{profile.displayName}</h1><p>{profile.bio}</p><div className="stats"><span><b>{profile.user.lists.length}</b> liste</span><span><b>{profile.user._count.followers}</b> takipçi</span><span><b>{profile.user._count.following}</b> takip</span></div><SocialActions targetType="PROFILE" targetId={profile.id} followUserId={profile.user.id} blockUserId={profile.user.id} /></div></div></section><section className="collections-wrap"><div className="collection-stack">{profile.user.lists.map((list) => <ListCard key={list.id} list={list} />)}</div></section></main>;
}
