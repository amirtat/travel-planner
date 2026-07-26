import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDndNvz8bRuixvEActwn1FyHzpdrE9rupY",
  authDomain: "travel-planner-87995.firebaseapp.com",
  projectId: "travel-planner-87995",
  storageBucket: "travel-planner-87995.firebasestorage.app",
  messagingSenderId: "225372637382",
  appId: "1:225372637382:web:c813ec37ee87ae7cedefc7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
