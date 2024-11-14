import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    // Your existing Firebase config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

class UserTracker {
    constructor() {
        this.startTime = Date.now();
        this.events = [];
        this.setupTracking();
    }

    async logUserActivity(type, data = {}) {
        const user = auth.currentUser;
        if (!user) return;

        const event = {
            timestamp: serverTimestamp(),
            type,
            data,
            url: window.location.pathname,
            userEmail: user.email
        };

        try {
            // Log to user's activity collection
            await setDoc(doc(db, 'userActivity', `${user.uid}_${Date.now()}`), event);
            
            // Update user's last active timestamp
            await updateDoc(doc(db, 'users', user.uid), {
                lastActive: serverTimestamp(),
                timeSpent: Math.floor((Date.now() - this.startTime) / 1000)
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    setupTracking() {
        // Page view tracking
        this.logUserActivity('pageView');

        // Mouse movement
        document.addEventListener('mousemove', this.throttle(() => {
            this.logUserActivity('mouseActivity');
        }, 5000));

        // Challenge interaction
        document.querySelectorAll('.challenge-card').forEach(card => {
            card.addEventListener('click', () => {
                this.logUserActivity('challengeInteraction', {
                    challengeId: card.dataset.challengeId
                });
            });
        });

        // Track time spent
        setInterval(() => {
            this.logUserActivity('timeUpdate', {
                totalTime: Math.floor((Date.now() - this.startTime) / 1000)
            });
        }, 60000); // Update every minute
    }

    throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize tracking when user is authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.userTracker = new UserTracker();
        // Create/update user document
        setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            lastLogin: serverTimestamp()
        }, { merge: true });
    }
});
