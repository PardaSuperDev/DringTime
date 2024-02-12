import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyADkVmRSqXomcAa7UkazwPRR054seizJLo",
    authDomain: "timer-sonneries.firebaseapp.com",
    projectId: "timer-sonneries",
    storageBucket: "timer-sonneries.appspot.com",
    messagingSenderId: "201048811347",
    appId: "1:201048811347:web:646f7f60249e2332d463a6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

db.settings = { timestampsInSnapshots: true };

const citySnapshot = await getDocs(collection(db, "horaires-sonneries"));

export function getAlarmsProviders() {
    var providers = [];
    citySnapshot.forEach(doc => {
        console.log(doc.id);
    });
    return providers;
}