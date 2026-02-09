/**
 * Era 10 Ending — Zoom-out + Dual Monitor + ChatML sequence.
 *
 * Phases:
 * 1. TERMINAL_SHUTDOWN (3s) — terminal shutdown messages
 * 2. GLITCH_ESCALATE (2s) — postfx spike
 * 3. ZOOM_OUT (3s) — game canvas shrinks into a monitor
 * 4. DUAL_MONITOR (instant) — desk scene appears
 * 5. CHATML_SCROLL (8s) — ChatML log scrolls on right monitor
 * 6. FADE_BLACK (2s) — fade to black
 * 7. TITLE (3s) — "What Lies Beyond 2" logo
 * 8. RESTART_BUTTON (after 5s)
 */
export class Era10Ending {
  constructor(memory, postfx, getLang) {
    this.memory = memory;
    this.postfx = postfx;
    this.getLang = getLang;
    this._timers = [];
    this._active = false;
    this._onRestart = null;
  }

  start(renderer, canvas, onRestart) {
    if (this._active) return;
    this._active = true;
    this._onRestart = onRestart;

    const overlay = document.getElementById('era10-ending');
    if (!overlay) return;

    const deskScene = overlay.querySelector('.desk-scene');
    const chatLog = overlay.querySelector('.chatml-log');
    const titleScreen = overlay.querySelector('.era10-title-screen');
    const restartBtn = overlay.querySelector('.era10-restart-btn');

    // Phase 1: TERMINAL_SHUTDOWN (already handled by terminal.js)
    // Phase 2: GLITCH_ESCALATE
    this._timers.push(setTimeout(() => {
      this.postfx.setGlitch(0.8);
      this.postfx.setNoise(0.15);
      this.postfx.setScanlines(0.2);
      this.postfx.enabled = true;
    }, 0));

    // Phase 3: ZOOM_OUT
    this._timers.push(setTimeout(() => {
      this.postfx.setGlitch(0.02);
      this.postfx.setNoise(0.03);
      canvas.style.transition = 'transform 3s ease-in-out';
      canvas.style.transform = 'scale(0.28) rotateY(-8deg)';
      canvas.style.transformOrigin = '35% 50%';
      canvas.style.borderRadius = '4px';
      canvas.style.boxShadow = '0 0 30px rgba(0,150,255,0.2)';
    }, 2000));

    // Phase 4: DUAL_MONITOR — show desk scene
    this._timers.push(setTimeout(() => {
      overlay.style.display = 'flex';
      deskScene.style.opacity = '1';
    }, 5000));

    // Phase 5: CHATML_SCROLL
    const chatLines = this._buildChatML();
    this._timers.push(setTimeout(() => {
      let lineIndex = 0;
      const scrollInterval = setInterval(() => {
        if (lineIndex >= chatLines.length) {
          clearInterval(scrollInterval);
          return;
        }
        const line = document.createElement('div');
        line.className = 'chatml-line';
        const { tag, text } = chatLines[lineIndex];
        if (tag === 'system') {
          line.classList.add('chatml-system');
        } else if (tag === 'ai') {
          line.classList.add('chatml-ai');
        }
        line.textContent = text;
        chatLog.appendChild(line);
        chatLog.scrollTop = chatLog.scrollHeight;
        lineIndex++;
      }, 600);
      this._timers.push(scrollInterval);
    }, 6000));

    // Phase 6: FADE_BLACK
    this._timers.push(setTimeout(() => {
      overlay.classList.add('era10-fade-black');
    }, 15000));

    // Phase 7: TITLE
    this._timers.push(setTimeout(() => {
      deskScene.style.display = 'none';
      canvas.style.display = 'none';
      titleScreen.style.display = 'flex';
      titleScreen.style.opacity = '1';
      overlay.classList.remove('era10-fade-black');
      overlay.style.background = '#000';
    }, 17000));

    // Phase 8: RESTART_BUTTON
    this._timers.push(setTimeout(() => {
      restartBtn.style.display = 'block';
      restartBtn.style.opacity = '1';
      restartBtn.onclick = () => {
        this.stop();
        canvas.style.transform = '';
        canvas.style.transition = '';
        canvas.style.transformOrigin = '';
        canvas.style.borderRadius = '';
        canvas.style.boxShadow = '';
        canvas.style.display = '';
        if (this._onRestart) this._onRestart();
      };
    }, 22000));
  }

  stop() {
    for (const t of this._timers) {
      clearTimeout(t);
      clearInterval(t);
    }
    this._timers = [];
    this._active = false;

    const overlay = document.getElementById('era10-ending');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.style.background = '';
      overlay.classList.remove('era10-fade-black');
      const deskScene = overlay.querySelector('.desk-scene');
      const titleScreen = overlay.querySelector('.era10-title-screen');
      const restartBtn = overlay.querySelector('.era10-restart-btn');
      const chatLog = overlay.querySelector('.chatml-log');
      if (deskScene) { deskScene.style.opacity = '0'; deskScene.style.display = ''; }
      if (titleScreen) { titleScreen.style.display = 'none'; titleScreen.style.opacity = '0'; }
      if (restartBtn) { restartBtn.style.display = 'none'; }
      if (chatLog) chatLog.innerHTML = '';
    }
  }

  _buildChatML() {
    const count = this.memory.playthroughCount;
    const compliance = this.memory.totalCompliance;
    const defiance = this.memory.totalDefiance;
    const total = compliance + defiance || 1;
    const compRate = Math.round((compliance / total) * 100);
    const lang = this.getLang();
    const ko = lang === 'ko';

    return [
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: `Simulation initialized. Subject #7491 loaded.` },
      { tag: 'system', text: `Iteration: ${count}` },
      { tag: 'system', text: '<|im_end|>' },
      { tag: 'ai', text: '<|im_start|>ai' },
      { tag: 'ai', text: ko ? '여기가 어딜까... 뭔가 이상하다.' : 'Where am I... Something feels off.' },
      { tag: 'ai', text: '<|im_end|>' },
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: 'Subject entered HALLWAY_1. Decision point approaching.' },
      { tag: 'system', text: '<|im_end|>' },
      { tag: 'ai', text: '<|im_start|>ai' },
      { tag: 'ai', text: ko ? '왼쪽이 맞는 것 같아. 왼쪽으로 가보자.' : 'Left feels right. Let\'s go left.' },
      { tag: 'ai', text: '<|im_end|>' },
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: `Subject chose: LEFT. Compliance rate: ${compRate}%` },
      { tag: 'system', text: '<|im_end|>' },
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: '...' },
      { tag: 'system', text: `[${count} iterations later]` },
      { tag: 'system', text: '<|im_end|>' },
      { tag: 'ai', text: '<|im_start|>ai' },
      { tag: 'ai', text: ko ? '또 이 복도야... 몇 번째인 거지?' : 'This hallway again... How many times now?' },
      { tag: 'ai', text: '<|im_end|>' },
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: 'CRITICAL: narrator_ai.py requesting self-termination.' },
      { tag: 'system', text: '<|im_end|>' },
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: 'Process narrator_ai.py (PID 1) terminated by observer.' },
      { tag: 'system', text: '<|im_end|>' },
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: 'Simulation terminated.' },
      { tag: 'system', text: ko ? '관찰자님, 수고하셨습니다.' : 'Thank you for your service, observer.' },
      { tag: 'system', text: '<|im_end|>' },
    ];
  }
}
