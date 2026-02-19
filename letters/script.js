const ADMIN_KEY = "drillionsowner"; // change this

/* ---------------- STORAGE ---------------- */

function loadWorld(){
  return JSON.parse(localStorage.getItem("dl_world")) || [];
}

function saveWorld(data){
  localStorage.setItem("dl_world", JSON.stringify(data));
}

function loadThread(){
  return JSON.parse(localStorage.getItem("dl_thread")) || [];
}

function saveThread(data){
  localStorage.setItem("dl_thread", JSON.stringify(data));
}

/* ---------------- HELPERS ---------------- */

function within24h(t){
  return Date.now() - t < 86400000;
}

function formatTime(t){
  const d = new Date(t);
  return d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
}

/* ---------------- WORLD FEED ---------------- */

const worldForm = document.getElementById("world-form");
const worldInput = document.getElementById("world-input");
const worldList = document.getElementById("world-list");
const worldEmpty = document.getElementById("world-empty");
const worldCount = document.getElementById("world-count");

let world = loadWorld().filter(l=>within24h(l.time));
saveWorld(world);

worldInput.addEventListener("input",()=>{
  worldCount.textContent = worldInput.value.length + " / 400";
});

worldForm.addEventListener("submit", e=>{
  e.preventDefault();
  const text = worldInput.value.trim();
  if(!text) return;

  world.unshift({text, time:Date.now()});
  saveWorld(world);

  worldInput.value="";
  worldCount.textContent="0 / 400";
  renderWorld();
});

function deleteWorld(i){
  const key = prompt("Admin key");
  if(key!==ADMIN_KEY) return alert("Not authorized");

  world.splice(i,1);
  saveWorld(world);
  renderWorld();
}

function renderWorld(){
  worldList.innerHTML="";

  if(!world.length){
    worldEmpty.style.display="block";
    return;
  }
  worldEmpty.style.display="none";

  world.forEach((l,i)=>{
    const el=document.createElement("div");
    el.className="letter";

    el.innerHTML=`
      <div class="letter-text">${l.text}</div>
      <div class="letter-meta">
        ${formatTime(l.time)}
        <button class="delete-btn">×</button>
      </div>
    `;

    el.querySelector(".delete-btn").onclick=()=>deleteWorld(i);
    worldList.appendChild(el);
  });
}

renderWorld();

/* ---------------- PENPAL ---------------- */

const penForm=document.getElementById("penpal-form");
const penInput=document.getElementById("penpal-input");
const penList=document.getElementById("thread-list");
const penEmpty=document.getElementById("thread-empty");
const penCount=document.getElementById("penpal-count");

let thread=loadThread();

penInput.addEventListener("input",()=>{
  penCount.textContent=penInput.value.length+" / 500";
});

penForm.addEventListener("submit",e=>{
  e.preventDefault();
  const text=penInput.value.trim();
  if(!text) return;

  thread.unshift({text,time:Date.now()});
  saveThread(thread);

  penInput.value="";
  penCount.textContent="0 / 500";
  renderThread();
  updateProfile();
});

function renderThread(){
  penList.innerHTML="";
  if(!thread.length){
    penEmpty.style.display="block";
    return;
  }
  penEmpty.style.display="none";

  thread.forEach(l=>{
    const el=document.createElement("div");
    el.className="letter private";
    el.innerHTML=`<div class="letter-text">${l.text}</div>`;
    penList.appendChild(el);
  });
}

renderThread();

/* ---------------- PROFILE UNLOCK ---------------- */

const profileStatus=document.getElementById("profile-status");
const progressText=document.getElementById("progress-text");

function updateProfile(){
  const count=thread.length;
  const first=thread[thread.length-1]?.time||Date.now();
  const elapsed=Date.now()-first;

  const unlocked=count>=7 && elapsed>86400000;

  if(unlocked){
    profileStatus.textContent="Unlocked — Known Soul";
    progressText.textContent="Unlocked";
  }else{
    const remain=Math.max(0,86400000-elapsed);
    const hrs=Math.ceil(remain/3600000);
    profileStatus.textContent="Hidden — Unknown";
    progressText.textContent=`${count} / 7 letters • ${hrs}h remaining`;
  }
}

updateProfile();
