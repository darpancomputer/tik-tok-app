
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDB4hSVSwxe7rkgduu9HzYAFQpxfQ0DR0I",
  authDomain: "darpan-235a8.firebaseapp.com",
  databaseURL: "https://darpan-235a8-default-rtdb.firebaseio.com",
  projectId: "darpan-235a8",
  storageBucket: "darpan-235a8.firebasestorage.app",
  messagingSenderId: "270558937002",
  appId: "1:270558937002:web:062f0feac5987040a275d3",
  measurementId: "G-W4EDNGRY1W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db_realtime = getDatabase(app);
