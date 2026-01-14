
import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, UserPlus, BellOff, ChevronRight, ShieldCheck, Fingerprint, X, UserCheck, Loader2 } from 'lucide-react';
import { db } from '../services/dbService';
import { User, Notification } from '../types';

interface InboxViewProps {
  currentUser: User;
  onOpenChat: (userId: string) => void;
}

const InboxView: React.FC<InboxViewProps> = ({ currentUser, onOpenChat }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  useEffect(() => {
    const unsubscribe = db.getNotifications(currentUser.id, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [currentUser.id]);

  // Mutual friends are those who follow each other
  const following = currentUser.following || [];
  const followers = currentUser.followers || [];
  const mutuals = following.filter(id => followers.includes(id));
  
  // De-duplicate friend requests by fromUserId (show only the latest one per user)
  const friendRequestsMap = notifications.filter(n => n.type === 'friend_request').reduce((acc, current) => {
    if (!acc[current.fromUserId] || acc[current.fromUserId].timestamp < current.timestamp) {
      acc[current.fromUserId] = current;
    }
    return acc;
  }, {} as Record<string, Notification>);
  
  // Added explicit type casting for friendRequests to resolve 'unknown' type errors from Object.values
  const friendRequests = Object.values(friendRequestsMap) as Notification[];
  const activity = notifications.filter(n => n.type !== 'friend_request');

  const handleFollowBack = async (notif: Notification) => {
    setProcessingId(notif.id);
    await db.acceptFriendRequest(notif);
    setProcessingId(null);
  };

  return (
    <div className="h-full bg-black overflow-y-auto no-scrollbar flex flex-col pb-24">
      <div className="p-6 border-b border-zinc-800 bg-[#0a0a0a]">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">Inbox</h1>
          <ShieldCheck className="text-[#25f4ee] w-5 h-5" />
        </div>
        <div className="flex items-center space-x-2 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
           <Fingerprint size={12} className="text-[#fe2c55]" />
           <span className="text-[9px] font-mono text-zinc-400 truncate">LOGGED_UID: {currentUser.id}</span>
        </div>
      </div>

      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="p-4 border-b border-zinc-900">
          <h2 className="text-xs text-[#fe2c55] uppercase font-black tracking-widest mb-4 px-2">Follow Requests</h2>
          <div className="space-y-3">
            {friendRequests.map(notif => (
              <div key={notif.id} className="p-4 flex items-center justify-between bg-zinc-900/40 rounded-2xl border border-zinc-800 transition hover:bg-zinc-900/60">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.fromUserId}`} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">@{notif.fromUsername}</p>
                    <p className="text-[10px] text-zinc-500">Started following you</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleFollowBack(notif)} 
                    disabled={processingId === notif.id}
                    className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-[#fe2c55] rounded-lg text-white text-[10px] font-bold shadow-lg active:scale-95 transition disabled:opacity-50 min-w-[90px]"
                  >
                    {processingId === notif.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={12} />
                        <span>Follow Back</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => db.rejectFriendRequest(notif)} 
                    className="p-1.5 bg-zinc-800 rounded-lg text-white active:scale-95 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct Messages */}
      <div className="p-4">
        <h2 className="text-xs text-zinc-500 uppercase font-black tracking-widest mb-4 px-2">Friends</h2>
        {mutuals.length === 0 ? (
          <div className="px-6 py-8 text-sm text-zinc-600 italic bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800 text-center">
            Friends will appear here once you follow each other back.
          </div>
        ) : (
          <div className="space-y-1">
            {mutuals.map(mid => (
              <MutualItem key={mid} mid={mid} onOpenChat={onOpenChat} />
            ))}
          </div>
        )}
      </div>

      {/* Activity Notifications */}
      <div className="p-4 border-t border-zinc-900 mt-2">
        <h2 className="text-xs text-zinc-500 uppercase font-black tracking-widest mb-4 px-2">Recent Activity</h2>
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-10">
            <BellOff size={48} />
            <p className="mt-2 text-sm">No new activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map(notif => (
              <div key={notif.id} className="p-4 flex items-center space-x-4 bg-zinc-900/30 hover:bg-zinc-900/60 transition rounded-2xl border border-zinc-800/30">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 shrink-0 relative">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.fromUserId}`} className="w-full h-full object-cover" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black border border-zinc-800 flex items-center justify-center">
                    {notif.type === 'like' && <Heart className="w-2.5 h-2.5 text-[#fe2c55] fill-[#fe2c55]" />}
                    {notif.type === 'follow' && <UserCheck className="w-2.5 h-2.5 text-[#25f4ee]" />}
                    {notif.type === 'comment' && <MessageSquare className="w-2.5 h-2.5 text-zinc-400" />}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-bold">@{notif.fromUsername}</span>
                    <span className="text-zinc-400"> {
                      notif.type === 'like' ? 'liked your video' : 
                      notif.type === 'follow' ? 'became your friend!' : 
                      'commented on your video'
                    }</span>
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MutualItem: React.FC<{ mid: string, onOpenChat: (id: string) => void }> = ({ mid, onOpenChat }) => {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    db.getUserById(mid).then(setUser);
  }, [mid]);

  if (!user) return <div className="h-16 w-full animate-pulse bg-zinc-900 rounded-2xl"></div>;

  return (
    <div onClick={() => onOpenChat(user.id)} className="flex items-center p-4 hover:bg-zinc-900 rounded-2xl cursor-pointer group transition border border-transparent hover:border-zinc-800">
      <div className="relative">
        <img src={user.avatar} className="w-12 h-12 rounded-full object-cover mr-4 ring-2 ring-zinc-800 shadow-lg" />
        <div className="absolute bottom-0 right-4 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black"></div>
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm">@{user.username}</p>
        <p className="text-[10px] text-zinc-500 truncate">Say hello to your friend!</p>
      </div>
      <div className="flex items-center text-[#25f4ee] space-x-1 opacity-0 group-hover:opacity-100 transition">
        <ChevronRight size={14} />
      </div>
    </div>
  );
};

export default InboxView;
