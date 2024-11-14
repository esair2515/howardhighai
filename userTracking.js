import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAkCYA0qurlOCUqHbMDNCynRmFy469M1uQ",
  authDomain: "howard-ai-hackathon.firebaseapp.com",
  projectId: "howard-ai-hackathon",
  storageBucket: "howard-ai-hackathon.firebasestorage.app",
  messagingSenderId: "755448593026",
  appId: "1:755448593026:web:14c2e952298a8270a3d29b",
  measurementId: "G-JNW926D6LK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Add console logs for debugging
onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed:', user);
    if (user) {
        try {
            // Log user visit
            console.log('Attempting to log user data...');
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                lastVisit: serverTimestamp()
            }, { merge: true });
            console.log('User data logged successfully');

            // Log page visit
            await setDoc(doc(db, 'userActivity', `${user.uid}_${Date.now()}`), {
                userId: user.uid,
                email: user.email,
                timestamp: serverTimestamp(),
                type: 'pageView',
                page: window.location.pathname
            });
            console.log('Activity logged successfully');
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }
});
