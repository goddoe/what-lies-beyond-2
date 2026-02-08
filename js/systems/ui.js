import { State } from './game-state.js';
import { setLanguage, getLanguage, updateAllText } from '../data/i18n.js';

/**
 * UI manager: menus, crosshair, HUD elements.
 */
export class UI {
  constructor(gameState) {
    this.gameState = gameState;

    // Elements
    this.startMenu = document.getElementById('start-menu');
    this.clickToPlay = document.getElementById('click-to-play');
    this.pauseMenu = document.getElementById('pause-menu');
    this.crosshair = document.getElementById('crosshair');
    this.interactPrompt = document.getElementById('interact-prompt');

    // Buttons
    this.btnStart = document.getElementById('btn-start');
    this.btnResume = document.getElementById('btn-resume');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnLangKo = document.getElementById('btn-lang-ko');
    this.btnLangEn = document.getElementById('btn-lang-en');

    // Callbacks
    this.onStart = null;
    this.onResume = null;
    this.onRestart = null;
    this.onLanguageChange = null;

    this._setupListeners();
    this._setupStateSync();
  }

  _setupListeners() {
    this.btnStart.addEventListener('click', () => {
      if (this.onStart) this.onStart();
    });

    this.btnResume.addEventListener('click', () => {
      if (this.onResume) this.onResume();
    });

    this.btnRestart.addEventListener('click', () => {
      if (this.onRestart) this.onRestart();
    });

    this.btnLangKo.addEventListener('click', () => {
      setLanguage('ko');
      if (this.onLanguageChange) this.onLanguageChange('ko');
    });

    this.btnLangEn.addEventListener('click', () => {
      setLanguage('en');
      if (this.onLanguageChange) this.onLanguageChange('en');
    });
  }

  _setupStateSync() {
    this.gameState.on('stateChange', ({ to }) => {
      this.syncToState(to);
    });
  }

  /**
   * Sync UI visibility to game state.
   */
  syncToState(state) {
    // Hide all overlays
    this.startMenu.style.display = 'none';
    this.clickToPlay.style.display = 'none';
    this.pauseMenu.style.display = 'none';
    this.crosshair.style.display = 'none';
    this.interactPrompt.style.display = 'none';

    switch (state) {
      case State.MENU:
        this.startMenu.style.display = 'flex';
        break;

      case State.CLICK_TO_PLAY:
        this.clickToPlay.style.display = 'flex';
        break;

      case State.PLAYING:
        this.crosshair.style.display = 'block';
        break;

      case State.PAUSED:
        this.pauseMenu.style.display = 'flex';
        break;

      case State.ENDING:
        // Ending screen managed by EndingController
        break;
    }
  }

  /**
   * Show/hide interaction prompt.
   */
  showInteractPrompt(show = true) {
    this.interactPrompt.style.display = show ? 'block' : 'none';
  }

  /**
   * Initial UI setup.
   */
  init() {
    updateAllText();
    this.syncToState(this.gameState.current);
  }
}
