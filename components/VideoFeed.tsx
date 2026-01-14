
import React, { useRef, useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Music, Facebook, Instagram, Send, Lock, Globe, Users as UsersIcon } from 'lucide-react';
import { Video, User } from '../types';
import { db } from '../services/dbService';
import CommentSection from './CommentSection';

interface VideoFeedProps {
  videos: Video[];
  onLike: (id: string) => void;
  onAddComment: (id: string, text: string) => void;
  onFollow: (id: string) => void;
  onViewProfile: (userId: string) => void;
  currentUser: User;
  initialVideoId?: string;
}

const VideoCard: React.FC<{ 
  video: Video; 
  onLike: () => void;
  onAddComment: (text: string) => void;
  onFollow: () => void;
  onViewProfile: () => void;
  currentUser: User;
  isActive: boolean;
}> = ({ video, onLike, onAddComment, onFollow, onViewProfile, currentUser, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const isLiked = (video.likes || []).includes(currentUser.id);
  const isFollowing = (currentUser.following || []).includes(video.userId);

  useEffect(() => {
    if (isActive && videoRef.current) { 
      videoRef.current.play().catch(() => {}); 
      setIsPlaying(true); 
    } else if (videoRef.current) { 
      videoRef.current.pause(); 
      setIsPlaying(false); 
    }
  }, [isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handlePrivacyChange = (privacy: Video['privacy']) => {
    const updated = { ...video, privacy };
    db.updateVideo(updated);
    setIsShareOpen(false);
  };

  return (
    <div className="relative w-full h-full snap-start bg-black overflow-hidden flex items-center justify-center">
      <video 
        ref={videoRef} 
        src={video.url} 
        loop 
        playsInline 
        muted={!isActive}
        className="h-full w-full object-cover cursor-pointer" 
        onClick={togglePlay} 
      />

      <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10" />

      {/* Action buttons moved lower down closer to the nav bar */}
      <div className="absolute right-3 bottom-[82px] flex flex-col items-center space-y-5 z-20">
        <div className="relative mb-1">
          <div onClick={onViewProfile} className="w-9 h-9 rounded-full border border-white/40 overflow-hidden bg-zinc-900 cursor-pointer shadow-xl active:scale-90 transition">
            <img src={video.userAvatar} className="w-full h-full object-cover" alt={video.username} />
          </div>
          {video.userId !== currentUser.id && !isFollowing && (
            <button onClick={onFollow} className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#fe2c55] rounded-full p-0.5 text-white shadow-lg border border-black">
              <div className="text-[9px] font-black leading-none px-0.5">+</div>
            </button>
          )}
        </div>

        <button onClick={onLike} className="flex flex-col items-center">
          <Heart className={`w-6.5 h-6.5 drop-shadow-lg transition-transform active:scale-125 ${isLiked ? 'text-[#fe2c55] fill-[#fe2c55]' : 'text-white'}`} />
          <span className="text-[9px] font-black text-white mt-0.5">{(video.likes || []).length}</span>
        </button>

        <button onClick={() => setIsCommentOpen(true)} className="flex flex-col items-center">
          <MessageCircle className="w-6.5 h-6.5 text-white drop-shadow-lg active:scale-110 transition" />
          <span className="text-[9px] font-black text-white mt-0.5">{(video.comments || []).length}</span>
        </button>

        <button onClick={() => setIsShareOpen(true)} className="flex flex-col items-center">
          <Share2 className="w-6.5 h-6.5 text-white drop-shadow-lg active:scale-110 transition" />
          <span className="text-[9px] font-black text-white mt-0.5">{video.shares || 0}</span>
        </button>
      </div>

      {/* Caption & Info moved down closer to the nav bar */}
      <div className="absolute bottom-[76px] left-4 right-16 z-20 space-y-1.5 pointer-events-none">
        <div className="flex items-center space-x-2 pointer-events-auto">
          <h3 onClick={onViewProfile} className="font-black text-[14px] text-white drop-shadow-lg cursor-pointer hover:underline tracking-tight">@{video.username}</h3>
          <div className="px-1.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/5 flex items-center space-x-1">
            {video.privacy === 'everyone' ? <Globe size={8} className="text-white" /> : video.privacy === 'friends' ? <UsersIcon size={8} className="text-[#25f4ee]" /> : <Lock size={8} className="text-zinc-400" />}
            <span className="text-[7px] font-black uppercase text-white/80 tracking-widest">{video.privacy}</span>
          </div>
        </div>
        
        <div className="pointer-events-auto max-w-full">
          <p className="text-[12px] font-medium text-white/95 leading-snug drop-shadow-md">
            {video.caption}
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full w-fit border border-white/5 pointer-events-auto">
          <div className="animate-spin-slow">
            <Music className="w-2.5 h-2.5 text-[#fe2c55]" />
          </div>
          <span className="text-[8px] font-black text-white/70 truncate max-w-[110px] uppercase tracking-tighter">
            {video.musicTitle || `Original Sound`}
          </span>
        </div>
      </div>

      {isShareOpen && (
        <div className="absolute inset-0 z-[110] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsShareOpen(false)} />
          <div className="bg-zinc-950 rounded-t-[1rem] p-5 z-10 animate-slide-up border-t border-white/10 pb-8">
            <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-5" />
            <h4 className="font-black text-center mb-6 uppercase tracking-[0.2em] text-[8px] text-zinc-600">Share</h4>
            <div className="flex justify-around mb-6 border-b border-white/5 pb-6">
              <button className="flex flex-col items-center space-y-1.5"><div className="w-11 h-11 bg-green-500 rounded-lg flex items-center justify-center"><Send className="w-5 h-5 text-white" /></div><span className="text-[8px] font-black uppercase">WA</span></button>
              <button className="flex flex-col items-center space-y-1.5"><div className="w-11 h-11 bg-blue-600 rounded-lg flex items-center justify-center"><Facebook className="w-5 h-5 text-white" /></div><span className="text-[8px] font-black uppercase">FB</span></button>
              <button className="flex flex-col items-center space-y-1.5"><div className="w-11 h-11 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-lg flex items-center justify-center"><Instagram className="w-5 h-5 text-white" /></div><span className="text-[8px] font-black uppercase">IG</span></button>
            </div>
            {video.userId === currentUser.id && (
              <div className="space-y-3">
                <h4 className="font-black text-[8px] text-zinc-700 uppercase tracking-widest px-1">Privacy</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handlePrivacyChange('everyone')} className={`flex flex-col items-center p-2 rounded-lg border transition-all ${video.privacy === 'everyone' ? 'border-[#fe2c55] bg-[#fe2c55]/10 text-[#fe2c55]' : 'border-zinc-800 text-zinc-600'}`}><Globe className="w-4 h-4 mb-0.5" /><span className="text-[7px] font-black">PUBLIC</span></button>
                  <button onClick={() => handlePrivacyChange('friends')} className={`flex flex-col items-center p-2 rounded-lg border transition-all ${video.privacy === 'friends' ? 'border-[#25f4ee] bg-[#25f4ee]/10 text-[#25f4ee]' : 'border-zinc-800 text-zinc-600'}`}><UsersIcon className="w-4 h-4 mb-0.5" /><span className="text-[7px] font-black">FRIENDS</span></button>
                  <button onClick={() => handlePrivacyChange('private')} className={`flex flex-col items-center p-2 rounded-lg border transition-all ${video.privacy === 'private' ? 'border-white bg-white/10 text-white' : 'border-zinc-800 text-zinc-600'}`}><Lock className="w-4 h-4 mb-0.5" /><span className="text-[7px] font-black">PRIVATE</span></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isCommentOpen && <CommentSection comments={video.comments || []} onClose={() => setIsCommentOpen(false)} onAddComment={onAddComment} />}
    </div>
  );
};

const VideoFeed: React.FC<VideoFeedProps> = ({ videos, onLike, onAddComment, onFollow, onViewProfile, currentUser, initialVideoId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (initialVideoId && containerRef.current) {
      const idx = videos.findIndex(v => v.id === initialVideoId);
      if (idx > -1) { 
        containerRef.current.children[idx]?.scrollIntoView({ behavior: 'auto' }); 
        setActiveIndex(idx); 
      }
    }
  }, [initialVideoId, videos]);

  return (
    <div 
      ref={containerRef} 
      onScroll={(e) => setActiveIndex(Math.round(e.currentTarget.scrollTop / e.currentTarget.clientHeight))} 
      className="h-full snap-y snap-mandatory overflow-y-scroll no-scrollbar bg-black"
    >
      {videos.map((video, i) => (
        <VideoCard 
          key={video.id} 
          video={video} 
          onLike={() => onLike(video.id)} 
          onAddComment={(text) => onAddComment(video.id, text)} 
          onFollow={() => onFollow(video.userId)} 
          onViewProfile={() => onViewProfile(video.userId)}
          currentUser={currentUser} 
          isActive={i === activeIndex} 
        />
      ))}
      {videos.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-zinc-900">
          <Music className="w-10 h-10 mb-4 animate-pulse opacity-10" />
          <p className="font-black text-[7px] uppercase tracking-[0.4em] opacity-10">Pulse Search</p>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
