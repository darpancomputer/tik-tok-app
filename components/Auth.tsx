
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../services/dbService';
import { User } from '../types';
import { Sparkles, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const userData = await db.getUserById(userCredential.user.uid);
        if (userData) {
          onLogin(userData);
        } else {
          const fallback: User = {
            id: userCredential.user.uid,
            username: email.split('@')[0],
            email: email.trim(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userCredential.user.uid}`,
            followers: [],
            following: [],
            likesReceived: 0,
            bio: 'Pulse Explorer'
          };
          await db.saveUser(fallback);
          onLogin(fallback);
        }
      } else {
        if (!username.trim()) {
          setError('Username is required.');
          setLoading(false);
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const newUser: User = {
          id: userCredential.user.uid,
          username: username.trim(),
          email: email.trim(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          followers: [],
          following: [],
          likesReceived: 0,
          bio: 'Hey! I just joined Pulse.'
        };
        
        await db.saveUser(newUser);
        onLogin(newUser);
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-black">
      <div className="mb-10 text-center">
        <div className="relative inline-block mb-3">
          <Sparkles className="w-10 h-10 text-[#fe2c55] drop-shadow-[0_0_10px_rgba(254,44,85,0.4)]" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter italic bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">PULSE</h1>
        <p className="text-zinc-600 text-[9px] mt-2 font-black uppercase tracking-[0.3em]">Network</p>
      </div>

      <div className="w-full max-w-[320px] space-y-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] rounded-xl text-center font-black">
              {error}
            </div>
          )}
          
          {!isLogin && (
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4 transition" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-[#fe2c55] transition text-sm font-medium"
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4 transition" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-[#fe2c55] transition text-sm font-medium"
            />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4 transition" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-[#fe2c55] transition text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#fe2c55] text-white py-3.5 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center mt-4 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'SIGN IN' : 'SIGN UP')}
          </button>
        </form>

        <div className="pt-2 flex flex-col items-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-zinc-500 text-[11px] hover:text-white transition font-black tracking-tight"
          >
            {isLogin ? "NEW TO PULSE? JOIN NOW" : "ALREADY A MEMBER? LOG IN"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
