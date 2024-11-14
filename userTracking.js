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

class CheatDetector {
    constructor(userId, email) {
        this.userId = userId;
        this.email = email;
        this.sessionStart = Date.now();
        this.setupEventListeners();
    }

    async logEvent(eventType, details = {}) {
        try {
            const docId = `${this.userId}_${Date.now()}`;
            await setDoc(doc(db, 'userActivity', docId), {
                userId: this.userId,
                email: this.email,
                timestamp: serverTimestamp(),
                eventType,
                details,
                sessionDuration: Math.floor((Date.now() - this.sessionStart) / 1000),
                page: window.location.pathname
            });
        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    setupEventListeners() {
        // Track tab visibility changes
        document.addEventListener('visibilitychange', () => {
            this.logEvent('tabSwitch', {
                hidden: document.hidden,
                time: new Date().toISOString()
            });
        });

        // Track copy/paste events
        document.addEventListener('copy', () => {
            this.logEvent('copy', {
                action: 'copied',
                time: new Date().toISOString()
            });
        });

        document.addEventListener('paste', () => {
            this.logEvent('paste', {
                action: 'pasted',
                time: new Date().toISOString()
            });
        });

        // Track mouse leaving window
        document.addEventListener('mouseout', (e) => {
            if (e.relatedTarget === null) {
                this.logEvent('mouseLeave', {
                    time: new Date().toISOString()
                });
            }
        });

        // Track keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && 
                ['c', 'v', 'f', 't', 'n'].includes(e.key.toLowerCase())) {
                this.logEvent('keyboardShortcut', {
                    key: e.key,
                    ctrl: e.ctrlKey,
                    meta: e.metaKey,
                    time: new Date().toISOString()
                });
            }
        });

        // Track challenge interactions
        document.querySelectorAll('.challenge-card').forEach(card => {
            card.addEventListener('click', () => {
                this.logEvent('challengeInteraction', {
                    challengeId: card.dataset.challengeId,
                    time: new Date().toISOString()
                });
            });
        });

        // Track session start and end
        this.logEvent('sessionStart');
        window.addEventListener('beforeunload', () => {
            this.logEvent('sessionEnd');
        });
    }
}

// Initialize tracking when user is authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.cheatDetector = new CheatDetector(user.uid, user.email);
        
        // Log initial user data
        setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            lastLogin: serverTimestamp(),
            sessionStart: new Date().toISOString()
        }, { merge: true });
    }
});
