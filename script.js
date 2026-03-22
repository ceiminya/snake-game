const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const canvasFrame = document.querySelector(".canvas-frame");
const heroEyebrowElement = document.getElementById("hero-eyebrow");
const heroCopyElement = document.getElementById("hero-copy");
const scoreLabelElement = document.getElementById("score-label");
const bestScoreLabelElement = document.getElementById("best-score-label");
const speedLevelLabelElement = document.getElementById("speed-level-label");
const statusLabelElement = document.getElementById("status-label");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const speedLevelElement = document.getElementById("speed-level");
const statusTextElement = document.getElementById("status-text");
const controlsHeadingElement = document.getElementById("controls-heading");
const controlTipElements = [
  document.getElementById("control-tip-1"),
  document.getElementById("control-tip-2"),
  document.getElementById("control-tip-3"),
  document.getElementById("control-tip-4"),
];
const hintHeadingElement = document.getElementById("hint-heading");
const hintTipElements = [
  document.getElementById("hint-tip-1"),
  document.getElementById("hint-tip-2"),
  document.getElementById("hint-tip-3"),
];
const settingsKickerElement = document.getElementById("settings-kicker");
const settingsTitleElement = document.getElementById("settings-title");
const settingsCopyElement = document.getElementById("settings-copy");
const settingsNoteElement = document.getElementById("settings-note");
const languageSettingLabelElement = document.getElementById("language-setting-label");
const sizeSettingLabelElement = document.getElementById("size-setting-label");
const speedSettingLabelElement = document.getElementById("speed-setting-label");
const soundSettingLabelElement = document.getElementById("sound-setting-label");
const stageKickerElement = document.getElementById("stage-kicker");
const stageTitleElement = document.getElementById("stage-title");
const overlayElement = document.getElementById("overlay");
const overlayTitleElement = document.getElementById("overlay-title");
const overlayCopyElement = document.getElementById("overlay-copy");
const swipeHintElement = document.getElementById("swipe-hint");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const soundButton = document.getElementById("sound-button");
const languageSelect = document.getElementById("language-select");
const boardSizeSelect = document.getElementById("board-size-select");
const speedSelect = document.getElementById("speed-select");
const soundSelect = document.getElementById("sound-select");

const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const SWIPE_THRESHOLD = 26;
const BEST_SCORE_KEY = "snake-surge-best-score";
const SETTINGS_KEY = "snake-surge-settings";
const LEGACY_SOUND_ENABLED_KEY = "snake-surge-sound-enabled";

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const SPEED_PROFILES = {
  relaxed: {
    initial: 178,
    min: 94,
    step: 6,
  },
  normal: {
    initial: 150,
    min: 70,
    step: 8,
  },
  blitz: {
    initial: 118,
    min: 54,
    step: 10,
  },
};

const TEXT = {
  "zh-CN": {
    htmlLang: "zh-CN",
    pageTitle: "Snake Surge",
    heroEyebrow: "Browser Game",
    heroCopy:
      "一个带霓虹舞台、倒计时开场、合成音效和滑动手势的贪吃蛇小游戏，打开网页就能直接开玩。",
    labels: {
      score: "当前分数",
      best: "历史最高",
      speedLevel: "速度等级",
      status: "游戏状态",
    },
    buttons: {
      start: "开始 / 重开",
      pause: "暂停",
      resume: "继续",
      soundOn: "音效：开",
      soundOff: "音效：关",
    },
    controls: {
      title: "操作说明",
      items: [
        "方向键 / WASD：控制方向",
        "空格：暂停或继续",
        "Enter：快速重新开始",
        "手机端：直接在棋盘区域滑动即可转向",
      ],
    },
    hints: {
      title: "玩法提示",
      items: [
        "每吃到 5 个果实，速度就会提升一级。",
        "撞墙或撞到自己就会结束本局。",
        "开局会有倒计时动画，音效可随时开关。",
      ],
    },
    settings: {
      kicker: "Game Settings",
      title: "游戏设置",
      copy: "切换语言、棋盘显示大小、速度和音效，设置会自动保存。",
      note: "语言和大小立即生效，速度会立刻影响当前节奏。",
      languageLabel: "语言",
      boardSizeLabel: "棋盘显示大小",
      speedLabel: "速度档位",
      soundLabel: "音效",
    },
    stage: {
      kicker: "Neon Arena",
      title: "冲刺舞台",
      swipeHintDefault: "手机上可直接在棋盘区域滑动转向",
      directionLabels: {
        up: "向上",
        down: "向下",
        left: "向左",
        right: "向右",
      },
      swipeHint(direction) {
        return `${this.directionLabels[direction]}滑动，已就位`;
      },
    },
    options: {
      language: {
        "zh-CN": "简体中文",
        "en-US": "English",
      },
      boardSize: {
        compact: "紧凑",
        standard: "标准",
        expanded: "扩展",
      },
      speed: {
        relaxed: "轻松",
        normal: "标准",
        blitz: "疾速",
      },
      sound: {
        on: "开启",
        off: "关闭",
      },
    },
    statuses: {
      ready: "待开始",
      countdown: "倒计时",
      running: "进行中",
      paused: "已暂停",
      gameOver: "已结束",
      win: "已通关",
    },
    overlay: {
      readyTitle: "准备开始",
      readyCopy: "按开始按钮、回车键，或直接在棋盘上滑动开始游戏。",
      countdownIntroTitle: "准备冲刺",
      countdownIntroCopy: "跟着倒计时起步，滑动、方向键和 WASD 都能控蛇。",
      countdownSteps: [
        { title: "3", copy: "稳住起步节奏" },
        { title: "2", copy: "锁定你的线路" },
        { title: "1", copy: "准备冲刺" },
        { title: "GO!", copy: "Snake Surge" },
      ],
      pausedTitle: "暂停中",
      pausedCopy: "按空格、暂停按钮，或点击中间控制键继续游戏。",
      gameOverTitle: "游戏结束",
      gameOverCopy(score) {
        return `本局得分 ${score}，按开始按钮、Enter，或直接滑动重新开局。`;
      },
      winTitle: "完美通关",
      winCopy(score) {
        return `你已经铺满整个棋盘，最终得分 ${score}。`;
      },
    },
  },
  "en-US": {
    htmlLang: "en-US",
    pageTitle: "Snake Surge",
    heroEyebrow: "Browser Game",
    heroCopy:
      "A neon snake game with a countdown intro, synth audio, swipe controls, and live settings for language, board size, and speed.",
    labels: {
      score: "Score",
      best: "Best",
      speedLevel: "Speed Level",
      status: "Game State",
    },
    buttons: {
      start: "Start / Restart",
      pause: "Pause",
      resume: "Resume",
      soundOn: "Sound: On",
      soundOff: "Sound: Off",
    },
    controls: {
      title: "Controls",
      items: [
        "Arrow keys / WASD: steer the snake",
        "Space: pause or resume",
        "Enter: quick restart",
        "On mobile, swipe directly on the board",
      ],
    },
    hints: {
      title: "Tips",
      items: [
        "The game speeds up every 5 fruits.",
        "Hitting a wall or yourself ends the run.",
        "The countdown intro and sound can both be adjusted.",
      ],
    },
    settings: {
      kicker: "Game Settings",
      title: "Settings",
      copy: "Change language, board size, speed, and sound. Everything saves automatically.",
      note: "Language and board size apply instantly, and speed updates the current pace right away.",
      languageLabel: "Language",
      boardSizeLabel: "Board Size",
      speedLabel: "Speed Preset",
      soundLabel: "Sound",
    },
    stage: {
      kicker: "Neon Arena",
      title: "Sprint Stage",
      swipeHintDefault: "Swipe directly on the board to steer on mobile",
      directionLabels: {
        up: "Up",
        down: "Down",
        left: "Left",
        right: "Right",
      },
      swipeHint(direction) {
        return `${this.directionLabels[direction]} swipe queued`;
      },
    },
    options: {
      language: {
        "zh-CN": "简体中文",
        "en-US": "English",
      },
      boardSize: {
        compact: "Compact",
        standard: "Standard",
        expanded: "Expanded",
      },
      speed: {
        relaxed: "Relaxed",
        normal: "Normal",
        blitz: "Blitz",
      },
      sound: {
        on: "On",
        off: "Off",
      },
    },
    statuses: {
      ready: "Ready",
      countdown: "Countdown",
      running: "Running",
      paused: "Paused",
      gameOver: "Game Over",
      win: "Cleared",
    },
    overlay: {
      readyTitle: "Ready to Launch",
      readyCopy: "Press Start, hit Enter, or swipe on the board to begin.",
      countdownIntroTitle: "Get Ready",
      countdownIntroCopy: "Ride the countdown. Swipe, arrow keys, and WASD all work.",
      countdownSteps: [
        { title: "3", copy: "Lock in your rhythm" },
        { title: "2", copy: "Pick your line" },
        { title: "1", copy: "Sprint incoming" },
        { title: "GO!", copy: "Snake Surge" },
      ],
      pausedTitle: "Paused",
      pausedCopy: "Press Space, the pause button, or the center pad button to resume.",
      gameOverTitle: "Game Over",
      gameOverCopy(score) {
        return `You scored ${score}. Press Start, hit Enter, or swipe to run it back.`;
      },
      winTitle: "Perfect Clear",
      winCopy(score) {
        return `You filled the entire board. Final score: ${score}.`;
      },
    },
  },
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
let speedLevel = 1;
let currentTickDelay = SPEED_PROFILES.normal.initial;
let bestScore = Number(readStorage(BEST_SCORE_KEY, "0"));
let isRunning = false;
let isPaused = false;
let hasStarted = false;
let isCountingDown = false;
let startSequenceId = 0;
let audioContext = null;
let touchStartPoint = null;
let swipeHintTimeoutId = null;
let statusKey = "ready";
let overlayState = { mode: "ready", stepIndex: null };

if (!Number.isFinite(bestScore)) {
  bestScore = 0;
}

const settings = loadSettings();
let soundEnabled = settings.soundEnabled;

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
    // Ignore storage failures in restricted preview modes.
  }
}

function normalizeLanguage(value) {
  return value === "en-US" ? "en-US" : "zh-CN";
}

function normalizeBoardSize(value) {
  return ["compact", "standard", "expanded"].includes(value) ? value : "standard";
}

function normalizeSpeedPreset(value) {
  return ["relaxed", "normal", "blitz"].includes(value) ? value : "normal";
}

function normalizeSoundValue(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "on" || value === "true") {
    return true;
  }

  if (value === "off" || value === "false") {
    return false;
  }

  return fallback;
}

function loadSettings() {
  const legacySound = normalizeSoundValue(readStorage(LEGACY_SOUND_ENABLED_KEY, "true"));
  const defaults = {
    language: "zh-CN",
    boardSize: "standard",
    speedPreset: "normal",
    soundEnabled: legacySound,
  };
  const raw = readStorage(SETTINGS_KEY, "");

  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      language: normalizeLanguage(parsed.language),
      boardSize: normalizeBoardSize(parsed.boardSize),
      speedPreset: normalizeSpeedPreset(parsed.speedPreset),
      soundEnabled: normalizeSoundValue(parsed.soundEnabled, defaults.soundEnabled),
    };
  } catch {
    return defaults;
  }
}

function saveSettings() {
  writeStorage(
    SETTINGS_KEY,
    JSON.stringify({
      language: settings.language,
      boardSize: settings.boardSize,
      speedPreset: settings.speedPreset,
      soundEnabled: settings.soundEnabled,
    }),
  );
  writeStorage(LEGACY_SOUND_ENABLED_KEY, String(settings.soundEnabled));
}

function getText() {
  return TEXT[settings.language];
}

function getSpeedProfile() {
  return SPEED_PROFILES[settings.speedPreset] || SPEED_PROFILES.normal;
}

function getCurrentTickDelay() {
  const profile = getSpeedProfile();
  return Math.max(profile.min, profile.initial - (speedLevel - 1) * profile.step);
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

function showOverlayRaw(title, copy, countdownMode = false) {
  overlayTitleElement.textContent = title;
  overlayCopyElement.textContent = copy;
  overlayElement.classList.toggle("countdown-mode", countdownMode);
  overlayElement.classList.add("visible");
}

function hideOverlayRaw() {
  overlayElement.classList.remove("visible", "countdown-mode", "pulse");
}

function setOverlayState(mode, options = {}) {
  overlayState = {
    mode,
    stepIndex: null,
    ...options,
  };
  renderOverlayState();
}

function renderOverlayState() {
  const text = getText();

  if (overlayState.mode === "hidden") {
    hideOverlayRaw();
    return;
  }

  if (overlayState.mode === "ready") {
    showOverlayRaw(text.overlay.readyTitle, text.overlay.readyCopy);
    return;
  }

  if (overlayState.mode === "countdown") {
    if (typeof overlayState.stepIndex === "number") {
      const step = text.overlay.countdownSteps[overlayState.stepIndex];
      showOverlayRaw(step.title, step.copy, true);
    } else {
      showOverlayRaw(text.overlay.countdownIntroTitle, text.overlay.countdownIntroCopy, true);
    }
    return;
  }

  if (overlayState.mode === "paused") {
    showOverlayRaw(text.overlay.pausedTitle, text.overlay.pausedCopy);
    return;
  }

  if (overlayState.mode === "gameOver") {
    showOverlayRaw(text.overlay.gameOverTitle, text.overlay.gameOverCopy(score));
    return;
  }

  if (overlayState.mode === "win") {
    showOverlayRaw(text.overlay.winTitle, text.overlay.winCopy(score));
  }
}

function pulseOverlay() {
  overlayElement.classList.remove("pulse");
  void overlayElement.offsetWidth;
  overlayElement.classList.add("pulse");
}

function setStatusKey(nextStatusKey) {
  statusKey = nextStatusKey;
  statusTextElement.textContent = getText().statuses[nextStatusKey];
}

function populateSelect(selectElement, options, value) {
  const fragment = document.createDocumentFragment();

  Object.entries(options).forEach(([optionValue, optionLabel]) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionLabel;
    fragment.appendChild(option);
  });

  selectElement.replaceChildren(fragment);
  selectElement.value = value;
}

function syncSettingsControls() {
  languageSelect.value = settings.language;
  boardSizeSelect.value = settings.boardSize;
  speedSelect.value = settings.speedPreset;
  soundSelect.value = settings.soundEnabled ? "on" : "off";
}

function applyBoardSizeSetting() {
  document.body.dataset.boardSize = settings.boardSize;
}

function renderLocalizedContent() {
  const text = getText();

  document.documentElement.lang = text.htmlLang;
  document.title = text.pageTitle;
  heroEyebrowElement.textContent = text.heroEyebrow;
  heroCopyElement.textContent = text.heroCopy;
  scoreLabelElement.textContent = text.labels.score;
  bestScoreLabelElement.textContent = text.labels.best;
  speedLevelLabelElement.textContent = text.labels.speedLevel;
  statusLabelElement.textContent = text.labels.status;
  controlsHeadingElement.textContent = text.controls.title;
  hintHeadingElement.textContent = text.hints.title;
  settingsKickerElement.textContent = text.settings.kicker;
  settingsTitleElement.textContent = text.settings.title;
  settingsCopyElement.textContent = text.settings.copy;
  settingsNoteElement.textContent = text.settings.note;
  languageSettingLabelElement.textContent = text.settings.languageLabel;
  sizeSettingLabelElement.textContent = text.settings.boardSizeLabel;
  speedSettingLabelElement.textContent = text.settings.speedLabel;
  soundSettingLabelElement.textContent = text.settings.soundLabel;
  stageKickerElement.textContent = text.stage.kicker;
  stageTitleElement.textContent = text.stage.title;
  startButton.textContent = text.buttons.start;

  controlTipElements.forEach((element, index) => {
    element.textContent = text.controls.items[index];
  });

  hintTipElements.forEach((element, index) => {
    element.textContent = text.hints.items[index];
  });

  populateSelect(languageSelect, text.options.language, settings.language);
  populateSelect(boardSizeSelect, text.options.boardSize, settings.boardSize);
  populateSelect(speedSelect, text.options.speed, settings.speedPreset);
  populateSelect(soundSelect, text.options.sound, settings.soundEnabled ? "on" : "off");
  syncSettingsControls();

  if (!swipeHintElement.classList.contains("flash")) {
    swipeHintElement.textContent = text.stage.swipeHintDefault;
  }

  setStatusKey(statusKey);
  renderOverlayState();
  updateHud();
}

function applySettings() {
  soundEnabled = settings.soundEnabled;
  applyBoardSizeSetting();
  currentTickDelay = getCurrentTickDelay();

  if (isRunning && !isPaused && !isCountingDown) {
    restartLoop();
  }

  renderLocalizedContent();
  saveSettings();
}

function resetGameState() {
  snake = createStartingSnake();
  direction = DIRECTIONS.right;
  nextDirection = DIRECTIONS.right;
  score = 0;
  speedLevel = 1;
  currentTickDelay = getCurrentTickDelay();
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
  setStatusKey("countdown");
  updateHud();
  setOverlayState("countdown");
  canvasFrame.classList.add("starting");
  pulseElement(statusCardElement, "is-bumped");
  pulseOverlay();

  const steps = getText().overlay.countdownSteps;

  for (let index = 0; index < steps.length; index += 1) {
    if (sequenceId !== startSequenceId) {
      return;
    }

    setOverlayState("countdown", { stepIndex: index });
    pulseOverlay();
    playCountdownSound(steps[index].title);
    await wait(index === steps.length - 1 ? 320 : 520);
  }

  if (sequenceId !== startSequenceId) {
    return;
  }

  isCountingDown = false;
  isRunning = true;
  setStatusKey("running");
  updateHud();
  setOverlayState("hidden");
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
  loopId = window.setInterval(tick, currentTickDelay);
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
    loopId = window.setInterval(tick, currentTickDelay);
  }
}

function updateHud() {
  const text = getText();

  scoreElement.textContent = String(score);
  bestScoreElement.textContent = String(bestScore);
  speedLevelElement.textContent = String(speedLevel);
  pauseButton.disabled = !hasStarted || !isRunning || isCountingDown;
  pauseButton.textContent = isPaused ? text.buttons.resume : text.buttons.pause;
  soundButton.textContent = soundEnabled ? text.buttons.soundOn : text.buttons.soundOff;
  soundButton.classList.toggle("sound-off", !soundEnabled);
  soundSelect.value = soundEnabled ? "on" : "off";
  document.body.classList.toggle("game-running", isRunning && !isPaused);
  document.body.classList.toggle("game-countdown", isCountingDown);
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
    speedLevel += 1;
    currentTickDelay = getCurrentTickDelay();
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
  setStatusKey("gameOver");
  pulseElement(statusCardElement, "is-bumped");
  setOverlayState("gameOver");
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
  setStatusKey("win");
  pulseElement(statusCardElement, "is-bumped");
  setOverlayState("win");
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
    setStatusKey("running");
    setOverlayState("hidden");
    startLoop();
    playResumeSound();
    triggerFrameEffect("flash");
  } else {
    isPaused = true;
    clearLoop();
    setStatusKey("paused");
    setOverlayState("paused");
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
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
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

function setSoundEnabled(enabled) {
  settings.soundEnabled = Boolean(enabled);
  soundEnabled = settings.soundEnabled;
  syncSettingsControls();
  updateHud();
  saveSettings();

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

function toggleSound() {
  setSoundEnabled(!settings.soundEnabled);
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
  if (event.target instanceof HTMLSelectElement) {
    return;
  }

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

function flashSwipeHint(directionName) {
  const text = getText();
  swipeHintElement.textContent = text.stage.swipeHint(directionName);
  swipeHintElement.classList.remove("flash");
  void swipeHintElement.offsetWidth;
  swipeHintElement.classList.add("flash");

  if (swipeHintTimeoutId) {
    window.clearTimeout(swipeHintTimeoutId);
  }

  swipeHintTimeoutId = window.setTimeout(() => {
    swipeHintElement.textContent = getText().stage.swipeHintDefault;
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
  flashSwipeHint(directionName);
}

function handleTouchCancel() {
  touchStartPoint = null;
}

function handleLanguageChange(event) {
  settings.language = normalizeLanguage(event.target.value);
  applySettings();
}

function handleBoardSizeChange(event) {
  settings.boardSize = normalizeBoardSize(event.target.value);
  applySettings();
}

function handleSpeedChange(event) {
  settings.speedPreset = normalizeSpeedPreset(event.target.value);
  currentTickDelay = getCurrentTickDelay();
  applySettings();
}

function handleSoundSelectChange(event) {
  setSoundEnabled(event.target.value === "on");
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

  languageSelect.addEventListener("change", handleLanguageChange);
  boardSizeSelect.addEventListener("change", handleBoardSizeChange);
  speedSelect.addEventListener("change", handleSpeedChange);
  soundSelect.addEventListener("change", handleSoundSelectChange);
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
  currentTickDelay = getCurrentTickDelay();
  setStatusKey("ready");
  setOverlayState("ready");
  applyBoardSizeSetting();
  renderLocalizedContent();
  updateHud();
  startRenderLoop();
  bindEvents();
}

initialize();
