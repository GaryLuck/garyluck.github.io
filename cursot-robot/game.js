(function () {
  'use strict';

  const TOTAL_PARTS = 10;
  const MIN_DIGIT = 0;
  const MAX_DIGIT = 9;

  let correctCount = 0;
  let currentAnswer = null;

  const robotEl = document.getElementById('robot');
  const partsCountEl = document.getElementById('partsCount');
  const problemTextEl = document.getElementById('problemText');
  const answerChoicesEl = document.getElementById('answerChoices');
  const feedbackEl = document.getElementById('feedback');
  const completeActionsEl = document.getElementById('completeActions');
  const resetBtnEl = document.getElementById('resetBtn');
  const confettiContainerEl = document.getElementById('confettiContainer');

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    var i = arr.length;
    while (i) {
      var j = getRandomInt(0, i - 1);
      var t = arr[--i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function generateProblem() {
    var isAddition = Math.random() < 0.5;
    var a, b, answer;
    if (isAddition) {
      do {
        a = getRandomInt(MIN_DIGIT, MAX_DIGIT);
        b = getRandomInt(MIN_DIGIT, MAX_DIGIT);
        answer = a + b;
      } while (answer > MAX_DIGIT);
    } else {
      a = getRandomInt(MIN_DIGIT, MAX_DIGIT);
      b = getRandomInt(MIN_DIGIT, a);
      answer = a - b;
    }
    currentAnswer = answer;
    var op = isAddition ? '+' : '−';
    problemTextEl.textContent = a + ' ' + op + ' ' + b + ' = ?';
    renderChoiceButtons();
  }

  function getChoiceValues() {
    var correct = currentAnswer;
    var options = [correct];
    while (options.length < 4) {
      var n = getRandomInt(MIN_DIGIT, MAX_DIGIT);
      if (options.indexOf(n) === -1) options.push(n);
    }
    return shuffle(options);
  }

  function renderChoiceButtons() {
    answerChoicesEl.innerHTML = '';
    var values = getChoiceValues();
    values.forEach(function (value) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-choice';
      btn.textContent = value;
      btn.setAttribute('aria-label', 'Answer: ' + value);
      btn.addEventListener('click', function () {
        handleChoice(value);
      });
      answerChoicesEl.appendChild(btn);
    });
  }

  function handleChoice(chosen) {
    if (chosen === currentAnswer) {
      var wasComplete = correctCount >= TOTAL_PARTS;
      correctCount = Math.min(correctCount + 1, TOTAL_PARTS);
      revealNextPart();
      updatePartsCount();
      if (correctCount >= TOTAL_PARTS) {
        showFeedback('Your robot is complete!', 'complete');
        if (!wasComplete) runConfetti();
        completeActionsEl.hidden = false;
      } else {
        showFeedback('Correct! You added a part!', 'correct');
        generateProblem();
      }
    } else {
      showFeedback('Try again! You can do it!', 'try-again');
    }
  }

  function runConfetti() {
    var colors = ['#2563eb', '#16a34a', '#ca8a04', '#dc2626', '#9333ea', '#0ea5e9', '#f59e0b', '#ec4899'];
    var count = 60;
    while (count--) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.animationDuration = 3 + Math.random() * 1.5 + 's';
      piece.style.backgroundColor = colors[getRandomInt(0, colors.length - 1)];
      confettiContainerEl.appendChild(piece);
    }
    setTimeout(function () {
      confettiContainerEl.innerHTML = '';
    }, 5000);
  }

  function resetRobot() {
    correctCount = 0;
    var parts = robotEl.querySelectorAll('.part');
    parts.forEach(function (part) {
      part.classList.remove('reveal');
      part.style.visibility = 'hidden';
      part.style.opacity = '0';
    });
    updatePartsCount();
    completeActionsEl.hidden = true;
    showFeedback('', '');
    confettiContainerEl.innerHTML = '';
    generateProblem();
  }

  function showFeedback(message, className) {
    feedbackEl.textContent = message;
    feedbackEl.className = 'feedback ' + (className || '');
  }

  function revealNextPart() {
    const parts = robotEl.querySelectorAll('.part');
    if (correctCount <= parts.length) {
      const part = parts[correctCount - 1];
      if (part) {
        part.classList.add('reveal');
        part.style.visibility = 'visible';
        part.style.opacity = '1';
      }
    }
  }

  function buildRobotDOM() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 160 200');
    svg.setAttribute('aria-hidden', 'true');

    function el(name, attrs) {
      const elem = document.createElementNS(ns, name);
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v != null) elem.setAttribute(k.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''), v);
      });
      return elem;
    }

    var part1 = el('g', { class: 'part', 'data-part': '1', style: 'visibility:hidden;opacity:0' });
    part1.appendChild(el('rect', { x: 40, y: 178, width: 80, height: 14, rx: 4, fill: '#64748b' }));
    part1.appendChild(el('rect', { x: 50, y: 182, width: 22, height: 10, rx: 2, fill: '#475569' }));
    part1.appendChild(el('rect', { x: 88, y: 182, width: 22, height: 10, rx: 2, fill: '#475569' }));

    var part2 = el('g', { class: 'part', 'data-part': '2', style: 'visibility:hidden;opacity:0' });
    part2.appendChild(el('rect', { x: 52, y: 138, width: 24, height: 42, rx: 6, fill: '#3b82f6' }));
    part2.appendChild(el('rect', { x: 56, y: 142, width: 8, height: 34, rx: 2, fill: '#60a5fa' }));

    var part3 = el('g', { class: 'part', 'data-part': '3', style: 'visibility:hidden;opacity:0' });
    part3.appendChild(el('rect', { x: 84, y: 138, width: 24, height: 42, rx: 6, fill: '#3b82f6' }));
    part3.appendChild(el('rect', { x: 96, y: 142, width: 8, height: 34, rx: 2, fill: '#60a5fa' }));

    var part4 = el('g', { class: 'part', 'data-part': '4', style: 'visibility:hidden;opacity:0' });
    part4.appendChild(el('rect', { x: 44, y: 78, width: 72, height: 62, rx: 12, fill: '#2563eb' }));
    part4.appendChild(el('rect', { x: 54, y: 88, width: 52, height: 42, rx: 6, fill: '#3b82f6' }));
    part4.appendChild(el('circle', { cx: 80, cy: 105, r: 6, fill: '#93c5fd' }));
    part4.appendChild(el('circle', { cx: 80, cy: 125, r: 6, fill: '#93c5fd' }));

    var part5 = el('g', { class: 'part', 'data-part': '5', style: 'visibility:hidden;opacity:0' });
    part5.appendChild(el('rect', { x: 56, y: 28, width: 48, height: 52, rx: 14, fill: '#1d4ed8' }));
    part5.appendChild(el('rect', { x: 62, y: 34, width: 36, height: 40, rx: 10, fill: '#2563eb' }));

    var part6 = el('g', { class: 'part', 'data-part': '6', style: 'visibility:hidden;opacity:0' });
    part6.appendChild(el('rect', { x: 18, y: 88, width: 28, height: 14, rx: 7, fill: '#3b82f6' }));
    part6.appendChild(el('rect', { x: 20, y: 90, width: 24, height: 10, rx: 5, fill: '#60a5fa' }));
    part6.appendChild(el('circle', { cx: 22, cy: 95, r: 6, fill: '#93c5fd' }));

    var part7 = el('g', { class: 'part', 'data-part': '7', style: 'visibility:hidden;opacity:0' });
    part7.appendChild(el('rect', { x: 114, y: 88, width: 28, height: 14, rx: 7, fill: '#3b82f6' }));
    part7.appendChild(el('rect', { x: 116, y: 90, width: 24, height: 10, rx: 5, fill: '#60a5fa' }));
    part7.appendChild(el('circle', { cx: 138, cy: 95, r: 6, fill: '#93c5fd' }));

    var part8 = el('g', { class: 'part', 'data-part': '8', style: 'visibility:hidden;opacity:0' });
    part8.appendChild(el('line', { x1: 80, y1: 28, x2: 80, y2: 8, stroke: '#64748b', 'stroke-width': 4, 'stroke-linecap': 'round' }));
    part8.appendChild(el('circle', { cx: 80, cy: 6, r: 8, fill: '#fbbf24' }));

    var part9 = el('g', { class: 'part', 'data-part': '9', style: 'visibility:hidden;opacity:0' });
    part9.appendChild(el('ellipse', { cx: 68, cy: 48, rx: 8, ry: 10, fill: '#f8fafc' }));
    part9.appendChild(el('circle', { cx: 68, cy: 50, r: 4, fill: '#1e293b' }));
    part9.appendChild(el('circle', { cx: 70, cy: 48, r: 1.5, fill: '#fff' }));

    var part10 = el('g', { class: 'part', 'data-part': '10', style: 'visibility:hidden;opacity:0' });
    part10.appendChild(el('ellipse', { cx: 92, cy: 48, rx: 8, ry: 10, fill: '#f8fafc' }));
    part10.appendChild(el('circle', { cx: 92, cy: 50, r: 4, fill: '#1e293b' }));
    part10.appendChild(el('circle', { cx: 94, cy: 48, r: 1.5, fill: '#fff' }));
    part10.appendChild(el('path', { d: 'M 72 68 Q 80 78 88 68', stroke: '#1e293b', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }));

    [part1, part2, part3, part4, part5, part6, part7, part8, part9, part10].forEach(function (p) {
      svg.appendChild(p);
    });
    robotEl.appendChild(svg);
  }

  function updatePartsCount() {
    partsCountEl.textContent = correctCount + ' of ' + TOTAL_PARTS + ' parts';
  }

  function init() {
    buildRobotDOM();
    updatePartsCount();
    generateProblem();
    showFeedback('', '');
    resetBtnEl.addEventListener('click', resetRobot);
  }

  init();
})();
