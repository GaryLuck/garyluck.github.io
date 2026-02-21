const DIFFICULTY = {
  easy: 'easy',
  mixed: 'mixed',
};

const ROBOT_PARTS = [
  'body',
  'head',
  'eye-left',
  'eye-right',
  'mouth',
  'arm-left',
  'arm-right',
  'leg-left',
  'leg-right',
  'antenna',
];

const state = {
  a: 0,
  b: 0,
  op: '+',
  answer: null,
  questions: 0,
  correct: 0,
  partsEarned: 0,
  difficulty: DIFFICULTY.easy,
};

const els = {
  a: document.getElementById('operand-a'),
  b: document.getElementById('operand-b'),
  op: document.getElementById('operator'),
  answerInput: document.getElementById('answer-input'),
  checkBtn: document.getElementById('check-btn'),
  feedback: document.getElementById('feedback'),
  questionsCount: document.getElementById('questions-count'),
  correctCount: document.getElementById('correct-count'),
  partsCount: document.getElementById('parts-count'),
  partsTotal: document.getElementById('parts-total'),
  progressFill: document.getElementById('progress-fill'),
  newRobotBtn: document.getElementById('new-robot-btn'),
  difficultyChips: Array.from(document.querySelectorAll('.chip')),
  robotStage: document.getElementById('robot-stage'),
};

function sampleInt(min, maxInclusive) {
  const minV = Math.ceil(min);
  const maxV = Math.floor(maxInclusive);
  return Math.floor(Math.random() * (maxV - minV + 1)) + minV;
}

function pickNextProblem() {
  let op = '+';
  if (state.difficulty === DIFFICULTY.mixed) {
    op = Math.random() < 0.5 ? '+' : '-';
  }

  let a;
  let b;

  if (op === '+') {
    a = sampleInt(0, 9);
    b = sampleInt(0, 9 - a);
  } else {
    a = sampleInt(0, 9);
    b = sampleInt(0, a);
  }

  state.a = a;
  state.b = b;
  state.op = op;
  state.answer = null;

  els.a.textContent = String(a);
  els.b.textContent = String(b);
  els.op.textContent = op;
  els.answerInput.value = '';
  els.feedback.textContent = '';
  els.feedback.classList.remove('feedback-correct', 'feedback-incorrect');

  window.requestAnimationFrame(() => {
    els.answerInput.focus();
  });
}

function getCorrectAnswer() {
  if (state.op === '+') {
    return state.a + state.b;
  }
  return state.a - state.b;
}

function revealNextRobotPart() {
  if (state.partsEarned >= ROBOT_PARTS.length) {
    return;
  }
  const nextPartKey = ROBOT_PARTS[state.partsEarned];
  const partEl = els.robotStage.querySelector(`.robot-part[data-part="${nextPartKey}"]`);
  if (partEl) {
    partEl.classList.add('visible');
  }
  state.partsEarned += 1;
  updateProgress();
}

function resetRobot() {
  state.partsEarned = 0;
  const parts = els.robotStage.querySelectorAll('.robot-part[data-part]');
  parts.forEach((el) => {
    el.classList.remove('visible');
  });
  updateProgress();
}

function updateProgress() {
  const totalParts = ROBOT_PARTS.length;
  const parts = Math.min(state.partsEarned, totalParts);
  els.partsCount.textContent = String(parts);
  els.partsTotal.textContent = String(totalParts);
  const ratio = parts / totalParts;
  els.progressFill.style.width = `${ratio * 100}%`;
}

function updateStats() {
  els.questionsCount.textContent = String(state.questions);
  els.correctCount.textContent = String(state.correct);
}

function handleCheckAnswer() {
  const raw = els.answerInput.value.trim();
  if (raw === '') {
    els.feedback.textContent = 'Type your answer first.';
    els.feedback.classList.remove('feedback-correct');
    els.feedback.classList.add('feedback-incorrect');
    return;
  }

  const guess = Number(raw);
  if (!Number.isFinite(guess)) {
    els.feedback.textContent = 'Use numbers only.';
    els.feedback.classList.remove('feedback-correct');
    els.feedback.classList.add('feedback-incorrect');
    return;
  }

  const correctAnswer = getCorrectAnswer();

  state.questions += 1;

  if (guess === correctAnswer) {
    state.correct += 1;
    els.feedback.textContent = 'Nice job! You earned a robot part 🎉';
    els.feedback.classList.remove('feedback-incorrect');
    els.feedback.classList.add('feedback-correct');
    revealNextRobotPart();
  } else {
    els.feedback.textContent = `Not quite. Try another one! The correct answer was ${correctAnswer}.`;
    els.feedback.classList.remove('feedback-correct');
    els.feedback.classList.add('feedback-incorrect');
  }

  updateStats();

  window.setTimeout(() => {
    pickNextProblem();
  }, 900);
}

function handleDifficultyClick(event) {
  const target = event.currentTarget;
  const difficulty = target.getAttribute('data-difficulty');
  if (!difficulty || !Object.values(DIFFICULTY).includes(difficulty)) {
    return;
  }
  state.difficulty = difficulty;
  els.difficultyChips.forEach((chip) => {
    chip.classList.toggle('chip-selected', chip === target);
  });
  pickNextProblem();
}

function handleEnterKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleCheckAnswer();
  }
}

function handleNewRobotClick() {
  resetRobot();
  els.feedback.textContent = 'New robot started! Keep going!';
  els.feedback.classList.remove('feedback-incorrect');
  els.feedback.classList.add('feedback-correct');
  window.setTimeout(() => {
    els.feedback.textContent = '';
    els.feedback.classList.remove('feedback-correct');
  }, 900);
}

function init() {
  updateProgress();
  updateStats();
  els.checkBtn.addEventListener('click', handleCheckAnswer);
  els.answerInput.addEventListener('keydown', handleEnterKey);
  els.newRobotBtn.addEventListener('click', handleNewRobotClick);
  els.difficultyChips.forEach((chip) => {
    chip.addEventListener('click', handleDifficultyClick);
  });
  pickNextProblem();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

