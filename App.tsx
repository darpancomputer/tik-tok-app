
import React, { useState, useEffect } from 'react';
import { Home, Users, PlusSquare, Inbox, User as UserIcon } from 'lucide-react';
import { AppView, Video, User as UserType } from './types';
import { db } from './services/dbService';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import VideoFeed from './components/VideoFeed';
import ProfileView from './components/ProfileView';
import UploadModal from './components/UploadModal';
import InboxView from './components/InboxView';
import Auth from './components/Auth';
import ChatView from './components/ChatView';
import EditProfile from './components/EditProfile';
import DraftsView from './components/DraftsView';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<AppView>('home');
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<Video | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userData = await db.getUserById(fbUser.uid);
        if (userData) {
          setCurrentUser(userData);
          if (view === 'auth') setView('home');
        }
      } else {
        setCurrentUser(null);
        setView('auth');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [view]);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = db.getVideos((allVideos) => {
        setVideos(allVideos);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setView('auth');
  };

  const handleLoginSuccess = (user: UserType) => {
    setCurrentUser(user);
    setView('home');
  };

  const handleLike = async (videoId: string) => {
    if (!currentUser) return;
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const isLiked = (video.likes || []).includes(currentUser.id);
    const newLikes = isLiked 
      ? video.likes.filter(id => id !== currentUser.id)
      : [...(video.likes || []), currentUser.id];

    const updatedVideo = { ...video, likes: newLikes };
    await db.updateVideo(updatedVideo);
    
    if (!isLiked && video.userId !== currentUser.id) {
      db.addNotification({ 
        fromUserId: currentUser.id, 
        fromUsername: currentUser.username, 
        toUserId: video.userId, 
        type: 'like' 
      });
    }
  };

  const handleFollow = async (targetId: string) => {
    if (!currentUser) return;
    const updatedMe = await db.followUser(currentUser.id, targetId);
    if (updatedMe) {
      setCurrentUser(updatedMe);
    }
  };

  const handleViewProfile = (userId: string) => {
    setSelectedProfileId(userId);
    setView('profile');
  };

  const filteredVideos = videos.filter(v => {
    if (view === 'home') {
      if (v.userId === currentUser?.id) return true;
      return v.privacy === 'everyone';
    }
    if (view === 'friends') {
      const following = currentUser?.following || [];
      const followers = currentUser?.followers || [];
      const mutuals = following.filter(id => followers.includes(id));
      return mutuals.includes(v.userId);
    }
    return true;
  });

  if (authLoading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#fe2c55] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!currentUser || view === 'auth') return <Auth onLogin={handleLoginSuccess} />;

  return (
    <div className="flex flex-col h-screen max-w-[390px] mx-auto bg-black relative shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden border-x border-white/5">
      <main className="flex-1 overflow-hidden relative">
        {(view === 'home' || view === 'friends') && (
          <VideoFeed 
            videos={filteredVideos} 
            onLike={handleLike} 
            onAddComment={async (id, text) => {
              const video = videos.find(v => v.id === id);
              if (video) {
                const newComment = { 
                  id: Math.random().toString(), 
                  userId: currentUser.id, 
                  username: currentUser.username, 
                  text, 
                  timestamp: Date.now() 
                };
                await db.updateVideo({ ...video, comments: [newComment, ...(video.comments || [])] });
              }
            }}
            onFollow={handleFollow}
            onViewProfile={handleViewProfile}
            currentUser={currentUser}
            initialVideoId={selectedVideoId || undefined}
          />
        )}
        {view === 'inbox' && <InboxView currentUser={currentUser} onOpenChat={(uid) => { setActiveChatUserId(uid); setView('chat'); }} />}
        {view === 'chat' && activeChatUserId && <ChatView currentUser={currentUser} targetUserId={activeChatUserId} onBack={() => setView('inbox')} />}
        {view === 'profile' && (
          <ProfileView 
            userId={selectedProfileId || currentUser.id}
            currentUser={currentUser}
            videos={videos}
            onLogout={handleLogout}
            onOpenVideo={(id) => { setSelectedVideoId(id); setView('home'); }}
            onEditProfile={() => setView('edit-profile')}
            onFollow={handleFollow}
            onMessage={(uid) => { setActiveChatUserId(uid); setView('chat'); }}
            onOpenDrafts={() => setView('drafts')}
            onBack={() => { setView('home'); setSelectedProfileId(null); }}
          />
        )}
        {view === 'edit-profile' && <EditProfile user={currentUser} onSave={(updated) => { setCurrentUser(updated); setView('profile'); }} onCancel={() => setView('profile')} />}
        {view === 'drafts' && <DraftsView user={currentUser} onBack={() => setView('profile')} onSelectDraft={(d) => { setSelectedDraft(d); setIsUploadOpen(true); }} />}
      </main>

      {view !== 'chat' && view !== 'edit-profile' && view !== 'drafts' && (
        <nav className="h-[58px] bg-black/98 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-8 z-[100] pb-safe">
          <button onClick={() => { setView('home'); setSelectedVideoId(null); setSelectedProfileId(null); }} className={`flex flex-col items-center transition-all ${view === 'home' ? 'text-white' : 'text-zinc-600'}`}>
            <Home className={`w-4.5 h-4.5 mb-1 ${view === 'home' ? 'fill-white' : ''}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => { setView('friends'); setSelectedProfileId(null); }} className={`flex flex-col items-center transition-all ${view === 'friends' ? 'text-white' : 'text-zinc-600'}`}>
            <Users className={`w-4.5 h-4.5 mb-1 ${view === 'friends' ? 'fill-white' : ''}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Friends</span>
          </button>
          <button onClick={() => { setSelectedDraft(undefined); setIsUploadOpen(true); }} className="active:scale-95 transition-transform transform -translate-y-0.5">
            <div className="w-10 h-7 bg-white rounded-md flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-y-0 left-0 w-1.5 bg-[#fe2c55]"></div>
               <div className="absolute inset-y-0 right-0 w-1.5 bg-[#25f4ee]"></div>
               <PlusSquare className="w-4 h-4 text-black relative z-10" />
            </div>
          </button>
          <button onClick={() => { setView('inbox'); setSelectedProfileId(null); }} className={`flex flex-col items-center transition-all ${view === 'inbox' ? 'text-white' : 'text-zinc-600'}`}>
            <Inbox className={`w-4.5 h-4.5 mb-1 ${view === 'inbox' ? 'fill-white' : ''}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Inbox</span>
          </button>
          <button onClick={() => { setView('profile'); setSelectedProfileId(currentUser.id); }} className={`flex flex-col items-center transition-all ${view === 'profile' && selectedProfileId === currentUser.id ? 'text-white' : 'text-zinc-600'}`}>
            <UserIcon className={`w-4.5 h-4.5 mb-1 ${view === 'profile' && selectedProfileId === currentUser.id ? 'fill-white' : ''}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
          </button>
        </nav>
      )}

      {isUploadOpen && (
        <UploadModal 
          initialVideo={selectedDraft}
          onClose={() => { setIsUploadOpen(false); setSelectedDraft(undefined); }} 
          onUpload={() => { setIsUploadOpen(false); setSelectedDraft(undefined); setView('home'); }} 
          user={currentUser}
        />
      )}
    </div>
  );
};

export default App;
