/* ======================
   SABİTLER & STATE
====================== */
const STORAGE_KEY = "quizzes";
const LETTERS = ["A", "B", "C", "D"];
const AUTO_ADVANCE_DELAY_MS = 1200;

let quizzes = [];
let currentQuizIndex = 0;
let currentQuestionIndex = 0;
let score = 0;
let wrongQuestions = [];
let lastQuestionText = "";
let autoAdvanceTimeout = null;

/* ======================
   LOCAL STORAGE
====================== */
function saveQuizzes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
}

function loadQuizzes() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    quizzes = Array.isArray(data) ? data : [];
  } catch {
    quizzes = [];
  }
}

/* ======================
   SABİT SORULAR
====================== */
const additionalQuestions = [
  { question: "Türkiye'nin en uzun nehri hangisidir?", answers: ["Kızılırmak","Fırat","Dicle","Sakarya"], correct: 0 },
  { question: "Python hangi tür bir programlama dilidir?", answers: ["Yüksek seviyeli","Makine dili","Assembler","Düşük seviyeli"], correct: 0 },
  { question: "Türkiye'nin başkenti neresidir?", answers: ["İstanbul","Ankara","İzmir","Bursa"], correct: 1 },
  { question: "Dünyanın en büyük okyanusu hangisidir?", answers: ["Atlas","Hint","Arktik","Pasifik"], correct: 3 },
  { question: "CSS ne için kullanılır?", answers: ["Veritabanı yönetimi","Sayfa stilini düzenlemek","Sunucu tarafı kodlama","Tarayıcı motoru"], correct: 1 },
  { question: "JavaScript hangi ortamda çalışır?", answers: ["Sadece sunucuda","Sadece mobilde","Tarayıcıda","Sadece masaüstünde"], correct: 2 }
];

loadQuizzes

// Sadece additionalQuestions ile başla
quizzes = [
  { name: "Genel Kültür", questions: [...additionalQuestions] }
];
saveQuizzes();

/* ======================
   NORMALIZATION
====================== */
function normalizeText(text = "") {
  return text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9ĞÜŞİÖÇ ]/g, "")
    .trim();
}
const firstChar = s => normalizeText(s)[0] || "";

/* ======================
   TEXT TO SPEECH
====================== */
function speak(text, onEnd) {
  if (!("speechSynthesis" in window)) return onEnd?.();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "tr-TR";
  u.onend = () => onEnd?.();
  speechSynthesis.speak(u);
}

/* ======================
   SPEECH RECOGNITION
====================== */
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let recognitionActive = false;

if (Recognition) {
  recognition = new Recognition();
  recognition.lang = "tr-TR";
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.onstart = () => (recognitionActive = true);
  recognition.onend = () => (recognitionActive = false);
  recognition.onresult = e => {
    const res = e.results[e.results.length - 1]?.[0]?.transcript;
    if (!res) return;
    handleVoiceCommand(res);
  };
}

function safeStartRecognition() { if (recognition && !recognitionActive) { try { recognition.start(); } catch {} } }
function safeStopRecognition() { if (recognition && recognitionActive) { try { recognition.stop(); } catch {} } }

/* ======================
   SESLİ KOMUT İŞLEME
====================== */
function handleVoiceCommand(transcript) {
  const normalized = normalizeText(transcript);
  if (normalized === "ANNEN") {
    speak("PURNA algılandı. Tekrar okunuyor.", () => repeatQuestion());
    return;
  }
  if (normalized === "TEKRAR OKU") {
    // Mesajı sesli oku
    speak("Tekrar okunuyor", () => repeatQuestion());
    return;
  }
  const spokenLetter = firstChar(normalized);
  let index = LETTERS.indexOf(spokenLetter);
  if (index === -1) {
    const answers = getCurrentAnswers();
    index = answers.findIndex(a => firstChar(a) === spokenLetter);
  }
  if (index !== -1) triggerAnswer(index);
}

function getCurrentAnswers() {
  return quizzes[currentQuizIndex]?.questions[currentQuestionIndex]?.answers || [];
}

/* ======================
   QUIZ AKIŞI
====================== */
function loadQuestion() {
  clearTimeout(autoAdvanceTimeout);
  const q = quizzes[currentQuizIndex]?.questions[currentQuestionIndex];
  if (!q) return finishQuiz();

  lastQuestionText =
    `Soru: ${q.question}. ` +
    q.answers.map((a,i) => `${LETTERS[i]}: ${a}`).join(". ");

  safeStopRecognition();
  speak(lastQuestionText, safeStartRecognition);
  renderAnswers(q);
}

function renderAnswers(q) {
  answersEl.innerHTML = "";
  q.answers.forEach((ans,i) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = `${LETTERS[i]}) ${ans}`;
    btn.onclick = () => selectAnswer(i, q.correct, btn);
    answersEl.appendChild(btn);
  });
}

function selectAnswer(index, correct, btn) {
  safeStopRecognition();
  clearTimeout(autoAdvanceTimeout);
  const isCorrect = index === correct;
  btn?.classList.add(isCorrect ? "correct" : "wrong");

  if (!isCorrect) wrongQuestions.push(quizzes[currentQuizIndex].questions[currentQuestionIndex]);
  else score++;

  speak(isCorrect ? "Doğru." : "Yanlış.", () => {
    autoAdvanceTimeout = setTimeout(nextQuestion, AUTO_ADVANCE_DELAY_MS);
  });

  [...answersEl.children].forEach(b => b.disabled = true);
}

function nextQuestion() {
  currentQuestionIndex++;
  currentQuestionIndex < quizzes[currentQuizIndex].questions.length
    ? loadQuestion()
    : finishQuiz();
}

function finishQuiz() {
  safeStopRecognition();
  speak(`Quiz bitti. Skorunuz ${score}`, () => {
    quizPlay.style.display = "none";
    quizSelection.style.display = "block";
  });
}

/* ======================
   YARDIMCI
====================== */
function repeatQuestion() {
  if (!lastQuestionText) return;
  safeStopRecognition();
  speak(lastQuestionText, safeStartRecognition);
}

function triggerAnswer(index) {
  const btns = document.querySelectorAll(".answer-btn");
  btns[index]?.click();
}

/* ======================
   ELEMENTLERİ BAĞLA
====================== */
const quizSelection = document.getElementById("quiz-selection");
const quizList = document.getElementById("quiz-list");
const startQuizBtn = document.getElementById("start-quiz");
const newQuizBtn = document.getElementById("new-quiz");

const quizPlay = document.getElementById("quiz-play");
const answersEl = document.getElementById("answers");
const nextBtn = document.getElementById("next-btn");
const repeatBtn = document.getElementById("repeat-btn");

const quizManage = document.getElementById("quiz-manage");
const manageTitle = document.getElementById("manage-title");
const newQuestionInput = document.getElementById("new-question");
const newAnswersInput = document.getElementById("new-answers");
const correctIndexInput = document.getElementById("correct-index");
const addQuestionBtn = document.getElementById("add-question");
const questionListEl = document.getElementById("question-list");
const backHomeBtn = document.getElementById("back-home");

/* ======================
   QUIZ SEÇİMİ
====================== */
function populateQuizList() {
  quizList.innerHTML = "";
  quizzes.forEach((q, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = q.name;
    quizList.appendChild(opt);
  });
}

populateQuizList();

startQuizBtn.onclick = () => {
  currentQuizIndex = parseInt(quizList.value);
  currentQuestionIndex = 0;
  score = 0;
  wrongQuestions = [];
  quizSelection.style.display = "none";
  quizPlay.style.display = "block";
  loadQuestion();
};

repeatBtn.onclick = repeatQuestion;
nextBtn.onclick = nextQuestion;

/* Yeni Quiz Oluştur ve Soru Ekleme */
newQuizBtn.onclick = () => {
  quizSelection.style.display = "none";
  quizManage.style.display = "block";

  manageTitle.textContent = "Yeni Quiz Oluştur";
  newQuestionInput.value = "";
  newAnswersInput.value = "";
  correctIndexInput.value = "";
  questionListEl.innerHTML = "";

  currentQuizIndex = quizzes.length;
  quizzes.push({ name: "Yeni Quiz", questions: [] });
  saveQuizzes();
};

addQuestionBtn.onclick = () => {
  const questionText = newQuestionInput.value.trim();
  const answers = newAnswersInput.value.split(",").map(a => a.trim());
  const correct = parseInt(correctIndexInput.value);

  if (!questionText || answers.length !== 4 || isNaN(correct) || correct < 0 || correct > 3) {
    alert("Lütfen geçerli bir soru, 4 cevap ve doğru index girin (0-3).");
    return;
  }

  quizzes[currentQuizIndex].questions.push({ question: questionText, answers, correct });
  saveQuizzes();

  const li = document.createElement("li");
  li.textContent = `${questionText} [Doğru: ${LETTERS[correct]}]`;
  questionListEl.appendChild(li);

  newQuestionInput.value = "";
  newAnswersInput.value = "";
  correctIndexInput.value = "";
};

backHomeBtn.onclick = () => {
  quizManage.style.display = "none";
  quizSelection.style.display = "block";
  populateQuizList();
};
function getSessionId() {
  let id = localStorage.getItem("session_id");
  if (!id) {
    id = crypto.randomUUID(); // Modern tarayıcılarda çalışır
    localStorage.setItem("session_id", id);
  }
  return id;
}

async function registerVisit() {
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();

    const session_id = getSessionId(); // Burada session_id oluşturuluyor

    await fetch("/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ip_address: ipData.ip,
        session_id,
        user_agent: navigator.userAgent,
        consent: true
      })
    });

    console.log("IP ve Session gönderildi:", ipData.ip, session_id);
  } catch (err) {
    console.error(err);
  }
}

window.addEventListener("DOMContentLoaded", registerVisit);






