
import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/dbService';
import { Camera, ArrowLeft, Loader2, Check } from 'lucide-react';

interface EditProfileProps {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ user, onSave, onCancel }) => {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [bio, setBio] = useState(user.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) return;
    setIsSaving(true);
    
    const updated: User = { 
      ...user, 
      username: username.trim(), 
      avatar: avatar.trim(), 
      bio: bio.trim() 
    };
    
    try {
      await db.saveUser(updated);
      setSaved(true);
      setTimeout(() => {
        onSave(updated);
      }, 800);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full bg-black text-white flex flex-col animate-slide-up">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-zinc-800 bg-black/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onCancel} className="p-2 -ml-2 hover:bg-zinc-900 rounded-full transition">
          <ArrowLeft />
        </button>
        <h2 className="flex-1 text-center font-bold">Edit Profile</h2>
        <button 
          onClick={handleSave} 
          disabled={isSaving || saved}
          className={`font-bold px-4 py-1 rounded-full transition flex items-center space-x-2 ${
            saved ? 'bg-green-500 text-white' : 'text-[#fe2c55] hover:bg-[#fe2c55]/10'
          }`}
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : 'Save'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
        {/* Profile Photo */}
        <div className="flex flex-col items-center group">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-2xl transition group-hover:border-[#fe2c55]">
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
              <Camera size={24} />
            </div>
            <button className="absolute bottom-1 right-1 p-2 bg-[#fe2c55] rounded-full text-white shadow-lg border-4 border-black active:scale-90 transition">
              <Camera size={14} />
            </button>
          </div>
          <p className="mt-4 text-xs text-zinc-500 font-medium">Change profile photo</p>
        </div>

        {/* Form Fields */}
        <div className="w-full space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Username</label>
            <input 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Your username"
              className="w-full bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 focus:border-[#fe2c55] focus:bg-zinc-900 outline-none transition text-sm font-medium" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Avatar URL</label>
            <input 
              value={avatar} 
              onChange={e => setAvatar(e.target.value)} 
              placeholder="https://..."
              className="w-full bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 focus:border-[#fe2c55] focus:bg-zinc-900 outline-none transition text-sm font-mono" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Bio</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              placeholder="Tell the world about yourself..."
              className="w-full bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 focus:border-[#fe2c55] focus:bg-zinc-900 outline-none transition h-32 resize-none text-sm leading-relaxed" 
            />
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900">
          <p className="text-[10px] text-zinc-600 text-center leading-loose">
            Your Account ID: <span className="font-mono">{user.id}</span><br/>
            Linked Email: <span className="font-mono">{user.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
