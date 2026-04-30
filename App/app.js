/* ========================================== */
/* 1. STATE VARIABLES (The App's Memory)      */
/* ========================================== */
let allQuestions = []; // Holds all 50 questions from JSON
let currentSessionQuestions = []; // Holds the 10 questions for the active quiz
let currentQuestionIndex = 0;
let sessionScore = 0;
let sessionMissed = []; // Tracks questions the user gets wrong
let timerInterval;
let secondsElapsed = 0;

// User Profile Data (Loaded from LocalStorage)
let userProfile = {
    xp: 0,
    streak: 0,
    lastLoginDate: null,
    flaggedItems: []
};

/* ========================================== */
/* 2. DOM ELEMENTS (Connecting to HTML)       */
/* ========================================== */
// Views
const dashboardView = document.getElementById('dashboard-view');
const quizView = document.getElementById('quiz-view');
const reviewView = document.getElementById('review-view');

// Dashboard Elements
const userRankEl = document.getElementById('user-rank');
const userStreakEl = document.getElementById('user-streak');
const userXpEl = document.getElementById('user-xp');
const btnStartQuick = document.getElementById('btn-start-quick');

// Quiz Elements
const questionStemEl = document.getElementById('question-stem');
const optionsAreaEl = document.getElementById('options-area');
const progressBarEl = document.getElementById('progress-bar');
const questionTrackerEl = document.getElementById('question-tracker');
const timerEl = document.getElementById('timer');
const btnNext = document.getElementById('btn-next');
const btnFlag = document.getElementById('btn-flag');

// Review Elements
const sessionScoreEl = document.getElementById('session-score');
const sessionXpEarnedEl = document.getElementById('session-xp-earned');
const reviewListEl = document.getElementById('review-list');
const btnHome = document.getElementById('btn-home');

/* ========================================== */
/* 3. INITIALIZATION & DATA LOADING           */
/* ========================================== */
// This runs as soon as the file loads
async function initApp() {
    loadUserProfile();
    checkDailyStreak();
    updateDashboardUI();

    try {
        // Fetch the data from our JSON database
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        console.log(`Successfully loaded ${allQuestions.length} questions.`);
    } catch (error) {
        console.error("Failed to load questions:", error);
        questionStemEl.innerText = "Error loading questions. Make sure you are using Live Server!";
    }
}

/* ========================================== */
/* 4. VIEW ROUTING                            */
/* ========================================== */
function showView(viewToShow) {
    // Hide all views first
    dashboardView.classList.add('hidden');
    quizView.classList.add('hidden');
    reviewView.classList.add('hidden');
    
    // Show the requested view
    viewToShow.classList.remove('hidden');
}

/* ========================================== */
/* 5. GAMIFICATION & LOCAL STORAGE            */
/* ========================================== */
function loadUserProfile() {
    const savedProfile = localStorage.getItem('iscCpaProfile');
    if (savedProfile) {
        userProfile = JSON.parse(savedProfile);
    }
}

function saveUserProfile() {
    localStorage.setItem('iscCpaProfile', JSON.stringify(userProfile));
    updateDashboardUI();
}

function checkDailyStreak() {
    const today = new Date().toDateString();
    
    if (userProfile.lastLoginDate !== today) {
        // If it's a new day, we check if they studied yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (userProfile.lastLoginDate === yesterday.toDateString()) {
            userProfile.streak += 1; // Kept the streak alive!
        } else if (userProfile.lastLoginDate !== null) {
            userProfile.streak = 0; // Streak broken
        }
        
        userProfile.lastLoginDate = today;
        saveUserProfile();
    }
}

function getRank(xp) {
    if (xp < 500) return "Staff Auditor";
    if (xp < 1500) return "Senior Auditor";
    if (xp < 3000) return "Manager";
    if (xp < 5000) return "Director";
    return "ISC Partner 🏆";
}

function updateDashboardUI() {
    userXpEl.innerText = userProfile.xp;
    userStreakEl.innerText = `${userProfile.streak} Days`;
    userRankEl.innerText = getRank(userProfile.xp);
}

/* ========================================== */
/* 6. QUIZ ENGINE LOGIC                       */
/* ========================================== */
function startQuickSession() {
    // Shuffle all questions and pick the first 10
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    currentSessionQuestions = shuffled.slice(0, 10);
    
    // Reset session variables
    currentQuestionIndex = 0;
    sessionScore = 0;
    sessionMissed = [];
    secondsElapsed = 0;
    
    // Start timer and UI
    startTimer();
    showView(quizView);
    renderQuestion();
}

function renderQuestion() {
    const currentQ = currentSessionQuestions[currentQuestionIndex];
    
    // Update UI Meta Data
    questionTrackerEl.innerText = `Question ${currentQuestionIndex + 1} / ${currentSessionQuestions.length}`;
    progressBarEl.style.width = `${((currentQuestionIndex) / currentSessionQuestions.length) * 100}%`;
    btnNext.classList.add('hidden'); // Hide next button until they answer
    
    // Inject Question Text
    questionStemEl.innerText = currentQ.content.question_stem;
    
    // Clear old options and create new ones
    optionsAreaEl.innerHTML = ''; 
    currentQ.content.options.forEach(option => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.innerText = `${option.id}. ${option.text}`;
        btn.onclick = () => handleAnswerSelect(option, btn, currentQ);
        optionsAreaEl.appendChild(btn);
    });
}

function handleAnswerSelect(selectedOption, clickedBtn, currentQ) {
    // Disable all buttons so user can't click twice
    const allBtns = optionsAreaEl.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.disabled = true);
    
    // Create explanation element
    const explanationDiv = document.createElement('div');
    explanationDiv.style.marginTop = '15px';
    explanationDiv.style.padding = '15px';
    explanationDiv.style.borderRadius = '8px';
    explanationDiv.style.backgroundColor = '#f8fafc';
    explanationDiv.style.borderLeft = '4px solid var(--primary)';
    explanationDiv.innerHTML = `<strong>Explanation:</strong> ${selectedOption.explanation}`;

    if (selectedOption.is_correct) {
        clickedBtn.classList.add('option-correct');
        sessionScore++;
    } else {
        clickedBtn.classList.add('option-incorrect');
        sessionMissed.push(currentQ);
        
        // Highlight the correct answer for them
        allBtns.forEach(btn => {
            const correctOpt = currentQ.content.options.find(o => o.is_correct);
            if (btn.innerText.startsWith(correctOpt.id)) {
                btn.classList.add('option-correct');
            }
        });
    }

    optionsAreaEl.appendChild(explanationDiv);
    btnNext.classList.remove('hidden'); // Show Next button
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentSessionQuestions.length) {
        renderQuestion();
    } else {
        endSession();
    }
}

/* ========================================== */
/* 7. TIMER UTILS                             */
/* ========================================== */
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        secondsElapsed++;
        const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
        const secs = String(secondsElapsed % 60).padStart(2, '0');
        timerEl.innerText = `⏱️ ${mins}:${secs}`;
    }, 1000);
}

/* ========================================== */
/* 8. REVIEW SCREEN LOGIC                     */
/* ========================================== */
function endSession() {
    clearInterval(timerInterval);
    
    // Calculate Math
    const totalQ = currentSessionQuestions.length;
    const percentage = Math.round((sessionScore / totalQ) * 100);
    const xpEarned = sessionScore * 10; // 10 XP per correct answer
    
    // Update User Profile
    userProfile.xp += xpEarned;
    saveUserProfile();
    
    // Update UI
    progressBarEl.style.width = '100%';
    sessionScoreEl.innerText = `Score: ${percentage}%`;
    sessionXpEarnedEl.innerText = `+${xpEarned} XP Earned`;
    
    // Render Missed Questions
    reviewListEl.innerHTML = '';
    if (sessionMissed.length === 0) {
        reviewListEl.innerHTML = '<p style="text-align:center; margin-top:20px;">Perfect score! Great job.</p>';
    } else {
        sessionMissed.forEach(q => {
            const div = document.createElement('div');
            div.style.marginBottom = '20px';
            div.style.padding = '15px';
            div.style.border = '1px solid var(--secondary)';
            div.style.borderRadius = '8px';
            
            const correctOpt = q.content.options.find(o => o.is_correct);
            
            div.innerHTML = `
                <h4 style="margin-bottom: 10px; color: var(--primary);">${q.blueprint_area}</h4>
                <p style="margin-bottom: 10px;"><strong>Q:</strong> ${q.content.question_stem}</p>
                <p style="color: var(--correct); margin-bottom: 10px;"><strong>Correct Answer:</strong> ${correctOpt.text}</p>
                <p style="font-size: 0.9rem; color: var(--text-muted);">${correctOpt.explanation}</p>
            `;
            reviewListEl.appendChild(div);
        });
    }
    
    showView(reviewView);
}

/* ========================================== */
/* 9. EVENT LISTENERS (Button Clicks)         */
/* ========================================== */
btnStartQuick.addEventListener('click', startQuickSession);
btnNext.addEventListener('click', nextQuestion);
btnHome.addEventListener('click', () => {
    updateDashboardUI();
    showView(dashboardView);
});

btnFlag.addEventListener('click', () => {
    const currentQ = currentSessionQuestions[currentQuestionIndex];
    if (!userProfile.flaggedItems.includes(currentQ.item_id)) {
        userProfile.flaggedItems.push(currentQ.item_id);
        saveUserProfile();
        btnFlag.innerText = "✅ Flagged";
        setTimeout(() => btnFlag.innerText = "🚩 Flag for Review", 1500);
    }
});

// Boot up the app
initApp();
