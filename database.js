import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"

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

const alarmsRef = collection(db, "horaires-sonneries");

export async function getAlarmsProviders() {
    const alarmsSnapshot = await getDocs(alarmsRef);
    var providers = [];
    alarmsSnapshot.forEach(doc => {
        providers.push(doc.id);
    });
    return providers;
}
async function sendNewAlarms(name, data) {
    await setDoc(doc(db, "horaires-sonneries", name), {
        data: data,
        user_uid: user_uid,
    });
}

async function getAlarmsList(name) {
    const alarmsSnapshot = await getDoc(doc(db, "horaires-sonneries", name));
    var alarmsData = alarmsSnapshot.data()["data"];
    console.log(alarmsData);
    var days = alarmsData.split("-");
    var alarms = [];
    days.forEach((item) => {
        let dayAlarms = item.split(";");
        if (dayAlarms.lenght === 0 || dayAlarms[0] == "") {
            alarms.push([]);
        } else alarms.push(dayAlarms[dayAlarms.lenght - 1] === "" ? dayAlarms.slice(0, dayAlarms.lenght - 1) : dayAlarms);
    })
    return alarms;
}

function createAccount(email, password) {
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;
            console.log(user);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
        });
}

async function connectAccount(email, password) {
    const auth = getAuth();
    var returnCode = 1;

    var errorCode = null;
    var errorMessage = null;
    var user = null;
    console.log(email);
    await signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            user = userCredential.user;
            user_uid = user.uid;

            returnCode = 0;
        })
        .catch((error) => {
            errorCode = error.code;
            errorMessage = error.message;
            console.log("error !!");
        });

    return [returnCode, returnCode == 0 ? user : errorCode];
}

window.getAlarmsList = getAlarmsList
window.getAlarmsProviders = getAlarmsProviders
window.sendNewAlarms = sendNewAlarms
window.createAccount = createAccount
window.connectAccount = connectAccount
var user_uid = "";
