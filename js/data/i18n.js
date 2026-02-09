/**
 * Internationalization (i18n) system.
 * Supports Korean (ko) and English (en).
 */

const STRINGS = {
  subtitle: {
    ko: '당신의 선택은 정말 당신의 것인가?',
    en: 'Are your choices truly your own?',
  },
  start: {
    ko: '시작하기',
    en: 'Start',
  },
  clickToPlay: {
    ko: '클릭하여 게임을 시작하세요',
    en: 'Click to start the game',
  },
  controls: {
    ko: 'WASD 이동 | 마우스 시점 | E 상호작용 | F 손전등 | Space 스킵 | ESC 일시정지',
    en: 'WASD Move | Mouse Look | E Interact | F Flashlight | Space Skip | ESC Pause',
  },
  paused: {
    ko: '일시정지',
    en: 'Paused',
  },
  resume: {
    ko: '계속하기',
    en: 'Resume',
  },
  restart: {
    ko: '다시 시작',
    en: 'Restart',
  },
  playAgain: {
    ko: '다시 플레이',
    en: 'Play Again',
  },
  interact: {
    ko: 'E키를 눌러 상호작용',
    en: 'Press E to interact',
  },
  resetAll: {
    ko: '초기화',
    en: 'Reset',
  },
  resetConfirm: {
    ko: '모든 진행 상황이 삭제됩니다. 정말 초기화할까요?',
    en: 'All progress will be erased. Are you sure?',
  },
  enterCode: {
    ko: '보안 코드를 입력하세요',
    en: 'Enter security code',
  },
  codeHint: {
    ko: 'ESC 취소',
    en: 'ESC to cancel',
  },
};

let currentLang = 'ko';

/**
 * Set the current language and update all UI elements.
 */
export function setLanguage(lang) {
  currentLang = lang;
  updateAllText();
}

/**
 * Get current language.
 */
export function getLanguage() {
  return currentLang;
}

/**
 * Get a translated string.
 */
export function t(key) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[currentLang] || entry.ko || key;
}

/**
 * Update all DOM elements with data-i18n attribute.
 */
export function updateAllText() {
  const els = document.querySelectorAll('[data-i18n]');
  for (const el of els) {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text) {
      el.textContent = text;
    }
  }

  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`btn-lang-${currentLang}`);
  if (activeBtn) activeBtn.classList.add('active');
}
