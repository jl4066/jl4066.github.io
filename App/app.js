/* ========================================== */
/* 1. GLOBAL VARIABLES & STATE                */
/* ========================================== */
let allQuestions = []; // Will hold all 50 questions from JSON
let currentSessionQuestions = []; // The 10 questions for the current quiz
let currentQuestionIndex = 0;
let sessionScore = 0;
let timerInterval;
let secondsElapsed = 0;

// Default user stats if they have never played before
let userStats = {
    xp: 0,
    streak: 0,
    lastPlayed: null
};

/* ========================================== */
/* 2. DOM ELEMENTS (CONNECTING TO HTML)       */
/* ========================================== */
// Views
const dashboardView = document.getElementById("dashboard-view");
const quizView = document.getElementById("quiz-view");
const reviewView = document.getElementById("review-view");

// Dashboard Elements
const rankEl = document.getElementById("user-rank");
const streakEl = document.getElementById("user-streak");
const xpEl = document.getElementById("user-xp");

// Quiz Elements
const questionStemEl = document.getElementById("question-stem");
const optionsAreaEl = document.getElementById("options-area");
const progressBarEl = document.getElementById("progress-bar");
const questionTrackerEl = document.getElementById("question-tracker");
const timerEl = document.getElementById("timer");
const btnNext = document.getElementById("btn-next");

// Review Elements
const sessionScoreEl = document.getElementById("session-score");
const sessionXpEl = document.getElementById("session-xp-earned");
const reviewListEl = document.getElementById("review-list");

/* ========================================== */
