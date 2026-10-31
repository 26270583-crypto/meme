// ============================================================
// ЛОГИКА ТЕСТА
// ============================================================

// --- Состояние ---
// userAnswers[i] = индекс выбранного ответа для вопроса i, или null, если не отвечено.
let userAnswers = new Array(QUESTIONS.length).fill(null);
let currentIndex = 0;

// --- Элементы страницы ---
const $ = (id) => document.getElementById(id);
const screens = {
  start: $("screen-start"),
  quiz: $("screen-quiz"),
  result: $("screen-result"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- Вывод вопроса ---
function renderQuestion() {
  const q = QUESTIONS[currentIndex];
  const total = QUESTIONS.length;

  $("question-text").textContent = q.text;
  $("progress-label").textContent = `Вопрос ${currentIndex + 1} из ${total}`;
  $("answered-label").textContent = `Отвечено: ${countAnswered()}`;
  $("progress-bar").style.width = `${(countAnswered() / total) * 100}%`;
  hideError();

  // Карточки ответов
  const box = $("answers");
  box.innerHTML = "";
  q.answers.forEach((answer, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer";
    if (userAnswers[currentIndex] === i) btn.classList.add("selected");
    btn.textContent = answer.text; // textContent защищает от вставки HTML
    btn.addEventListener("click", () => selectAnswer(i));
    box.appendChild(btn);
  });

  // Кнопки навигации
  $("btn-prev").disabled = currentIndex === 0;
  $("btn-next").textContent = currentIndex === total - 1 ? "Узнать результат 🎉" : "Далее →";
}

function selectAnswer(answerIndex) {
  userAnswers[currentIndex] = answerIndex;
  hideError();
  renderQuestion();
}

function countAnswered() {
  return userAnswers.filter((a) => a !== null).length;
}

// --- Ошибки ---
function showError(msg) {
  const el = $("error");
  el.textContent = msg;
  el.classList.remove("hidden");
  const card = $("question-card");
  card.classList.remove("shake");
  void card.offsetWidth; // перезапуск анимации
  card.classList.add("shake");
}
function hideError() {
  $("error").classList.add("hidden");
}

// --- Навигация ---
function goNext() {
  // Защита: нельзя идти дальше без выбранного ответа
  if (userAnswers[currentIndex] === null) {
    showError("Выбери вариант ответа, чтобы продолжить.");
    return;
  }
  if (currentIndex < QUESTIONS.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    finishTest();
  }
}

function goPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

// --- Завершение теста ---
function finishTest() {
  // Защита от неполного прохождения: ищем первый вопрос без ответа
  const firstEmpty = userAnswers.findIndex((a) => a === null);
  if (firstEmpty !== -1) {
    currentIndex = firstEmpty;
    renderQuestion();
    showError("Ты пропустил этот вопрос. Ответь на все вопросы, чтобы получить результат.");
    return;
  }
  showResult(calculateScores());
}

// --- Подсчёт баллов ---
// Возвращает объект вида { doge: 12, grumpy: 5, ... }
function calculateScores() {
  const scores = {};
  Object.keys(MEMES).forEach((key) => (scores[key] = 0));

  userAnswers.forEach((answerIndex, qIndex) => {
    const chosen = QUESTIONS[qIndex].answers[answerIndex];
    for (const [memeKey, points] of Object.entries(chosen.scores)) {
      scores[memeKey] += points;
    }
  });
  return scores;
}

// Максимум баллов, который каждый мем мог бы набрать (для процентов)
function calculateMaxScores() {
  const max = {};
  Object.keys(MEMES).forEach((key) => (max[key] = 0));

  QUESTIONS.forEach((q) => {
    Object.keys(MEMES).forEach((key) => {
      const best = Math.max(...q.answers.map((a) => a.scores[key] || 0));
      max[key] += best;
    });
  });
  return max;
}

// --- Вывод результата ---
function showResult(scores) {
  const maxScores = calculateMaxScores();

  // Сортируем мемы по убыванию баллов (при равенстве — по порядку в MEMES)
  const ranking = Object.keys(MEMES)
    .map((key) => ({
      key,
      score: scores[key],
      percent: maxScores[key] ? Math.round((scores[key] / maxScores[key]) * 100) : 0,
    }))
    .sort((a, b) => b.score - a.score);

  const winner = ranking[0];
  const meme = MEMES[winner.key];

  $("result-emoji").textContent = meme.emoji;
  $("result-title").textContent = meme.title;
  $("result-subtitle").textContent = meme.subtitle;
  $("result-percent").textContent = `${winner.percent}%`;
  $("result-desc").textContent = meme.description;

  const tips = $("result-tips");
  tips.innerHTML = "";
  meme.tips.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    tips.appendChild(li);
  });

  const bars = $("result-bars");
  bars.innerHTML = "";
  ranking.forEach((r) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML =
      `<span class="bar-name"></span>` +
      `<div class="bar-track"><div class="bar-fill"></div></div>` +
      `<span class="bar-val"></span>`;
    row.querySelector(".bar-name").textContent = `${MEMES[r.key].emoji} ${MEMES[r.key].title}`;
    row.querySelector(".bar-val").textContent = `${r.percent}%`;
    bars.appendChild(row);
    // небольшая задержка для анимации заполнения
    setTimeout(() => (row.querySelector(".bar-fill").style.width = `${r.percent}%`), 50);
  });

  showScreen("result");
  saveToDb(winner, scores);
}

// Отправка результата в онлайн-базу и вывод статуса
async function saveToDb(winner, scores) {
  const status = $("save-status");
  status.textContent = "Сохраняем результат…";
  const res = await saveResult(winner.key, winner.percent, scores);
  if (res.ok) {
    status.textContent = "✅ Результат сохранён в базе";
  } else if (res.reason === "not_configured") {
    status.textContent = "ℹ️ База данных не подключена (укажи ключи в supabase.js)";
  } else {
    status.textContent = "⚠️ Не удалось сохранить результат, но тест пройден";
  }
}

// --- Старт / перезапуск ---
function startTest() {
  userAnswers = new Array(QUESTIONS.length).fill(null);
  currentIndex = 0;
  renderQuestion();
  showScreen("quiz");
}

$("btn-start").addEventListener("click", startTest);
$("btn-restart").addEventListener("click", startTest);
$("btn-next").addEventListener("click", goNext);
$("btn-prev").addEventListener("click", goPrev);
