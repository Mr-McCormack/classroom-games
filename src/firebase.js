// Firebase: the same project as Hall Pass. Games live in their own "buzz" section of the database,
// which never touches Hall Pass's data. These settings aren't passwords; the security rules protect the data.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeFirestore, doc, collection, getDoc, setDoc, updateDoc, deleteDoc, addDoc, onSnapshot, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
const firebaseConfig = {
  apiKey: "AIzaSyCeHZwTuSiQRtfhuAOoqKRVX_bs12U0SV4",
  authDomain: "hall-pass-5cf96.firebaseapp.com",
  projectId: "hall-pass-5cf96",
  storageBucket: "hall-pass-5cf96.firebasestorage.app",
  messagingSenderId: "483428602738",
  appId: "1:483428602738:web:d403721361c5d911b9c3eb"
};
const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
// Long polling gets through school web filters that block Firebase's normal streaming connection.
const db = initializeFirestore(fbApp, { experimentalForceLongPolling: true });
const roomRef = code => doc(db, 'buzz', code);
const pressCol = code => collection(db, 'buzz', code, 'presses');
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
