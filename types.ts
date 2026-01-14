
export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  followers: string[]; 
  following: string[]; 
  likesReceived: number;
  bio?: string;
  password?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  participants: [string, string];
  messages: Message[];
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface Video {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  url: string;
  caption: string;
  likes: string[]; 
  comments: Comment[];
  shares: number;
  timestamp: number;
  privacy: 'everyone' | 'friends' | 'private';
  isDraft?: boolean;
  musicTitle?: string;
}

export interface Notification {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  type: 'like' | 'follow' | 'comment' | 'message' | 'friend_request';
  timestamp: number;
  read: boolean;
}

export type AppView = 'home' | 'friends' | 'upload' | 'inbox' | 'profile' | 'auth' | 'chat' | 'edit-profile' | 'drafts';
