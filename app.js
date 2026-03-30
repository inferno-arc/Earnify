// --- DATABASE & SESSION MANAGEMENT ---
let users = JSON.parse(localStorage.getItem('earnify_users')) || [];
let currentSession = JSON.parse(localStorage.getItem('earnify_session'));

// Protection: Redirect to login if session is missing
if (!currentSession && !window.location.href.includes('login.html') && !window.location.href.includes('register.html')) {
    window.location.href = 'login.html';
}

// --- CORE UI UPDATE ---
function updateUI() {
    if (!currentSession) return;
    
    // Find current user in the database
    const user = users.find(u => u.email === currentSession.email || u.phone === currentSession.phone);
    
    if (user) {
        // Update Names and Balances
        const setUI = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
        
        setUI('user-name', user.username);
        setUI('profile-user', user.username);
        setUI('balance-display', user.coins);
        setUI('wallet-coins', user.coins);
        setUI('ref-code-display', user.refCode);
        
        // Money conversion (10 coins = ₹1)
        const money = (user.coins / 10).toFixed(2);
        setUI('money-val', money);

        // Withdrawal Progress Bar (Min ₹50 / 500 Coins)
        const minCoins = 500;
        let progress = (user.coins / minCoins) * 100;
        if(progress > 100) progress = 100;
        
        const progressBar = document.getElementById('withdraw-progress');
        const progressText = document.getElementById('progress-text');
        
        if(progressBar) progressBar.style.width = progress + "%";
        if(progressText) progressText.innerText = `${user.coins}/${minCoins} Coins to reach ₹50`;
        
        // Update Game Statuses
        updateSpinDisplay();
        checkScratchStatus();
        checkRejection();
    }
}

// --- NAVIGATION LOGIC ---
function showScreen(screenId, navEl) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.style.display = 'none');
    
    const target = document.getElementById(screenId);
    if(target) target.style.display = 'block';

    if(navEl) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        navEl.classList.add('active');
    }
}

// --- EARNING SYSTEM ---
function addCoins(amount) {
    const userIdx = users.findIndex(u => u.email === currentSession.email || u.phone === currentSession.phone);
    if (userIdx !== -1) {
        // Ensure amount is handled as a number
        users[userIdx].coins += parseInt(amount);
        localStorage.setItem('earnify_users', JSON.stringify(users));
        updateUI();
    }
}

// --- ADMOB REWARD SYSTEM ---
// App ID: ca-app-pub-9356430456655774~9903307764
// Ad Unit: ca-app-pub-9356430456655774/8660808042
function watchAd() {
    let btn = event.target;
    btn.innerText = "Loading Video Ad...";
    btn.disabled = true;

    if (window.adsbygoogle) {
        // Triggering the real AdMob Rewarded unit
        (adsbygoogle = window.adsbygoogle || []).push({
            google_ad_client: "ca-pub-9356430456655774",
            enable_page_level_ads: true
        });

        // Simulate Ad completion time for rewarding
        setTimeout(() => {
            addCoins(10);
            alert("🎉 Success! 10 Coins added.");
            btn.innerText = "📺 Watch Ad (+10)";
            btn.disabled = false;
        }, 8000); 
    } else {
        alert("Ad failed to load. Check your internet connection or AdBlocker.");
        btn.disabled = false;
        btn.innerText = "📺 Watch Ad (+10)";
    }
}

function dailyCheckIn() {
    const lastClaim = localStorage.getItem('last_claim_' + currentSession.phone);
    const today = new Date().toDateString();

    if (lastClaim === today) {
        alert("You already claimed your daily bonus today!");
    } else {
        addCoins(50);
        localStorage.setItem('last_claim_' + currentSession.phone, today);
        alert("Daily Bonus: +50 Coins Added!");
    }
}

// --- LUCKY REWARDS (SPIN WHEEL) ---
function updateSpinDisplay() {
    const today = new Date().toDateString();
    let spinData = JSON.parse(localStorage.getItem('spins_' + currentSession.phone)) || { date: today, count: 0 };
    
    if (spinData.date !== today) spinData.count = 0;
    
    const countEl = document.getElementById('spin-count');
    if(countEl) countEl.innerText = `Spins left today: ${10 - spinData.count}`;
}

function spinWheel() {
    const user = users.find(u => u.phone === currentSession.phone);
    const today = new Date().toDateString();
    
    let spinData = JSON.parse(localStorage.getItem('spins_' + user.phone)) || { date: today, count: 0 };
    if (spinData.date !== today) spinData = { date: today, count: 0 };

    if (spinData.count >= 10) {
        alert("Daily limit reached! Come back tomorrow.");
        return;
    }

    if (user.coins < 10) {
        alert("Need 10 coins to spin!");
        return;
    }

    // Cost to spin
    addCoins(-10);
    spinData.count++;
    localStorage.setItem('spins_' + user.phone, JSON.stringify(spinData));

    const wheel = document.getElementById('wheel-disc');
    const spinBtn = document.getElementById('spin-btn');
    
    const randomRotation = Math.floor(Math.random() * 3600) + 1440; 
    wheel.style.transform = `rotate(${randomRotation}deg)`;
    spinBtn.disabled = true;

    setTimeout(() => {
        const rewards = [5, 10, 15, 20, 30, 5, 25, 20, 15, 5, 50];
        const win = rewards[Math.floor(Math.random() * rewards.length)];
        
        addCoins(win);
        alert(win > 0 ? `🎉 You won ${win} Coins!` : "Better luck next time!");
        spinBtn.disabled = false;
        updateSpinDisplay();
    }, 4000);
}

// --- SCRATCH CARD SYSTEM ---
function checkScratchStatus() {
    const today = new Date().toDateString();
    const lastScratch = localStorage.getItem('last_scratch_' + currentSession.phone);
    const area = document.getElementById('scratch-area');
    
    if (area && lastScratch === today) {
        area.classList.add('scratched');
        const rewardDisplay = document.getElementById('scratch-reward');
        if(rewardDisplay) rewardDisplay.innerText = "Used Today";
    }
}

function scratchCard() {
    const area = document.getElementById('scratch-area');
    const today = new Date().toDateString();
    const lastScratch = localStorage.getItem('last_scratch_' + currentSession.phone);

    if (lastScratch === today || (area && area.classList.contains('scratched'))) {
        alert("You already scratched today's card!");
        return;
    }

    area.classList.add('scratched');
    const win = Math.floor(Math.random() * 41) + 10; 
    const rewardDisplay = document.getElementById('scratch-reward');
    if(rewardDisplay) rewardDisplay.innerText = `💎 +${win}`;
    
    localStorage.setItem('last_scratch_' + currentSession.phone, today);
    
    setTimeout(() => {
        addCoins(win);
        alert(`Awesome! You found ${win} coins.`);
    }, 500);
}

// --- WALLET & WITHDRAWAL ---
function withdraw() {
    const user = users.find(u => u.phone === currentSession.phone);
    if (user.coins < 500) {
        alert(`Minimum withdrawal is ₹50 (500 coins).`);
        return;
    }
    
    const amount = (user.coins / 10).toFixed(2);
    document.getElementById('modal-amount-display').innerText = `₹${amount}`;
    document.getElementById('withdraw-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('withdraw-modal').style.display = 'none';
}

function submitWithdrawal() {
    const user = users.find(u => u.phone === currentSession.phone);
    const upi = document.getElementById('upi-input').value;
    const amount = (user.coins / 10).toFixed(2);

    if (upi.includes('@') && upi.length > 3) {
        const request = {
            id: Date.now(),
            phone: user.phone,
            username: user.username,
            upi: upi,
            amount: amount,
            coins: user.coins,
            status: "Pending",
            adminMsg: "",
            date: new Date().toLocaleString()
        };

        let withdrawals = JSON.parse(localStorage.getItem('earnify_withdrawals')) || [];
        withdrawals.push(request);
        localStorage.setItem('earnify_withdrawals', JSON.stringify(withdrawals));

        addCoins(-user.coins); 
        closeModal();
        alert("Request Sent! It will be reviewed by the Admin.");
    } else {
        alert("Please enter a valid UPI ID");
    }
}

function checkRejection() {
    let withdrawals = JSON.parse(localStorage.getItem('earnify_withdrawals')) || [];
    const myLastReq = withdrawals.slice().reverse().find(r => r.phone === currentSession.phone);
    
    const notice = document.getElementById('rejection-notice');
    const msgText = document.getElementById('reject-msg-text');
    
    if (myLastReq && myLastReq.status === "Rejected") {
        if(notice && msgText) {
            notice.style.display = 'block';
            msgText.innerText = `Reason: ${myLastReq.adminMsg || "Policy violation."}`;
        }
    } else if (notice) {
        notice.style.display = 'none';
    }
}

// --- SESSION CONTROL ---
function logout() {
    localStorage.removeItem('earnify_session');
    window.location.href = 'login.html';
}

// Initial Run
window.onload = () => {
    updateUI();
};
