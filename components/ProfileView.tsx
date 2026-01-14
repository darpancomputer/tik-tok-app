
import React, { useState, useEffect } from 'react';
import { User, Video } from '../types';
import { db } from '../services/dbService';
import { ArrowLeft, Bookmark, Heart, Grid, Play, LogOut, Lock, MessageSquare, Loader2, UserPlus, UserCheck, Folder } from 'lucide-react';

interface ProfileViewProps {
  userId: string;
  currentUser: User;
  videos: Video[];
  onLogout: () => void;
  onOpenVideo: (id: string) => void;
  onEditProfile: () => void;
  onFollow: (id: string) => void;
  onMessage: (id: string) => void;
  onOpenDrafts: () => void;
  onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  userId, 
  currentUser, 
  videos, 
  onLogout, 
  onOpenVideo, 
  onEditProfile, 
  onFollow,
  onMessage,
  onOpenDrafts,
  onBack 
}) => {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'public' | 'liked' | 'private'>('public');
  const [draftCount, setDraftCount] = useState(0);

  const isOwnProfile = userId === currentUser.id;

  useEffect(() => {
    setLoading(true);
    db.getUserById(userId).then(u => {
      setProfileUser(u);
      setLoading(false);
    });

    if (isOwnProfile) {
      db.getDrafts(userId).then(d => setDraftCount(d.length));
    }
  }, [userId, currentUser.followers, currentUser.following]);

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-black">
      <Loader2 className="w-7 h-7 animate-spin text-[#fe2c55]" />
    </div>
  );

  if (!profileUser) return (
    <div className="h-full flex flex-col items-center justify-center bg-black p-6">
      <p className="text-zinc-500 mb-4 text-sm">User not found</p>
      <button onClick={onBack} className="text-[#fe2c55] font-bold text-sm">Go Back</button>
    </div>
  );

  const followersCount = (profileUser.followers || []).length;
  const followingCount = (profileUser.following || []).length;
  const likesCount = profileUser.likesReceived || 0;

  const amIFollowing = (currentUser.following || []).includes(userId);
  const areTheyFollowingMe = (currentUser.followers || []).includes(userId);
  const isMutual = amIFollowing && areTheyFollowingMe;

  const userVideos = videos.filter(v => v.userId === userId);
  const likedVideos = videos.filter(v => (v.likes || []).includes(userId));

  const getDisplayVideos = () => {
    if (activeTab === 'public') return userVideos.filter(v => v.privacy !== 'private');
    if (activeTab === 'liked') return likedVideos;
    if (activeTab === 'private') return userVideos.filter(v => v.privacy === 'private');
    return [];
  };

  const getFollowButtonText = () => {
    if (isMutual) return 'Friends';
    if (amIFollowing) return 'Requested';
    if (areTheyFollowingMe) return 'Follow Back';
    return 'Follow';
  };

  return (
    <div className="h-full bg-black overflow-y-auto no-scrollbar flex flex-col animate-slide-up">
      <div className="p-6 pt-10 flex flex-col items-center border-b border-zinc-900 bg-[#0a0a0a] relative">
        <div className="absolute top-4 left-4">
          <button onClick={onBack} className="p-2 text-zinc-500 hover:text-white transition active:scale-90">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute top-4 right-4">
          {isOwnProfile && (
            <button onClick={onLogout} className="p-2 text-zinc-600 hover:text-white transition active:scale-90">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="w-20 h-20 rounded-full border-2 border-zinc-800 overflow-hidden bg-zinc-900 mb-4 shadow-xl ring-2 ring-[#fe2c55]/10">
          <img src={profileUser.avatar} className="w-full h-full object-cover" alt={profileUser.username} />
        </div>
        
        <div className="text-center mb-1">
          <h1 className="text-lg font-black tracking-tight">@{profileUser.username}</h1>
          <p className="text-[9px] text-zinc-600 font-mono mt-0.5 uppercase tracking-widest">ID: {profileUser.id.substring(0, 8)}</p>
        </div>
        
        <div className="flex space-x-6 mb-6 mt-5">
          <div className="text-center"><span className="block font-black text-md">{followingCount}</span><span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Following</span></div>
          <div className="text-center"><span className="block font-black text-md">{followersCount}</span><span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Followers</span></div>
          <div className="text-center"><span className="block font-black text-md">{likesCount}</span><span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Likes</span></div>
        </div>

        <div className="flex space-x-2 w-full max-w-[240px] mb-5">
          {isOwnProfile ? (
            <>
              <button onClick={onEditProfile} className="flex-1 bg-zinc-800 py-2 rounded-lg font-black text-[12px] transition active:scale-95 border border-zinc-700 uppercase tracking-tight">Edit Profile</button>
              <button className="px-3 bg-zinc-800 rounded-lg transition active:scale-95 border border-zinc-700"><Bookmark className="w-4 h-4 text-zinc-400" /></button>
            </>
          ) : (
            <>
              <button 
                onClick={() => onFollow(userId)} 
                className={`flex-[2] py-2 rounded-lg font-black text-[12px] transition active:scale-95 border flex items-center justify-center space-x-2 uppercase tracking-tight ${
                  amIFollowing ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-[#fe2c55] border-[#fe2c55] text-white'
                }`}
              >
                {amIFollowing ? <UserCheck size={14}/> : <UserPlus size={14}/>}
                <span>{getFollowButtonText()}</span>
              </button>
              {isMutual && (
                <button 
                  onClick={() => onMessage(userId)}
                  className="flex-1 bg-zinc-800 rounded-lg transition active:scale-95 border border-zinc-700 flex items-center justify-center"
                >
                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                </button>
              )}
            </>
          )}
        </div>

        {profileUser.bio && <p className="text-[11px] text-center px-10 text-zinc-500 mb-4 leading-relaxed font-medium italic">"{profileUser.bio}"</p>}
      </div>

      <div className="w-full flex sticky top-0 bg-black z-20 border-b border-zinc-900">
        <button onClick={() => setActiveTab('public')} className={`flex-1 py-3 flex justify-center border-b-2 transition ${activeTab === 'public' ? 'border-white text-white' : 'border-transparent text-zinc-600'}`}><Grid className="w-4 h-4" /></button>
        <button onClick={() => setActiveTab('liked')} className={`flex-1 py-3 flex justify-center border-b-2 transition ${activeTab === 'liked' ? 'border-white text-white' : 'border-transparent text-zinc-600'}`}><Heart className="w-4 h-4" /></button>
        {isOwnProfile && (
          <button onClick={() => setActiveTab('private')} className={`flex-1 py-3 flex justify-center border-b-2 transition ${activeTab === 'private' ? 'border-white text-white' : 'border-transparent text-zinc-600'}`}><Lock className="w-4 h-4" /></button>
        )}
      </div>

      <div className="w-full grid grid-cols-3 gap-0.5 mt-0.5 pb-24 flex-1">
        {isOwnProfile && draftCount > 0 && activeTab === 'public' && (
          <div 
            onClick={onOpenDrafts}
            className="aspect-[3/4] bg-zinc-900/50 relative flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-zinc-800 transition"
          >
             <div className="p-2 bg-zinc-800 rounded-full mb-1">
               <Folder className="w-5 h-5 text-[#fe2c55]" />
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Drafts ({draftCount})</span>
          </div>
        )}

        {getDisplayVideos().map(v => (
          <div key={v.id} onClick={() => onOpenVideo(v.id)} className="aspect-[3/4] bg-zinc-950 relative group overflow-hidden cursor-pointer">
            <video src={v.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" muted />
            <div className="absolute bottom-1 left-2 flex items-center space-x-1 text-[10px] font-bold text-white drop-shadow-md">
              <Play className="w-2.5 h-2.5 fill-white" /><span>{(v.likes || []).length}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileView;
