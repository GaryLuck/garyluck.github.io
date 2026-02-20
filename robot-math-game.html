<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Robot Builder Math Game</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Gaegu:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #1a1a2e;
    --panel: #16213e;
    --accent-blue: #0f3460;
    --glow-cyan: #00d2ff;
    --glow-pink: #e91e9c;
    --glow-green: #39ff14;
    --glow-yellow: #ffe600;
    --glow-orange: #ff6b00;
    --text: #e0e0ff;
    --text-dim: #8888aa;
    --correct-bg: #0a3d0a;
    --wrong-bg: #3d0a0a;
    --btn-bg: #1e3a5f;
    --btn-hover: #2a4f7f;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Fredoka', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }

  /* Starfield background */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.6), transparent),
      radial-gradient(1.5px 1.5px at 50% 10%, rgba(255,255,255,0.9), transparent),
      radial-gradient(1px 1px at 70% 80%, rgba(255,255,255,0.5), transparent),
      radial-gradient(1px 1px at 90% 30%, rgba(255,255,255,0.7), transparent),
      radial-gradient(1.5px 1.5px at 15% 85%, rgba(255,255,255,0.6), transparent),
      radial-gradient(1px 1px at 85% 55%, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 45% 45%, rgba(255,255,255,0.5), transparent),
      radial-gradient(1.5px 1.5px at 65% 15%, rgba(255,255,255,0.7), transparent),
      radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.6), transparent),
      radial-gradient(1px 1px at 55% 75%, rgba(255,255,255,0.4), transparent),
      radial-gradient(1.5px 1.5px at 80% 90%, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 5% 50%, rgba(255,255,255,0.5), transparent),
      radial-gradient(1px 1px at 95% 65%, rgba(255,255,255,0.6), transparent),
      radial-gradient(1.5px 1.5px at 40% 95%, rgba(255,255,255,0.7), transparent);
    z-index: 0;
    pointer-events: none;
  }

  .app {
    position: relative;
    z-index: 1;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* Header */
  .header {
    text-align: center;
    margin-bottom: 10px;
    animation: dropIn 0.6s ease-out;
  }

  .header h1 {
    font-size: 2.4rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--glow-cyan), var(--glow-pink));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 20px rgba(0,210,255,0.3));
    letter-spacing: 1px;
  }

  .header .subtitle {
    font-family: 'Gaegu', cursive;
    font-size: 1.1rem;
    color: var(--text-dim);
    margin-top: 2px;
  }

  /* Progress bar */
  .progress-wrap {
    width: 100%;
    max-width: 500px;
    margin: 10px 0 16px;
    animation: dropIn 0.6s ease-out 0.1s both;
  }

  .progress-label {
    font-size: 0.85rem;
    color: var(--text-dim);
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
  }

  .progress-bar {
    height: 14px;
    background: var(--accent-blue);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
  }

  .progress-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, var(--glow-cyan), var(--glow-green));
    border-radius: 10px;
    transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 0 12px rgba(0,210,255,0.5);
  }

  /* Main content area */
  .main {
    display: flex;
    gap: 30px;
    width: 100%;
    align-items: flex-start;
    justify-content: center;
    flex-wrap: wrap;
  }

  /* Robot display */
  .robot-area {
    flex: 0 0 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: dropIn 0.6s ease-out 0.2s both;
  }

  .robot-stage {
    width: 320px;
    height: 420px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Robot SVG */
  .robot-svg {
    width: 280px;
    height: 400px;
  }

  .robot-part {
    opacity: 0;
    transition: opacity 0.6s ease, filter 0.6s ease;
    filter: blur(4px);
  }

  .robot-part.visible {
    opacity: 1;
    filter: blur(0);
  }

  .robot-part.just-added {
    animation: partAppear 0.8s ease-out;
  }

  /* Placeholder silhouette parts */
  .robot-placeholder {
    opacity: 0.08;
    transition: opacity 0.3s;
  }

  .robot-placeholder.hidden {
    opacity: 0;
  }

  /* Quiz area */
  .quiz-area {
    flex: 1;
    min-width: 300px;
    max-width: 440px;
    animation: dropIn 0.6s ease-out 0.3s both;
  }

  .quiz-card {
    background: var(--panel);
    border-radius: 24px;
    padding: 30px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.06);
  }

  .problem {
    text-align: center;
    margin-bottom: 24px;
  }

  .problem-text {
    font-family: 'Gaegu', cursive;
    font-size: 4rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
    text-shadow: 0 0 30px rgba(0,210,255,0.2);
    letter-spacing: 4px;
  }

  .problem-text .operator {
    color: var(--glow-cyan);
    margin: 0 4px;
  }

  .problem-text .equals {
    color: var(--glow-yellow);
    margin: 0 4px;
  }

  .problem-text .qmark {
    color: var(--glow-pink);
    display: inline-block;
    animation: pulse 1.2s ease-in-out infinite;
  }

  /* Answer choices */
  .choices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .choice-btn {
    font-family: 'Fredoka', sans-serif;
    font-size: 1.8rem;
    font-weight: 600;
    padding: 16px;
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    background: var(--btn-bg);
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .choice-btn:hover:not(:disabled) {
    background: var(--btn-hover);
    border-color: var(--glow-cyan);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,210,255,0.2);
  }

  .choice-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .choice-btn:disabled {
    cursor: default;
  }

  .choice-btn.correct {
    background: var(--correct-bg);
    border-color: var(--glow-green);
    box-shadow: 0 0 20px rgba(57,255,20,0.3);
    animation: correctPop 0.4s ease-out;
  }

  .choice-btn.wrong {
    background: var(--wrong-bg);
    border-color: #ff4444;
    animation: shake 0.4s ease-out;
  }

  .choice-btn.dimmed {
    opacity: 0.3;
  }

  /* Feedback area */
  .feedback {
    text-align: center;
    min-height: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .feedback-text {
    font-size: 1.3rem;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .feedback-text.show {
    opacity: 1;
  }

  .feedback-text.correct-msg {
    color: var(--glow-green);
    text-shadow: 0 0 15px rgba(57,255,20,0.4);
  }

  .feedback-text.wrong-msg {
    color: #ff6b6b;
  }

  .feedback-sub {
    font-size: 0.9rem;
    color: var(--text-dim);
    margin-top: 4px;
    opacity: 0;
    transition: opacity 0.3s 0.2s;
  }

  .feedback-sub.show {
    opacity: 1;
  }

  /* Celebration screen */
  .celebration {
    display: none;
    flex-direction: column;
    align-items: center;
    text-align: center;
    animation: dropIn 0.6s ease-out;
  }

  .celebration.active {
    display: flex;
  }

  .celebration h2 {
    font-size: 2.2rem;
    background: linear-gradient(135deg, var(--glow-yellow), var(--glow-orange));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 10px;
  }

  .celebration p {
    font-size: 1.1rem;
    color: var(--text-dim);
    margin-bottom: 20px;
  }

  .play-again-btn {
    font-family: 'Fredoka', sans-serif;
    font-size: 1.3rem;
    font-weight: 600;
    padding: 14px 40px;
    border: none;
    border-radius: 50px;
    background: linear-gradient(135deg, var(--glow-cyan), #0088cc);
    color: #fff;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 20px rgba(0,210,255,0.3);
  }

  .play-again-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(0,210,255,0.5);
  }

  /* Confetti canvas */
  #confetti-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 100;
  }

  /* Animations */
  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }

  @keyframes partAppear {
    0% { opacity: 0; filter: blur(8px) brightness(3); }
    50% { filter: blur(0) brightness(2); }
    100% { opacity: 1; filter: blur(0) brightness(1); }
  }

  @keyframes correctPop {
    0% { transform: scale(1); }
    40% { transform: scale(1.08); }
    100% { transform: scale(1); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .robot-float {
    animation: float 3s ease-in-out infinite;
  }

  /* Responsive */
  @media (max-width: 700px) {
    .main { flex-direction: column; align-items: center; }
    .robot-area { flex: none; }
    .robot-stage { width: 260px; height: 340px; }
    .robot-svg { width: 230px; height: 330px; }
    .quiz-area { min-width: 0; width: 100%; }
    .problem-text { font-size: 3rem; }
    .choice-btn { font-size: 1.4rem; padding: 12px; }
    .header h1 { font-size: 1.8rem; }
  }
</style>
</head>
<body>
<div class="app">
  <div class="header">
    <h1>Robot Builder</h1>
    <div class="subtitle">Answer math problems to build your robot!</div>
  </div>

  <div class="progress-wrap">
    <div class="progress-label">
      <span id="parts-count">Parts: 0 / 12</span>
      <span id="streak-display"></span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" id="progress-fill"></div>
    </div>
  </div>

  <div class="main" id="game-area">
    <!-- Robot -->
    <div class="robot-area">
      <div class="robot-stage">
        <svg class="robot-svg" id="robot-svg" viewBox="0 0 280 400">
          <!-- Placeholder silhouette -->
          <g id="robot-placeholder">
            <!-- Antenna -->
            <line x1="140" y1="28" x2="140" y2="55" stroke="#334" stroke-width="4" class="robot-placeholder" data-part="antenna"/>
            <circle cx="140" cy="22" r="8" fill="#334" class="robot-placeholder" data-part="antenna"/>
            <!-- Head -->
            <rect x="90" y="55" width="100" height="80" rx="18" fill="#334" class="robot-placeholder" data-part="head"/>
            <!-- Eyes -->
            <circle cx="118" cy="90" r="12" fill="#222" class="robot-placeholder" data-part="left-eye"/>
            <circle cx="162" cy="90" r="12" fill="#222" class="robot-placeholder" data-part="right-eye"/>
            <!-- Mouth -->
            <rect x="115" y="112" width="50" height="8" rx="4" fill="#222" class="robot-placeholder" data-part="mouth"/>
            <!-- Neck -->
            <rect x="125" y="135" width="30" height="18" rx="4" fill="#334" class="robot-placeholder" data-part="neck"/>
            <!-- Body -->
            <rect x="70" y="153" width="140" height="120" rx="16" fill="#334" class="robot-placeholder" data-part="body"/>
            <!-- Chest panel -->
            <rect x="100" y="175" width="80" height="50" rx="8" fill="#222" class="robot-placeholder" data-part="chest"/>
            <!-- Left arm -->
            <rect x="30" y="160" width="36" height="90" rx="12" fill="#334" class="robot-placeholder" data-part="left-arm"/>
            <!-- Right arm -->
            <rect x="214" y="160" width="36" height="90" rx="12" fill="#334" class="robot-placeholder" data-part="right-arm"/>
            <!-- Left leg -->
            <rect x="88" y="278" width="40" height="80" rx="12" fill="#334" class="robot-placeholder" data-part="left-leg"/>
            <!-- Right leg -->
            <rect x="152" y="278" width="40" height="80" rx="12" fill="#334" class="robot-placeholder" data-part="right-leg"/>
            <!-- Left foot -->
            <ellipse cx="108" cy="365" rx="28" ry="12" fill="#334" class="robot-placeholder" data-part="left-foot"/>
            <!-- Right foot -->
            <ellipse cx="172" cy="365" rx="28" ry="12" fill="#334" class="robot-placeholder" data-part="right-foot"/>
          </g>

          <!-- Actual robot parts (hidden initially) -->
          <g id="robot-parts">
            <!-- 1. Body (core) -->
            <g class="robot-part" data-part="body">
              <rect x="70" y="153" width="140" height="120" rx="16" fill="url(#bodyGrad)" stroke="#0088cc" stroke-width="2"/>
              <rect x="70" y="153" width="140" height="120" rx="16" fill="none" stroke="rgba(0,210,255,0.15)" stroke-width="1"/>
            </g>

            <!-- 2. Head -->
            <g class="robot-part" data-part="head">
              <rect x="90" y="55" width="100" height="80" rx="18" fill="url(#headGrad)" stroke="#0088cc" stroke-width="2"/>
              <rect x="90" y="55" width="100" height="80" rx="18" fill="none" stroke="rgba(0,210,255,0.2)" stroke-width="1"/>
            </g>

            <!-- 3. Left Eye -->
            <g class="robot-part" data-part="left-eye">
              <circle cx="118" cy="90" r="14" fill="#0a1628" stroke="#00d2ff" stroke-width="2"/>
              <circle cx="118" cy="90" r="7" fill="#00d2ff" opacity="0.9"/>
              <circle cx="115" cy="87" r="3" fill="#fff" opacity="0.8"/>
            </g>

            <!-- 4. Right Eye -->
            <g class="robot-part" data-part="right-eye">
              <circle cx="162" cy="90" r="14" fill="#0a1628" stroke="#00d2ff" stroke-width="2"/>
              <circle cx="162" cy="90" r="7" fill="#00d2ff" opacity="0.9"/>
              <circle cx="159" cy="87" r="3" fill="#fff" opacity="0.8"/>
            </g>

            <!-- 5. Mouth -->
            <g class="robot-part" data-part="mouth">
              <rect x="112" y="110" width="56" height="12" rx="6" fill="#0a1628" stroke="#39ff14" stroke-width="1.5"/>
              <rect x="118" y="113" width="8" height="6" rx="2" fill="#39ff14" opacity="0.7"/>
              <rect x="130" y="113" width="8" height="6" rx="2" fill="#39ff14" opacity="0.7"/>
              <rect x="142" y="113" width="8" height="6" rx="2" fill="#39ff14" opacity="0.7"/>
              <rect x="154" y="113" width="8" height="6" rx="2" fill="#39ff14" opacity="0.7"/>
            </g>

            <!-- 6. Chest Panel -->
            <g class="robot-part" data-part="chest">
              <rect x="100" y="175" width="80" height="50" rx="8" fill="#0a1628" stroke="#0088cc" stroke-width="1.5"/>
              <circle cx="120" cy="195" r="6" fill="#ff4444" opacity="0.8"/>
              <circle cx="140" cy="195" r="6" fill="#ffe600" opacity="0.8"/>
              <circle cx="160" cy="195" r="6" fill="#39ff14" opacity="0.8"/>
              <rect x="112" y="208" width="56" height="6" rx="3" fill="#0088cc" opacity="0.4"/>
              <rect x="112" y="216" width="40" height="4" rx="2" fill="#0088cc" opacity="0.25"/>
            </g>

            <!-- 7. Neck -->
            <g class="robot-part" data-part="neck">
              <rect x="122" y="135" width="36" height="20" rx="6" fill="#2a4f7f" stroke="#0088cc" stroke-width="1.5"/>
              <line x1="130" y1="140" x2="130" y2="150" stroke="#00d2ff" stroke-width="1" opacity="0.4"/>
              <line x1="140" y1="138" x2="140" y2="152" stroke="#00d2ff" stroke-width="1" opacity="0.4"/>
              <line x1="150" y1="140" x2="150" y2="150" stroke="#00d2ff" stroke-width="1" opacity="0.4"/>
            </g>

            <!-- 8. Left Arm -->
            <g class="robot-part" data-part="left-arm">
              <rect x="30" y="160" width="36" height="90" rx="12" fill="url(#armGrad)" stroke="#0088cc" stroke-width="2"/>
              <circle cx="48" cy="255" r="12" fill="#2a4f7f" stroke="#0088cc" stroke-width="2"/>
              <circle cx="48" cy="255" r="5" fill="#e91e9c" opacity="0.6"/>
            </g>

            <!-- 9. Right Arm -->
            <g class="robot-part" data-part="right-arm">
              <rect x="214" y="160" width="36" height="90" rx="12" fill="url(#armGrad2)" stroke="#0088cc" stroke-width="2"/>
              <circle cx="232" cy="255" r="12" fill="#2a4f7f" stroke="#0088cc" stroke-width="2"/>
              <circle cx="232" cy="255" r="5" fill="#e91e9c" opacity="0.6"/>
            </g>

            <!-- 10. Left Leg -->
            <g class="robot-part" data-part="left-leg">
              <rect x="88" y="278" width="40" height="80" rx="12" fill="url(#legGrad)" stroke="#0088cc" stroke-width="2"/>
              <rect x="95" y="310" width="26" height="8" rx="4" fill="#0088cc" opacity="0.3"/>
            </g>

            <!-- 11. Right Leg -->
            <g class="robot-part" data-part="right-leg">
              <rect x="152" y="278" width="40" height="80" rx="12" fill="url(#legGrad2)" stroke="#0088cc" stroke-width="2"/>
              <rect x="159" y="310" width="26" height="8" rx="4" fill="#0088cc" opacity="0.3"/>
            </g>

            <!-- 12. Antenna -->
            <g class="robot-part" data-part="antenna">
              <line x1="140" y1="28" x2="140" y2="56" stroke="#0088cc" stroke-width="4" stroke-linecap="round"/>
              <circle cx="140" cy="22" r="9" fill="#ffe600" stroke="#ffaa00" stroke-width="2"/>
              <circle cx="138" cy="20" r="3" fill="#fff" opacity="0.7"/>
            </g>
          </g>

          <!-- Gradients -->
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1e3a5f"/>
              <stop offset="100%" stop-color="#0f2440"/>
            </linearGradient>
            <linearGradient id="headGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2a4f7f"/>
              <stop offset="100%" stop-color="#1a3558"/>
            </linearGradient>
            <linearGradient id="armGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1e3a5f"/>
              <stop offset="100%" stop-color="#152d4a"/>
            </linearGradient>
            <linearGradient id="armGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1e3a5f"/>
              <stop offset="100%" stop-color="#152d4a"/>
            </linearGradient>
            <linearGradient id="legGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1e3a5f"/>
              <stop offset="100%" stop-color="#122844"/>
            </linearGradient>
            <linearGradient id="legGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1e3a5f"/>
              <stop offset="100%" stop-color="#122844"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>

    <!-- Quiz -->
    <div class="quiz-area" id="quiz-area">
      <div class="quiz-card">
        <div class="problem">
          <div class="problem-text" id="problem-text"></div>
        </div>
        <div class="choices" id="choices"></div>
        <div class="feedback">
          <div class="feedback-text" id="feedback-text"></div>
          <div class="feedback-sub" id="feedback-sub"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Celebration -->
  <div class="celebration" id="celebration">
    <h2>Your Robot is Complete!</h2>
    <p>Amazing work! You built the whole robot!</p>
    <div class="robot-area">
      <div class="robot-stage" id="celebration-robot"></div>
    </div>
    <button class="play-again-btn" onclick="resetGame()">Build Another Robot!</button>
  </div>
</div>

<canvas id="confetti-canvas"></canvas>

<script>
// Robot parts order
const PART_ORDER = [
  'body', 'head', 'left-eye', 'right-eye', 'mouth', 'chest',
  'neck', 'left-arm', 'right-arm', 'left-leg', 'right-leg', 'antenna'
];

const TOTAL_PARTS = PART_ORDER.length;

const PRAISE = [
  "Awesome! 🌟", "Great job! ⭐", "You got it! 🎉", "Super! 🚀",
  "Nice work! 💪", "Amazing! ✨", "Correct! 🤖", "Wow! 🎯",
  "Perfect! 💫", "Yes! 🙌", "Brilliant! 🌈", "Fantastic! 🎊"
];

const ENCOURAGE = [
  "Try again, you got this!", "Almost! Keep going!",
  "Not quite — give it another try!", "So close! Try once more!",
  "Oops! You can do it!"
];

let state = {
  partsUnlocked: 0,
  currentProblem: null,
  answered: false,
  streak: 0
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem() {
  const isAddition = Math.random() < 0.5;
  let a, b, answer;

  if (isAddition) {
    a = randInt(1, 9);
    b = randInt(1, 9);
    answer = a + b;
    return { a, b, op: '+', answer };
  } else {
    // Ensure no negative results
    a = randInt(2, 9);
    b = randInt(1, a);
    answer = a - b;
    return { a, b, op: '−', answer };
  }
}

function generateChoices(answer) {
  const choices = new Set([answer]);
  while (choices.size < 4) {
    // Generate plausible wrong answers near the correct one
    let wrong = answer + randInt(-3, 3);
    if (wrong < 0) wrong = randInt(0, 3);
    if (wrong > 18) wrong = randInt(14, 18);
    if (wrong !== answer) choices.add(wrong);
  }
  return shuffle([...choices]);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showProblem() {
  const problem = generateProblem();
  state.currentProblem = problem;
  state.answered = false;

  const problemText = document.getElementById('problem-text');
  problemText.innerHTML = `${problem.a} <span class="operator">${problem.op}</span> ${problem.b} <span class="equals">=</span> <span class="qmark">?</span>`;

  const choices = generateChoices(problem.answer);
  const choicesEl = document.getElementById('choices');
  choicesEl.innerHTML = '';

  choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c;
    btn.onclick = () => handleAnswer(c, btn);
    choicesEl.appendChild(btn);
  });

  document.getElementById('feedback-text').className = 'feedback-text';
  document.getElementById('feedback-text').textContent = '';
  document.getElementById('feedback-sub').className = 'feedback-sub';
  document.getElementById('feedback-sub').textContent = '';
}

function handleAnswer(chosen, btn) {
  if (state.answered) return;

  const correct = chosen === state.currentProblem.answer;
  const allBtns = document.querySelectorAll('.choice-btn');

  if (correct) {
    state.answered = true;
    state.streak++;
    btn.classList.add('correct');

    // Dim other buttons
    allBtns.forEach(b => {
      if (b !== btn) b.classList.add('dimmed');
      b.disabled = true;
    });

    // Feedback
    const fb = document.getElementById('feedback-text');
    fb.textContent = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    fb.className = 'feedback-text correct-msg show';

    // Show part name
    if (state.partsUnlocked < TOTAL_PARTS) {
      const partName = PART_ORDER[state.partsUnlocked].replace(/-/g, ' ');
      const sub = document.getElementById('feedback-sub');
      sub.textContent = `+ Robot ${partName}!`;
      sub.className = 'feedback-sub show';
    }

    // Unlock robot part
    unlockPart();

    // Update streak display
    updateStreak();

    // Next problem or celebrate
    if (state.partsUnlocked >= TOTAL_PARTS) {
      setTimeout(celebrate, 1500);
    } else {
      setTimeout(showProblem, 1800);
    }
  } else {
    state.streak = 0;
    updateStreak();
    btn.classList.add('wrong');

    const fb = document.getElementById('feedback-text');
    fb.textContent = ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)];
    fb.className = 'feedback-text wrong-msg show';

    // Re-enable after shake
    setTimeout(() => {
      btn.classList.remove('wrong');
      fb.className = 'feedback-text';
    }, 1200);
  }
}

function unlockPart() {
  if (state.partsUnlocked >= TOTAL_PARTS) return;

  const partName = PART_ORDER[state.partsUnlocked];
  const partEl = document.querySelector(`#robot-parts .robot-part[data-part="${partName}"]`);
  const placeholderEls = document.querySelectorAll(`#robot-placeholder .robot-placeholder[data-part="${partName}"]`);

  if (partEl) {
    partEl.classList.add('visible', 'just-added');
    setTimeout(() => partEl.classList.remove('just-added'), 800);
  }

  placeholderEls.forEach(el => el.classList.add('hidden'));

  state.partsUnlocked++;

  // Update progress
  const pct = (state.partsUnlocked / TOTAL_PARTS) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('parts-count').textContent = `Parts: ${state.partsUnlocked} / ${TOTAL_PARTS}`;
}

function updateStreak() {
  const el = document.getElementById('streak-display');
  if (state.streak >= 2) {
    el.textContent = `🔥 ${state.streak} in a row!`;
  } else {
    el.textContent = '';
  }
}

function celebrate() {
  document.getElementById('game-area').style.display = 'none';
  document.querySelector('.progress-wrap').style.display = 'none';

  const cel = document.getElementById('celebration');
  cel.classList.add('active');

  // Clone robot into celebration
  const celebRobot = document.getElementById('celebration-robot');
  const svg = document.getElementById('robot-svg').cloneNode(true);
  svg.classList.add('robot-float');
  // Remove placeholder
  const ph = svg.querySelector('#robot-placeholder');
  if (ph) ph.remove();
  celebRobot.appendChild(svg);

  launchConfetti();
}

function resetGame() {
  state.partsUnlocked = 0;
  state.streak = 0;
  state.answered = false;

  // Hide celebration
  document.getElementById('celebration').classList.remove('active');
  const celebRobot = document.getElementById('celebration-robot');
  celebRobot.innerHTML = '';

  // Show game
  document.getElementById('game-area').style.display = '';
  document.querySelector('.progress-wrap').style.display = '';

  // Reset robot
  document.querySelectorAll('#robot-parts .robot-part').forEach(p => {
    p.classList.remove('visible', 'just-added');
  });
  document.querySelectorAll('#robot-placeholder .robot-placeholder').forEach(p => {
    p.classList.remove('hidden');
  });

  // Reset progress
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('parts-count').textContent = `Parts: 0 / ${TOTAL_PARTS}`;
  document.getElementById('streak-display').textContent = '';

  showProblem();
}

// Simple confetti
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#00d2ff', '#39ff14', '#ffe600', '#e91e9c', '#ff6b00', '#ff4444'];
  const particles = [];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: randInt(6, 12),
      h: randInt(4, 8),
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: randInt(2, 6),
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      p.vy += 0.05;

      if (frame > 80) p.opacity -= 0.015;
      if (p.opacity <= 0) return;

      alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    frame++;
    if (alive && frame < 200) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

// Init
showProblem();
</script>
</body>
</html>
