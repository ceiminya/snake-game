const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const canvasFrame = document.querySelector(".canvas-frame");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const speedLevelElement = document.getElementById("speed-level");
const statusTextElement = document.getElementById("status-text");
const overlayElement = document.getElementById("overlay");
const overlayTitleElement = document.getElementById("overlay-title");
const overlayCopyElement = document.getElementById("overlay-copy");
const swipeHintElement = document.getElementById("swipe-hint");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const soundButton = document.getElementById("sound-button");

const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const INITIAL_SPEED = 150;
const MIN_SPEED = 70;
const SPEED_STEP = 8;
const SWIPE_THRESHOLD = 26;
const BEST_SCORE_KEY = "snake-surge-best-score";
const SOUND_ENABLED_KEY = "snake-surge-sound-enabled";
const DEFAULT_SWIPE_HINT = "手机上可直接在棋盘区域滑动转向";

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const DIRECTION_LABELS = {
  up: "向上",
  down: "向下",
  left: "向左",
  right: "向右",
};

const BACKGROUND_ORBS = Array.from({ length: 10 }, (_, index) => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: 40 + Math.random() * 80,
  drift: 8 + Math.random() * 18,
  speed: 0.4 + Math.random() * 0.9,
  color:
    index % 3 === 0
      ? "rgba(97, 218, 251, 0.08)"
      : index % 3 === 1
        ? "rgba(255, 138, 76, 0.08)"
        : "rgba(219, 255, 103, 0.07)",
  phase: Math.random() * Math.PI * 2,
}));

let snake = [];
let food = null;
let direction = DIRECTIONS.right;
let nextDirection = DIRECTIONS.right;
let loopId = null;
let renderLoopId = null;
let lastRenderTime = 0;
let particles = [];
let score = 0;
let bestScore = Number(readStorage(BEST_SCORE_KEY, "0"));
let soundEnabled = readStorage(SOUND_ENABLED_KEY, "true") !== "false";
let speed = INITIAL_SPEED;
let isRunning = false;
let isPaused = false;
let hasStarted = false;
let isCountingDown = false;
let startSequenceId = 0;
let audioContext = null;
let touchStartPoint = null;
let swipeHintTimeoutId = null;

if (!Number.isFinite(bestScore)) {
  bestScore = 0;
}

const scoreCardElement = scoreElement.closest(".stat-card");
const bestScoreCardElement = bestScoreElement.closest(".stat-card");
const speedCardElement = speedLevelElement.closest(".stat-card");
const statusCardElement = statusTextElement.closest(".stat-card");

function readStorage(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors for local-file previews or restricted modes.
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function createStartingSnake() {
  return [
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 },
  ];
}

function resetGameState() {
  snake = createStartingSnake();
  direction = DIRECTIONS.right;
  nextDirection = DIRECTIONS.right;
  score = 0;
  speed = INITIAL_SPEED;
  isPaused = false;
  particles = [];
  food = spawnFood();
  updateHud();
}

async function startGame(initialDirectionName = null) {
  const sequenceId = ++startSequenceId;

  await primeAudio();
  clearLoop();
  resetGameState();

  if (initialDirectionName && DIRECTIONS[initialDirectionName]) {
    const initialDirection = DIRECTIONS[initialDirectionName];
    if (!isOppositeDirection(initialDirection)) {
      direction = initialDirection;
      nextDirection = initialDirection;
    }
  }

  hasStarted = true;
  isRunning = false;
  isPaused = false;
  isCountingDown = true;
  setStatus("倒计时");
  updateHud();
  showOverlay("准备冲刺", "跟着倒计时起步，滑动、方向键和 WASD 都能控蛇。", true);
  canvasFrame.classList.add("starting");
  pulseElement(statusCardElement, "is-bumped");
  pulseOverlay();

  const steps = [
    { title: "3", copy: "稳住起步节奏", delay: 520 },
    { title: "2", copy: "锁定你的线路", delay: 520 },
    { title: "1", copy: "准备冲刺", delay: 520 },
    { title: "GO!", copy: "Snake Surge", delay: 320 },
  ];

  for (const step of steps) {
    if (sequenceId !== startSequenceId) {
      return;
    }

    showOverlay(step.title, step.copy, true);
    pulseOverlay();
    playCountdownSound(step.title);
    await wait(step.delay);
  }

  if (sequenceId !== startSequenceId) {
    return;
  }

  isCountingDown = false;
  isRunning = true;
  setStatus("进行中");
  updateHud();
  hideOverlay();
  canvasFrame.classList.remove("starting");
  triggerFrameEffect("flash");
  spawnParticles(canvas.width / 2, canvas.height / 2, {
    color: "rgba(255, 209, 102, 0.92)",
    count: 18,
    speed: 160,
    size: 3.2,
  });
  playStartSound();
  startLoop();
}

function startLoop() {
  clearLoop();
  loopId = window.setInterval(tick, speed);
}

function clearLoop() {
  if (loopId !== null) {
    window.clearInterval(loopId);
    loopId = null;
  }
}

function restartLoop() {
  clearLoop();
  if (isRunning && !isPaused && !isCountingDown) {
    loopId = window.setInterval(tick, speed);
  }
}

function updateHud() {
  scoreElement.textContent = String(score);
  bestScoreElement.textContent = String(bestScore);
  speedLevelElement.textContent = String(getSpeedLevel());
  pauseButton.disabled = !hasStarted || !isRunning || isCountingDown;
  pauseButton.textContent = isPaused ? "继续" : "暂停";
  soundButton.textContent = soundEnabled ? "音效：开" : "音效：关";
  soundButton.classList.toggle("sound-off", !soundEnabled);
  document.body.classList.toggle("game-running", isRunning && !isPaused);
  document.body.classList.toggle("game-countdown", isCountingDown);
}

function getSpeedLevel() {
  return Math.floor((INITIAL_SPEED - speed) / SPEED_STEP) + 1;
}

function setStatus(text) {
  statusTextElement.textContent = text;
}

function showOverlay(title, copy, countdownMode = false) {
  overlayTitleElement.textContent = title;
  overlayCopyElement.textContent = copy;
  overlayElement.classList.toggle("countdown-mode", countdownMode);
  overlayElement.classList.add("visible");
}

function hideOverlay() {
  overlayElement.classList.remove("visible", "countdown-mode", "pulse");
}

function pulseOverlay() {
  overlayElement.classList.remove("pulse");
  void overlayElement.offsetWidth;
  overlayElement.classList.add("pulse");
}

function spawnFood() {
  if (snake.length >= GRID_SIZE * GRID_SIZE) {
    return null;
  }

  let nextFood = null;

  do {
    nextFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((segment) => segment.x === nextFood.x && segment.y === nextFood.y));

  return nextFood;
}

function tick() {
  if (!isRunning || isPaused || isCountingDown) {
    return;
  }

  direction = nextDirection;
  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };
  const willEat = Boolean(food && newHead.x === food.x && newHead.y === food.y);

  if (isCollision(newHead, willEat)) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  if (willEat) {
    handleEatFood();
  } else {
    snake.pop();
  }
}

function isCollision(position, willEat) {
  const hitWall =
    position.x < 0 ||
    position.x >= GRID_SIZE ||
    position.y < 0 ||
    position.y >= GRID_SIZE;

  if (hitWall) {
    return true;
  }

  const bodyToCheck = willEat ? snake : snake.slice(0, -1);
  return bodyToCheck.some((segment) => segment.x === position.x && segment.y === position.y);
}

function handleEatFood() {
  const eatenFood = food;

  if (!eatenFood) {
    return;
  }

  score += 1;
  pulseElement(scoreCardElement, "is-bumped");

  if (score > bestScore) {
    bestScore = score;
    writeStorage(BEST_SCORE_KEY, String(bestScore));
    pulseElement(bestScoreCardElement, "is-bumped");
  }

  playEatSound();
  triggerFrameEffect("flash");
  spawnCellBurst(eatenFood.x, eatenFood.y, {
    color: "rgba(255, 79, 135, 0.92)",
    count: 16,
    speed: 150,
    size: 2.8,
  });

  if (score % 5 === 0) {
    speed = Math.max(MIN_SPEED, speed - SPEED_STEP);
    pulseElement(speedCardElement, "is-bumped");
    restartLoop();
  }

  if (snake.length === GRID_SIZE * GRID_SIZE) {
    food = null;
    updateHud();
    winGame();
    return;
  }

  food = spawnFood();
  updateHud();
}

function endGame() {
  isRunning = false;
  isPaused = false;
  isCountingDown = false;
  clearLoop();
  updateHud();
  setStatus("已结束");
  pulseElement(statusCardElement, "is-bumped");
  showOverlay("游戏结束", `本局得分 ${score}，按开始按钮、Enter，或直接滑动重新开局。`);
  triggerFrameEffect("impact");
  spawnCellBurst(snake[0].x, snake[0].y, {
    color: "rgba(255, 107, 107, 0.92)",
    count: 24,
    speed: 190,
    size: 3.2,
  });
  playCrashSound();
  canvasFrame.classList.remove("starting");
}

function winGame() {
  isRunning = false;
  isPaused = false;
  isCountingDown = false;
  clearLoop();
  updateHud();
  setStatus("已通关");
  pulseElement(statusCardElement, "is-bumped");
  showOverlay("完美通关", `你已经铺满整个棋盘，最终得分 ${score}。`);
  triggerFrameEffect("flash");
  spawnParticles(canvas.width / 2, canvas.height / 2, {
    color: "rgba(255, 209, 102, 0.95)",
    count: 34,
    speed: 220,
    size: 3.8,
  });
  playWinSound();
  canvasFrame.classList.remove("starting");
}

async function togglePause() {
  if (!hasStarted || isCountingDown || !isRunning) {
    return;
  }

  await primeAudio();

  if (isPaused) {
    isPaused = false;
    setStatus("进行中");
    hideOverlay();
    startLoop();
    playResumeSound();
    triggerFrameEffect("flash");
  } else {
    isPaused = true;
    clearLoop();
    setStatus("已暂停");
    showOverlay("暂停中", "按空格、暂停按钮，或点击中间控制键继续游戏。");
    playPauseSound();
  }

  pulseElement(statusCardElement, "is-bumped");
  updateHud();
}

function ensureAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

async function primeAudio() {
  const context = ensureAudioContext();

  if (context && context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      // Ignore resume issues; the game still works without audio.
    }
  }
}

function playTone({
  frequency,
  duration = 0.12,
  type = "triangle",
  volume = 0.04,
  when = 0,
  sweepTo = null,
}) {
  if (!soundEnabled) {
    return;
  }

  const context = ensureAudioContext();

  if (!context || context.state !== "running") {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startTime = context.currentTime + when;
  const endFrequency = sweepTo ?? frequency;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), startTime + duration);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function playCountdownSound(stepTitle) {
  const frequencyMap = {
    "3": 523.25,
    "2": 587.33,
    "1": 659.25,
    "GO!": 783.99,
  };

  const frequency = frequencyMap[stepTitle] || 523.25;

  playTone({
    frequency,
    duration: stepTitle === "GO!" ? 0.18 : 0.12,
    type: stepTitle === "GO!" ? "sawtooth" : "triangle",
    volume: stepTitle === "GO!" ? 0.055 : 0.038,
    sweepTo: frequency * 1.08,
  });
}

function playStartSound() {
  playTone({
    frequency: 783.99,
    duration: 0.16,
    type: "sine",
    volume: 0.03,
    sweepTo: 880,
  });
  playTone({
    frequency: 987.77,
    duration: 0.14,
    type: "triangle",
    volume: 0.028,
    when: 0.06,
    sweepTo: 1174.66,
  });
}

function playEatSound() {
  playTone({
    frequency: 660,
    duration: 0.09,
    type: "square",
    volume: 0.04,
    sweepTo: 820,
  });
  playTone({
    frequency: 900,
    duration: 0.08,
    type: "triangle",
    volume: 0.03,
    when: 0.05,
    sweepTo: 1050,
  });
}

function playCrashSound() {
  playTone({
    frequency: 210,
    duration: 0.24,
    type: "sawtooth",
    volume: 0.06,
    sweepTo: 72,
  });
  playTone({
    frequency: 140,
    duration: 0.28,
    type: "triangle",
    volume: 0.04,
    when: 0.04,
    sweepTo: 50,
  });
}

function playPauseSound() {
  playTone({
    frequency: 430,
    duration: 0.1,
    type: "square",
    volume: 0.03,
    sweepTo: 310,
  });
}

function playResumeSound() {
  playTone({
    frequency: 360,
    duration: 0.08,
    type: "triangle",
    volume: 0.03,
    sweepTo: 440,
  });
  playTone({
    frequency: 520,
    duration: 0.08,
    type: "triangle",
    volume: 0.03,
    when: 0.07,
    sweepTo: 640,
  });
}

function playWinSound() {
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((frequency, index) => {
    playTone({
      frequency,
      duration: 0.16,
      type: index % 2 === 0 ? "triangle" : "sine",
      volume: 0.04,
      when: index * 0.07,
      sweepTo: frequency * 1.08,
    });
  });
}

function toggleSound() {
  const nextValue = !soundEnabled;
  soundEnabled = nextValue;
  writeStorage(SOUND_ENABLED_KEY, String(nextValue));
  updateHud();

  if (soundEnabled) {
    primeAudio().then(() => {
      playTone({
        frequency: 620,
        duration: 0.1,
        type: "triangle",
        volume: 0.03,
        sweepTo: 760,
      });
    });
  }
}

function startRenderLoop() {
  if (renderLoopId !== null) {
    return;
  }

  const render = (timestamp) => {
    if (!lastRenderTime) {
      lastRenderTime = timestamp;
    }

    const delta = Math.min(32, timestamp - lastRenderTime);
    lastRenderTime = timestamp;
    updateParticles(delta);
    draw(timestamp);
    renderLoopId = window.requestAnimationFrame(render);
  };

  renderLoopId = window.requestAnimationFrame(render);
}

function updateParticles(delta) {
  particles = particles.filter((particle) => {
    particle.life -= delta;
    particle.x += particle.vx * (delta / 1000);
    particle.y += particle.vy * (delta / 1000);
    particle.vx *= 0.99;
    particle.vy *= 0.99;
    particle.vy += 6 * (delta / 1000);
    return particle.life > 0;
  });
}

function spawnParticles(centerX, centerY, { color, count, speed: burstSpeed, size }) {
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.5;
    const velocity = burstSpeed * (0.55 + Math.random() * 0.9);
    const life = 380 + Math.random() * 260;

    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life,
      maxLife: life,
      size: size + Math.random() * 2.2,
      color,
    });
  }

  if (particles.length > 240) {
    particles = particles.slice(-240);
  }
}

function spawnCellBurst(cellX, cellY, options) {
  spawnParticles(cellX * CELL_SIZE + CELL_SIZE / 2, cellY * CELL_SIZE + CELL_SIZE / 2, options);
}

function draw(timestamp = performance.now()) {
  drawBoard(timestamp);
  drawParticles();
  drawFood(timestamp);
  drawSnake(timestamp);
}

function drawBoard(timestamp) {
  const time = timestamp * 0.001;
  const pulse = (Math.sin(time * 2.2) + 1) / 2;
  const baseGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  baseGradient.addColorStop(0, "#071224");
  baseGradient.addColorStop(0.5, "#0b1b34");
  baseGradient.addColorStop(1, "#08101d");

  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  BACKGROUND_ORBS.forEach((orb) => {
    const x = orb.x + Math.cos(time * orb.speed + orb.phase) * orb.drift;
    const y = orb.y + Math.sin(time * orb.speed * 0.9 + orb.phase) * orb.drift;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, orb.radius);
    glow.addColorStop(0, orb.color);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, orb.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  const sweepX = ((time * 120) % (canvas.width + 160)) - 80;
  const sweepGradient = ctx.createLinearGradient(sweepX - 60, 0, sweepX + 60, canvas.height);
  sweepGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  sweepGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
  sweepGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = sweepGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 1;

  for (let index = 1; index < GRID_SIZE; index += 1) {
    const offset = index * CELL_SIZE;
    const alpha = 0.04 + 0.02 * Math.sin(time * 1.8 + index);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;

    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(canvas.width, offset);
    ctx.stroke();
  }

  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = -time * 28;
  ctx.strokeStyle = `rgba(255, 209, 102, ${0.14 + pulse * 0.05})`;
  ctx.strokeRect(8.5, 8.5, canvas.width - 17, canvas.height - 17);
  ctx.restore();
}

function drawFood(timestamp) {
  if (!food) {
    return;
  }

  const time = timestamp * 0.001;
  const centerX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = food.y * CELL_SIZE + CELL_SIZE / 2;
  const radius = CELL_SIZE * (0.28 + 0.04 * Math.sin(time * 8));
  const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2.2);

  glow.addColorStop(0, "rgba(255, 234, 245, 0.95)");
  glow.addColorStop(0.25, "rgba(255, 79, 135, 0.95)");
  glow.addColorStop(1, "rgba(255, 79, 135, 0)");

  ctx.save();
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff4f87";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.46)";
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.32, centerY - radius * 0.32, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 220, 231, 0.55)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSnake(timestamp) {
  const time = timestamp * 0.001;
  const lookDirection = nextDirection;

  snake.forEach((segment, index) => {
    const isHead = index === 0;
    const progress = 1 - index / Math.max(1, snake.length - 1);
    const scale = isHead ? 1 + 0.04 * Math.sin(time * 9) : 1;
    const width = (CELL_SIZE - 3) * scale;
    const height = (CELL_SIZE - 3) * scale;
    const x = segment.x * CELL_SIZE + (CELL_SIZE - width) / 2;
    const y = segment.y * CELL_SIZE + (CELL_SIZE - height) / 2;
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);

    if (isHead) {
      gradient.addColorStop(0, "#efff76");
      gradient.addColorStop(1, "#7aff7e");
    } else {
      gradient.addColorStop(0, `rgba(206, 255, 170, ${0.95 - index * 0.02})`);
      gradient.addColorStop(1, `rgba(96, 255, 150, ${0.82 - index * 0.015})`);
    }

    ctx.save();
    ctx.shadowColor = isHead ? "rgba(219, 255, 103, 0.55)" : `rgba(147, 255, 142, ${0.18 + progress * 0.18})`;
    ctx.shadowBlur = isHead ? 18 : 10;
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, width, height, isHead ? 9 : 7);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = isHead ? "rgba(255, 255, 255, 0.24)" : "rgba(255, 255, 255, 0.14)";
    roundRect(ctx, x + 4, y + 4, Math.max(8, width - 8), Math.max(6, height * 0.22), 5);
    ctx.fill();

    if (isHead) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const eyeOffsetX = width * 0.18;
      const eyeOffsetY = height * 0.16;
      const pupilShiftX = lookDirection.x * 2.2;
      const pupilShiftY = lookDirection.y * 2.2;

      ctx.fillStyle = "#09121e";
      ctx.beginPath();
      ctx.arc(centerX - eyeOffsetX + pupilShiftX, centerY - eyeOffsetY + pupilShiftY, 2.6, 0, Math.PI * 2);
      ctx.arc(centerX + eyeOffsetX + pupilShiftX, centerY - eyeOffsetY + pupilShiftY, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

function drawParticles() {
  ctx.save();

  particles.forEach((particle) => {
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, Math.max(0.8, particle.size * alpha), 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function isOppositeDirection(candidate) {
  return candidate.x + direction.x === 0 && candidate.y + direction.y === 0;
}

function setDirectionByName(name) {
  const candidate = DIRECTIONS[name];

  if (!candidate) {
    return;
  }

  if (isCountingDown) {
    if (!isOppositeDirection(candidate)) {
      direction = candidate;
      nextDirection = candidate;
    }
    return;
  }

  if (!hasStarted || !isRunning) {
    startGame(name);
    return;
  }

  if (isOppositeDirection(candidate)) {
    return;
  }

  nextDirection = candidate;
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();

  if (key === "enter") {
    startGame();
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }

  const keyToDirection = {
    arrowup: "up",
    w: "up",
    arrowdown: "down",
    s: "down",
    arrowleft: "left",
    a: "left",
    arrowright: "right",
    d: "right",
  };

  const directionName = keyToDirection[key];

  if (directionName) {
    event.preventDefault();
    setDirectionByName(directionName);
  }
}

function flashSwipeHint(message) {
  if (!swipeHintElement) {
    return;
  }

  swipeHintElement.textContent = message;
  swipeHintElement.classList.remove("flash");
  void swipeHintElement.offsetWidth;
  swipeHintElement.classList.add("flash");

  if (swipeHintTimeoutId) {
    window.clearTimeout(swipeHintTimeoutId);
  }

  swipeHintTimeoutId = window.setTimeout(() => {
    swipeHintElement.textContent = DEFAULT_SWIPE_HINT;
    swipeHintElement.classList.remove("flash");
  }, 850);
}

function triggerFrameEffect(className) {
  canvasFrame.classList.remove(className);
  void canvasFrame.offsetWidth;
  canvasFrame.classList.add(className);
  window.setTimeout(() => {
    canvasFrame.classList.remove(className);
  }, 420);
}

function pulseElement(element, className) {
  if (!element) {
    return;
  }

  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => {
    element.classList.remove(className);
  }, 520);
}

function handleTouchStart(event) {
  if (event.touches.length !== 1) {
    return;
  }

  primeAudio();
  const touch = event.touches[0];
  touchStartPoint = {
    x: touch.clientX,
    y: touch.clientY,
  };
}

function handleTouchMove(event) {
  if (touchStartPoint) {
    event.preventDefault();
  }
}

function handleTouchEnd(event) {
  if (!touchStartPoint) {
    return;
  }

  const touch = event.changedTouches[0];

  if (!touch) {
    touchStartPoint = null;
    return;
  }

  const deltaX = touch.clientX - touchStartPoint.x;
  const deltaY = touch.clientY - touchStartPoint.y;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  touchStartPoint = null;

  if (Math.max(absX, absY) < SWIPE_THRESHOLD) {
    return;
  }

  const directionName = absX > absY
    ? deltaX > 0
      ? "right"
      : "left"
    : deltaY > 0
      ? "down"
      : "up";

  setDirectionByName(directionName);
  flashSwipeHint(`${DIRECTION_LABELS[directionName]}滑动，已就位`);
}

function handleTouchCancel() {
  touchStartPoint = null;
}

function bindEvents() {
  startButton.addEventListener("click", () => {
    startGame();
  });

  pauseButton.addEventListener("click", () => {
    togglePause();
  });

  soundButton.addEventListener("click", () => {
    toggleSound();
  });

  document.addEventListener("keydown", handleKeydown);

  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => {
      primeAudio();
      setDirectionByName(button.dataset.direction);
    });
  });

  document.querySelectorAll("[data-action='toggle']").forEach((button) => {
    button.addEventListener("click", () => {
      togglePause();
    });
  });

  canvasFrame.addEventListener("touchstart", handleTouchStart, { passive: true });
  canvasFrame.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvasFrame.addEventListener("touchend", handleTouchEnd, { passive: true });
  canvasFrame.addEventListener("touchcancel", handleTouchCancel);
}

function initialize() {
  snake = createStartingSnake();
  food = spawnFood();
  updateHud();
  setStatus("待开始");
  showOverlay("准备开始", "按开始按钮、回车键，或直接在棋盘上滑动开始游戏。");
  startRenderLoop();
  bindEvents();
}

initialize();
