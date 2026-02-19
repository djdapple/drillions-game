import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFt1PM5HhiRH6lc-2bili58n5-7YK6bGQ",
  authDomain: "drillionscomments.firebaseapp.com",
  projectId: "drillionscomments",
  storageBucket: "drillionscomments.firebasestorage.app",
  messagingSenderId: "1007277277571",
  appId: "1:1007277277571:web:cff735592cdb3abf1e76b6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("world-form");
const input = document.getElementById("world-input");
const list = document.getElementById("world-list");

form.addEventListener("submit", async e=>{
  e.preventDefault();

  const text=input.value.trim();
  if(!text) return;

  await addDoc(collection(db,"letters"),{
    text,
    time:serverTimestamp()
  });

  input.value="";
});

const q=query(collection(db,"letters"),orderBy("time","desc"));

onSnapshot(q,snap=>{
  list.innerHTML="";
  snap.forEach(doc=>{
    const d=doc.data();
    const el=document.createElement("div");
    el.className="letter";
    el.innerText=d.text;
    list.appendChild(el);
  });
});
