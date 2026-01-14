
import { User, Video, Notification, Chat, Message } from '../types';
import { db_realtime, auth } from './firebase';
import { ref, set, get, update, push, onValue, remove } from "firebase/database";

export const db = {
  // --- USER METHODS ---
  saveUser: async (user: User) => {
    try {
      const userRef = ref(db_realtime, `users/${user.id}`);
      const safeUser = {
        ...user,
        followers: Array.from(new Set(user.followers || [])),
        following: Array.from(new Set(user.following || [])),
        likesReceived: user.likesReceived || 0
      };
      await set(userRef, safeUser);
    } catch (error) {
      console.error("Save User Error:", error);
    }
  },

  getUserById: async (id: string): Promise<User | null> => {
    try {
      const userRef = ref(db_realtime, `users/${id}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          ...data,
          followers: Array.isArray(data.followers) ? data.followers : [],
          following: Array.isArray(data.following) ? data.following : [],
          likesReceived: data.likesReceived || 0
        };
      }
      return null;
    } catch (error) {
      console.error("Get User Error:", error);
      return null;
    }
  },

  // --- FRIEND REQUEST / FOLLOW BACK METHODS ---
  followUser: async (myId: string, targetId: string) => {
    if (myId === targetId) return;
    try {
      const me = await db.getUserById(myId);
      const them = await db.getUserById(targetId);
      if (!me || !them) return;

      const isFollowing = (me.following || []).includes(targetId);

      if (isFollowing) {
        me.following = (me.following || []).filter(id => id !== targetId);
        them.followers = (them.followers || []).filter(id => id !== myId);
      } else {
        me.following = Array.from(new Set([...(me.following || []), targetId]));
        them.followers = Array.from(new Set([...(them.followers || []), myId]));
        
        const areTheyFollowingMe = (me.followers || []).includes(targetId);
        if (!areTheyFollowingMe) {
          await db.addNotification({
            fromUserId: me.id,
            fromUsername: me.username,
            toUserId: them.id,
            type: 'friend_request'
          });
        } else {
          await db.addNotification({
            fromUserId: me.id,
            fromUsername: me.username,
            toUserId: them.id,
            type: 'follow'
          });
        }
      }

      await db.saveUser(me);
      await db.saveUser(them);
      return me;
    } catch (error) {
      console.error("Follow User Error:", error);
    }
  },

  acceptFriendRequest: async (notif: Notification) => {
    await db.followUser(notif.toUserId, notif.fromUserId);
    await remove(ref(db_realtime, `notifications/${notif.toUserId}/${notif.id}`));
  },

  rejectFriendRequest: async (notif: Notification) => {
    await remove(ref(db_realtime, `notifications/${notif.toUserId}/${notif.id}`));
  },

  // --- VIDEO METHODS ---
  getVideos: (callback: (videos: Video[]) => void) => {
    const videosRef = ref(db_realtime, 'videos');
    return onValue(videosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = (Object.values(data) as Video[]).map(v => ({
          ...v,
          likes: Array.isArray(v.likes) ? v.likes : [],
          comments: Array.isArray(v.comments) ? v.comments : []
        }));
        callback(list.filter(v => !v.isDraft).sort((a, b) => b.timestamp - a.timestamp));
      } else {
        callback([]);
      }
    });
  },
  
  saveVideo: async (video: Video) => {
    const videosRef = ref(db_realtime, `videos/${video.id}`);
    await set(videosRef, video);
  },

  updateVideo: async (video: Video) => {
    const videoRef = ref(db_realtime, `videos/${video.id}`);
    await set(videoRef, video);
  },

  // --- DRAFT METHODS ---
  saveDraft: async (video: Video) => {
    const draftRef = ref(db_realtime, `drafts/${video.userId}/${video.id}`);
    await set(draftRef, { ...video, isDraft: true });
  },

  getDrafts: async (userId: string): Promise<Video[]> => {
    const draftsRef = ref(db_realtime, `drafts/${userId}`);
    const snapshot = await get(draftsRef);
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  },

  deleteDraft: async (userId: string, videoId: string) => {
    await remove(ref(db_realtime, `drafts/${userId}/${videoId}`));
  },

  // --- NOTIFICATION METHODS ---
  addNotification: async (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    try {
      const existingRef = ref(db_realtime, `notifications/${notif.toUserId}`);
      const snapshot = await get(existingRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const existing = Object.values(data) as Notification[];
        const isDuplicate = existing.some(n => 
          n.fromUserId === notif.fromUserId && 
          n.type === notif.type && 
          !n.read
        );
        if (isDuplicate) return;
      }

      const notifRef = push(ref(db_realtime, `notifications/${notif.toUserId}`));
      const newNotif: Notification = {
        ...notif,
        id: notifRef.key || Math.random().toString(),
        timestamp: Date.now(),
        read: false
      };
      await set(notifRef, newNotif);
    } catch (e) {
      console.warn("Notification skipped:", e);
    }
  },

  getNotifications: (userId: string, callback: (notifs: Notification[]) => void) => {
    const notifRef = ref(db_realtime, `notifications/${userId}`);
    return onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data) as Notification[];
        callback(list.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        callback([]);
      }
    });
  },

  // --- CHAT METHODS ---
  getChatWith: async (userA: string, userB: string): Promise<Chat> => {
    const chatId = [userA, userB].sort().join('_');
    const chatRef = ref(db_realtime, `chats/${chatId}`);
    const snapshot = await get(chatRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      const newChat: Chat = { id: chatId, participants: [userA, userB], messages: [] };
      await set(chatRef, newChat);
      return newChat;
    }
  },

  subscribeToChat: (chatId: string, callback: (chat: Chat) => void) => {
    const chatRef = ref(db_realtime, `chats/${chatId}`);
    return onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) callback(snapshot.val());
    });
  },

  sendMessage: async (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const chatMsgRef = push(ref(db_realtime, `chats/${chatId}/messages`));
    const newMessage: Message = { ...message, id: chatMsgRef.key || Math.random().toString(), timestamp: Date.now() };
    await set(chatMsgRef, newMessage);
  },

  getCurrentUser: () => auth.currentUser,
};
