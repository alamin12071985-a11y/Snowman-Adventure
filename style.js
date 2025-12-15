// --- CONFIGURATION ---
const firebaseConfig = {
    // আপনার ফায়ারবেস কনফিগারেশন এখানে থাকবে (index.html থেকে নেওয়া)
    apiKey: "AIzaSyD1PPDhogcw7fBu27PkO1iuMfGFLUwMN70",
    authDomain: "fir-55206.firebaseapp.com",
    databaseURL: "https://fir-55206-default-rtdb.firebaseio.com",
    projectId: "fir-55206",
    storageBucket: "fir-55206.firebasestorage.app",
    messagingSenderId: "24586463698",
    appId: "1:24586463698:web:8b2f21073295ef4382400b"
};

// Init Firebase
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- STATE ---
let userState = {
    balance: 0,
    stars: 100, // Starting stars (or load from DB)
    lastSpin: 0
};
let userId = "test_user";

// --- INIT ---
window.onload = function() {
    initTelegram();
    simulateLoading();
    loadUserData();
    setupShop();
    listenForAdminPopup();
    listenForFriendsText();
};

function initTelegram() {
    if(window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        if(tg.initDataUnsafe.user) {
            userId = tg.initDataUnsafe.user.id.toString();
            document.getElementById('headerName').innerText = tg.initDataUnsafe.user.first_name;
        }
    }
}

function simulateLoading() {
    let p = 0;
    const bar = document.getElementById('loadingFill');
    const txt = document.getElementById('loadingPercent');
    const interval = setInterval(() => {
        p += 5;
        if(p>100) p=100;
        bar.style.width = p + "%";
        txt.innerText = p + "%";
        if(p===100) {
            clearInterval(interval);
            setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 500);
        }
    }, 50);
}

// --- DATABASE SYNC ---
function loadUserData() {
    db.ref('users/' + userId).on('value', snap => {
        const data = snap.val();
        if(data) {
            userState.balance = data.balance || 0;
            userState.stars = data.stars || 100; // Load stars
            userState.lastSpin = data.lastSpin || 0;
            updateUI();
        }
    });
}

function saveUserData() {
    db.ref('users/' + userId).update({
        balance: userState.balance,
        stars: userState.stars,
        lastSpin: userState.lastSpin
    });
}

function updateUI() {
    document.getElementById('displayBalance').innerText = Math.floor(userState.balance);
    document.getElementById('headerCoinBalance').innerText = Math.floor(userState.balance);
    document.getElementById('headerStarBalance').innerText = userState.stars;
    document.getElementById('walletCoin').innerText = Math.floor(userState.balance);
    document.getElementById('walletStars').innerText = userState.stars;
    document.getElementById('crashBalanceDisplay').innerText = userState.stars;
}

// --- TABS ---
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(d => d.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

// --- CLICKER ---
document.getElementById('clickerBtn').addEventListener('click', (e) => {
    userState.balance += 1;
    saveUserData();
    // Floating text logic here (simplified)
});

// --- FRIENDS TAB LOGIC ---
// 1. Listen for Admin Text
function listenForFriendsText() {
    db.ref('admin/settings/friendsText').on('value', snap => {
        if(snap.val()) {
            document.getElementById('friendsAdminText').innerText = snap.val();
        }
    });
}

// 2. Share Invite
function shareInviteLink() {
    const inviteLink = `https://t.me/share/url?url=https://t.me/YourBot?start=${userId}&text=Join me in Snowman Adventure!`;
    if(window.Telegram.WebApp.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(inviteLink);
    } else {
        window.open(inviteLink, '_blank');
    }
}

// 3. Copy Link
function copyInviteLink(btn) {
    const link = `https://t.me/YourBot?start=${userId}`;
    navigator.clipboard.writeText(link).then(() => {
        btn.style.backgroundColor = "#00E5FF";
        setTimeout(() => btn.style.backgroundColor = "", 1000);
    });
}

// --- SHOP LOGIC ---
function setupShop() {
    // এডমিন প্যানেল দিয়ে আইটেম অ্যাড করার লজিক (আপাতত স্ট্যাটিক)
    const items = [
        { id: 1, name: "Double Tap", price: 50, icon: "⚡️" },
        { id: 2, name: "Auto Bot", price: 100, icon: "🤖" },
        { id: 3, name: "Ice Shield", price: 200, icon: "🛡" }
    ];
    
    const container = document.getElementById('shopContainer');
    container.innerHTML = "";
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div style="font-size:40px">${item.icon}</div>
            <h4>${item.name}</h4>
            <div class="shop-price">${item.price} ⭐️</div>
            <button class="buy-btn" onclick="buyItem(${item.id}, ${item.price})">Buy</button>
        `;
        container.appendChild(div);
    });
}

function buyItem(id, price) {
    if(userState.stars >= price) {
        // Telegram Stars payment simulation
        userState.stars -= price;
        saveUserData();
        alert("Purchase successful with Stars!");
    } else {
        alert("Not enough Stars! Please buy more via Telegram.");
    }
}

// --- DAILY SPIN LOGIC ---
function openSpinModal() {
    document.getElementById('spinModal').style.display = 'flex';
}
function closeSpinModal() {
    document.getElementById('spinModal').style.display = 'none';
}
function runDailySpin() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if(now - userState.lastSpin < oneDay) {
        alert("You have already spun today! Come back tomorrow.");
        return;
    }

    const rewards = [10, 20, 50, 5, 100];
    const win = rewards[Math.floor(Math.random() * rewards.length)];
    
    userState.lastSpin = now;
    userState.stars += win;
    saveUserData();
    
    document.getElementById('spinResult').innerText = `You won ${win} Stars!`;
    document.getElementById('spinBtn').disabled = true;
}

// --- GLOBAL ADMIN POPUP ---
function listenForAdminPopup() {
    // Firebase Path: admin/popup
    // Structure: { active: true, image: "url", title: "Hi", text: "Msg" }
    db.ref('admin/popup').on('value', snap => {
        const data = snap.val();
        if(data && data.active) {
            document.getElementById('popupImg').src = data.image;
            document.getElementById('popupTitle').innerText = data.title;
            document.getElementById('popupText').innerText = data.text;
            document.getElementById('adminPopup').style.display = 'flex';
        }
    });
}
function closeAdminPopup() {
    document.getElementById('adminPopup').style.display = 'none';
}

// --- CRASH GAME LOGIC (Using Stars) ---
let crashBet = 50;
let crashMultiplier = 1.00;
let isCrashRunning = false;
let crashInterval;
let canvas, ctx;
let rocketY = 0;

function openCrashGame() {
    document.getElementById('crashGameOverlay').style.display = 'flex';
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    resetCrashGame();
}

function closeCrashGame() {
    document.getElementById('crashGameOverlay').style.display = 'none';
    if(isCrashRunning) clearInterval(crashInterval);
}

function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    rocketY = canvas.height * 0.8;
}

function adjustCrashBet(amount) {
    if(crashBet + amount >= 10) crashBet += amount;
    document.getElementById('crashBetAmount').innerText = crashBet;
}

function resetCrashGame() {
    crashMultiplier = 1.00;
    isCrashRunning = false;
    document.getElementById('multiplier-display').innerText = "1.00x";
    document.getElementById('crash-msg').innerText = "PLACE BET";
    document.getElementById('crash-gif').style.display = "none";
    document.getElementById('crashActionBtn').innerText = "PLACE BET (Stars)";
    document.getElementById('crashActionBtn').disabled = false;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw simple rocket placeholder
    ctx.fillStyle = "#00E5FF";
    ctx.beginPath();
    ctx.arc(canvas.width/2, rocketY, 20, 0, Math.PI*2);
    ctx.fill();
}

function handleCrashAction() {
    if(isCrashRunning) {
        // CASH OUT
        cashOut();
    } else {
        // START GAME
        if(userState.stars >= crashBet) {
            userState.stars -= crashBet;
            saveUserData();
            startCrash();
        } else {
            alert("Not enough Stars!");
        }
    }
}

function startCrash() {
    isCrashRunning = true;
    const btn = document.getElementById('crashActionBtn');
    btn.innerText = "CASH OUT";
    btn.style.background = "#FFD700"; // Gold
    
    const crashPoint = (Math.random() * 5 + 1).toFixed(2); // Simplified random crash
    
    crashInterval = setInterval(() => {
        crashMultiplier += 0.01;
        document.getElementById('multiplier-display').innerText = crashMultiplier.toFixed(2) + "x";
        
        // Simple visual update
        rocketY -= 0.5;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00E5FF";
        ctx.beginPath();
        ctx.arc(canvas.width/2, rocketY, 20, 0, Math.PI*2);
        ctx.fill();

        if(crashMultiplier >= crashPoint) {
            crash();
        }
    }, 50);
}

function cashOut() {
    clearInterval(crashInterval);
    const win = Math.floor(crashBet * crashMultiplier);
    userState.stars += win;
    saveUserData();
    alert(`You won ${win} Stars!`);
    resetCrashGame();
}

function crash() {
    clearInterval(crashInterval);
    document.getElementById('crash-msg').innerText = "CRASHED!";
    document.getElementById('multiplier-display').style.color = "red";
    document.getElementById('crash-gif').style.display = "block";
    document.getElementById('crashActionBtn').disabled = true;
    
    setTimeout(() => {
        resetCrashGame();
        document.getElementById('multiplier-display').style.color = "white";
    }, 2000);
}
