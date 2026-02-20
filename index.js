// ============================
// Antigravity Robot – Game Logic
// ============================

(function () {
  'use strict';

  // ---- Constants ----
  const TOTAL_PARTS = 10;
  const CELEBRATION_DURATION = 4000;
  const FEEDBACK_DURATION = 1200;
  const STAR_COUNT = 80;

  const ENCOURAGEMENTS = [
    '⭐ Amazing!',
    '🎉 Great job!',
    '🚀 You rock!',
    '✨ Fantastic!',
    '🌟 Awesome!',
    '💪 Super!',
    '🤩 Brilliant!',
    '🏆 Perfect!'
  ];

  const TRY_AGAINS = [
    '🤔 Almost! Try again!',
    '💭 Not quite — give it another shot!',
    '🌈 So close! Try once more!',
    '🙂 Keep going, you\'ve got this!'
  ];

  // ---- State ----
  let partsRevealed = 0;
  let totalAnswered = 0;
  let currentProblem = null; // { a, b, op, answer }
  let feedbackTimeout = null;

  // ---- DOM refs ----
  const num1El       = document.getElementById('num1');
  const num2El       = document.getElementById('num2');
  const operatorEl   = document.getElementById('operator');
  const answerEl     = document.getElementById('answer-display');
  const feedbackEl   = document.getElementById('feedback');
  const progressBar  = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const totalCountEl = document.getElementById('total-count');
  const numberPad    = document.getElementById('number-pad');
  const confettiCanvas = document.getElementById('confetti-canvas');
  const starsContainer = document.getElementById('stars-container');

  // ---- Initialise ----
  function init() {
    createStars();
    createNumberPad();
    generateProblem();
    document.addEventListener('keydown', handleKeyboard);
  }

  // ---- Stars ----
  function createStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.left = Math.random() * 100 + '%';
      s.style.top  = Math.random() * 100 + '%';
      s.style.setProperty('--dur', (1.5 + Math.random() * 3).toFixed(1) + 's');
      s.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
      s.style.width = s.style.height = (2 + Math.random() * 2) + 'px';
      starsContainer.appendChild(s);
    }
  }

  // ---- Number Pad ----
  function createNumberPad() {
    // Max possible answer: 9 + 9 = 18
    for (let i = 0; i <= 18; i++) {
      const btn = document.createElement('button');
      btn.className = 'num-btn';
      btn.textContent = i;
      btn.dataset.value = i;
      btn.addEventListener('click', () => submitAnswer(i));
      numberPad.appendChild(btn);
    }
  }

  // ---- Problem Generation ----
  function generateProblem() {
    const isAdd = Math.random() < 0.5;
    let a, b;
    if (isAdd) {
      a = randInt(0, 9);
      b = randInt(0, 9);
      currentProblem = { a, b, op: '+', answer: a + b };
    } else {
      // Ensure non-negative result
      a = randInt(0, 9);
      b = randInt(0, a);
      currentProblem = { a, b, op: '−', answer: a - b };
    }
    num1El.textContent     = currentProblem.a;
    num2El.textContent     = currentProblem.b;
    operatorEl.textContent = currentProblem.op;
    answerEl.textContent   = '?';
  }

  // ---- Answer Handling ----
  function submitAnswer(value) {
    if (currentProblem === null) return;

    const correct = value === currentProblem.answer;
    answerEl.textContent = value;
    totalAnswered++;
    totalCountEl.textContent = totalAnswered;

    // Flash the tapped button
    const btn = numberPad.querySelector(`[data-value="${value}"]`);
    if (btn) {
      btn.classList.add(correct ? 'flash-correct' : 'flash-wrong');
      setTimeout(() => btn.classList.remove('flash-correct', 'flash-wrong'), 400);
    }

    if (correct) {
      showFeedback(randomFrom(ENCOURAGEMENTS), 'correct');
      revealNextPart();
    } else {
      showFeedback(randomFrom(TRY_AGAINS), 'wrong');
      // Don't advance — let them try a new problem
      setTimeout(() => generateProblem(), FEEDBACK_DURATION);
      return;
    }

    if (partsRevealed >= TOTAL_PARTS) {
      celebrate();
    } else {
      setTimeout(() => generateProblem(), FEEDBACK_DURATION);
    }
  }

  // ---- Keyboard Input ----
  function handleKeyboard(e) {
    // Allow digits and Enter isn't needed; just match typed numbers
    const key = e.key;
    if (/^\d$/.test(key)) {
      // Build a short buffer for two-digit numbers
      handleDigitKey(parseInt(key, 10));
    }
  }

  // Simple two-digit buffer
  let digitBuffer = '';
  let digitTimer = null;
  function handleDigitKey(digit) {
    digitBuffer += digit;
    clearTimeout(digitTimer);

    if (digitBuffer.length === 2) {
      submitAnswer(parseInt(digitBuffer, 10));
      digitBuffer = '';
    } else {
      // Wait a short time for a possible second digit
      digitTimer = setTimeout(() => {
        submitAnswer(parseInt(digitBuffer, 10));
        digitBuffer = '';
      }, 400);
    }
  }

  // ---- Robot Part Reveal ----
  function revealNextPart() {
    if (partsRevealed >= TOTAL_PARTS) return;
    const part = document.getElementById('robot-part-' + partsRevealed);
    if (part) {
      part.classList.add('visible');
    }
    partsRevealed++;
    updateProgress();
  }

  function updateProgress() {
    const pct = (partsRevealed / TOTAL_PARTS) * 100;
    progressBar.style.width = pct + '%';
    progressText.textContent = partsRevealed + ' / ' + TOTAL_PARTS + ' parts';
  }

  // ---- Feedback ----
  function showFeedback(msg, type) {
    clearTimeout(feedbackTimeout);
    feedbackEl.textContent = msg;
    feedbackEl.className = type;
    feedbackTimeout = setTimeout(() => {
      feedbackEl.textContent = '';
      feedbackEl.className = '';
    }, FEEDBACK_DURATION);
  }

  // ---- Celebration ----
  function celebrate() {
    currentProblem = null; // Pause new problems
    launchConfetti();

    // Create or show celebration overlay
    let overlay = document.getElementById('celebration');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'celebration';
      overlay.innerHTML = '<h2>🤖 You built the robot! 🎉</h2><p>Get ready to build another one!</p>';
      document.body.appendChild(overlay);
    }
    requestAnimationFrame(() => overlay.classList.add('active'));

    setTimeout(() => {
      overlay.classList.remove('active');
      resetRobot();
      generateProblem();
    }, CELEBRATION_DURATION);
  }

  function resetRobot() {
    for (let i = 0; i < TOTAL_PARTS; i++) {
      const part = document.getElementById('robot-part-' + i);
      if (part) part.classList.remove('visible');
    }
    partsRevealed = 0;
    updateProgress();
  }

  // ---- Confetti ----
  function launchConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const pieces = [];
    const COLORS = ['#FF6BB5', '#5B7FFF', '#51E898', '#FFD93D', '#FF6B6B', '#C0CFFF'];
    const COUNT = 120;

    for (let i = 0; i < COUNT; i++) {
      pieces.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height * -1,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        rv: (Math.random() - 0.5) * 0.2,
        opacity: 1
      });
    }

    let frame;
    const startTime = performance.now();
    const DURATION = 3500;

    function draw(now) {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      for (const p of pieces) {
        p.x += p.vx;
        p.vy += 0.05; // gravity
        p.y += p.vy;
        p.rot += p.rv;
        if (elapsed > DURATION * 0.6) {
          p.opacity = Math.max(0, 1 - (elapsed - DURATION * 0.6) / (DURATION * 0.4));
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < DURATION) {
        frame = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    }

    frame = requestAnimationFrame(draw);
  }

  // ---- Helpers ----
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---- Boot ----
  init();
})();
