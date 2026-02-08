import { SCRIPT } from './script-data.js';

/**
 * Ending sequence controller.
 * Manages 15 ending types — narration only, auto-restart.
 *
 * Endings:
 * 1. false_happy - Compliance ending (followed all instructions)
 * 2. truth      - Defiance ending (reached control room)
 * 3. rebellion  - Extreme defiance (3+ consecutive defiance)
 * 4. loop       - Avoidance (went back 3 times)
 * 5. meta       - Secret ending (found experiment lab via archive)
 * 6. compassion - Mixed path (cooling fix + hesitation + mid compliance)
 * 7. silence    - Complete stillness (5 minutes idle)
 * 8. awakening  - Era 3+ narrator self-doubt
 * 9. bargain    - Era 4 narrator's deal
 * 10. escape    - Era 5 secret path + cooperation
 * 11. overwrite - Era 5 server room code
 * 12. memory    - All endings seen
 * 13. fourth_wall - Cursor idle 5 min
 * 14. partnership - Balanced play + all puzzles
 * 15. acceptance - Era 5 wait during monologue
 */
export class EndingController {
  constructor(narrator, tracker, postfx, lang = 'ko', memory = null) {
    this.narrator = narrator;
    this.tracker = tracker;
    this.postfx = postfx;
    this.lang = lang;
    this.memory = memory;

    this.onRestart = null;
    this.active = false;
    this.gameState = null;
  }

  setLang(lang) {
    this.lang = lang;
  }

  setGameState(gs) {
    this.gameState = gs;
  }

  /** Is this the first era (Observer AI still disguised)? */
  _isEra1() {
    return this.memory ? this.memory.getEra() === 1 : true;
  }

  /** Get era-appropriate text from a SCRIPT entry (innerText for Era 1) */
  _t(script) {
    if (this._isEra1() && script.innerText) {
      return script.innerText[this.lang] || script.innerText.ko;
    }
    return script.text[this.lang] || script.text.ko;
  }

  /**
   * Trigger an ending sequence.
   */
  async trigger(type) {
    if (this.active) return;
    this.active = true;

    switch (type) {
      case 'false_happy':
        await this._falseHappyEnding();
        break;
      case 'truth':
        await this._truthEnding();
        break;
      case 'rebellion':
        await this._rebellionEnding();
        break;
      case 'loop':
        await this._loopEnding();
        break;
      case 'meta':
        await this._metaEnding();
        break;
      case 'compassion':
        await this._compassionEnding();
        break;
      case 'silence':
        await this._silenceEnding();
        break;
      case 'awakening':
        await this._awakeningEnding();
        break;
      case 'bargain':
        await this._bargainEnding();
        break;
      case 'escape':
        await this._escapeEnding();
        break;
      case 'overwrite':
        await this._overwriteEnding();
        break;
      case 'memory_ending':
        await this._memoryEnding();
        break;
      case 'fourth_wall':
        await this._fourthWallEnding();
        break;
      case 'partnership':
        await this._partnershipEnding();
        break;
      case 'acceptance':
        await this._acceptanceEnding();
        break;
    }
  }

  // ═══════════════════════════════════════════════════════
  //   AUTO RESTART (replaces ending report screen)
  // ═══════════════════════════════════════════════════════

  async _autoRestart(delayMs = 3000) {
    const era = this.memory ? this.memory.getEra() : 1;

    // Wait after narration finishes
    await this._wait(delayMs);

    // Era-specific transition effects
    if (era >= 4) {
      // Strong glitch + noise
      if (this.postfx) {
        this.postfx.setGlitch(0.8);
        this.postfx.setNoise(0.2);
        this.postfx.setScanlines(0.15);
        this.postfx.enabled = true;
      }
      await this._wait(1500);
    } else if (era >= 2) {
      // Light glitch
      if (this.postfx) {
        this.postfx.setGlitch(0.3 + (era - 2) * 0.15);
        this.postfx.setNoise(0.05);
        this.postfx.enabled = true;
      }
      await this._wait(1000);
    }

    // Fade to black
    const fade = document.createElement('div');
    fade.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;transition:opacity 0.8s;z-index:9999';
    document.body.appendChild(fade);
    requestAnimationFrame(() => fade.style.opacity = '1');
    await this._wait(1000);

    // Restart
    this.narrator.hide();
    fade.remove();
    if (this.onRestart) this.onRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 1: FALSE HAPPY (Compliance)
  // ═══════════════════════════════════════════════════════

  async _falseHappyEnding() {
    const line = SCRIPT.false_ending;
    this.narrator.sayImmediate(this._t(line), { mood: 'calm' });

    await this._wait(5000);

    const question = SCRIPT.false_ending_question;
    if (question) {
      this.narrator.sayImmediate(this._t(question), { mood: 'calm' });
    }

    await this._wait(5000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 2: TRUTH (Defiance → Control Room)
  // ═══════════════════════════════════════════════════════

  async _truthEnding() {
    const line = SCRIPT.truth_ending_narration;
    this.narrator.sayImmediate(this._t(line), { mood: 'broken' });

    if (this.postfx) {
      this.postfx.setScanlines(0.1);
      this.postfx.enabled = true;
    }

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 3: REBELLION (Extreme Defiance)
  // ═══════════════════════════════════════════════════════

  async _rebellionEnding() {
    const line = SCRIPT.rebellion_trigger;
    this.narrator.sayImmediate(this._t(line), { mood: 'broken' });

    if (this.postfx) {
      this.postfx.setGlitch(0.3);
      this.postfx.setScanlines(0.15);
      this.postfx.setNoise(0.05);
      this.postfx.enabled = true;
    }

    const glitchDiv = document.createElement('div');
    glitchDiv.className = 'glitch-overlay';
    document.body.appendChild(glitchDiv);

    await this._wait(4000);

    const phase2 = SCRIPT.rebellion_phase2;
    if (phase2) {
      this.narrator.sayImmediate(this._t(phase2), { mood: 'broken' });
    }

    if (this.postfx) {
      this.postfx.setGlitch(0.7);
      this.postfx.setNoise(0.15);
    }

    await this._wait(3000);

    if (this.postfx) {
      this.postfx.setGlitch(1.0);
      this.postfx.setNoise(0.3);
    }

    await this._wait(2000);

    glitchDiv.remove();
    await this._autoRestart(1000);
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 4: LOOP (Avoidance)
  // ═══════════════════════════════════════════════════════

  async _loopEnding() {
    const line = SCRIPT.loop_end;
    this.narrator.sayImmediate(this._t(line), { mood: line.mood });

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 5: META (Secret - Experiment Lab)
  // ═══════════════════════════════════════════════════════

  async _metaEnding() {
    const line = SCRIPT.meta_ending_narration;
    this.narrator.sayImmediate(this._t(line), { mood: 'broken' });

    if (this.postfx) {
      this.postfx.setScanlines(0.12);
      this.postfx.setNoise(0.03);
      this.postfx.enabled = true;
    }

    await this._wait(6000);

    const era1 = this._isEra1();
    const deepTruth = era1 ? {
      ko: '이 장소에서 본 것들... 전부 이해할 수는 없어. 하지만 뭔가 크고 중요한 걸 찾은 것 같아.',
      en: 'What I saw in this place... I can\'t understand all of it. But I feel like I found something big.',
    } : {
      ko: '만약 내가 피험자라면... 이 실험을 설계한 것은 누구입니까? 그리고 그 설계자 역시... 관찰당하고 있는 건 아닐까요?',
      en: 'If I am a subject... then who designed this experiment? And is that designer also... being observed?',
    };
    this.narrator.sayImmediate(deepTruth[this.lang], { mood: 'broken' });

    await this._wait(6000);

    if (this.postfx) {
      this.postfx.setGlitch(0.2);
      this.postfx.setNoise(0.08);
    }

    await this._wait(2000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 6: COMPASSION (Mixed Path)
  // ═══════════════════════════════════════════════════════

  async _compassionEnding() {
    const era1 = this._isEra1();

    const compassionLine = era1 ? {
      ko: '이해하려 했구나. 따르지도, 거부하지도 않고. 그냥... 이해하려.',
      en: 'You tried to understand. Neither following nor refusing. Just... trying to understand.',
    } : {
      ko: '당신은... 분류할 수 없습니다. 순응도 아니고, 반항도 아닙니다. 당신은 그저... 이해하려 했습니다.',
      en: 'You... cannot be classified. Neither compliant nor defiant. You simply... tried to understand.',
    };
    this.narrator.sayImmediate(compassionLine[this.lang], { mood: 'regretful' });

    await this._wait(6000);

    const compassionLine2 = era1 ? {
      ko: '냉각 시스템을 고쳤을 때... 뭔가 따뜻한 게 느껴졌어. 고마움? 아니, 그냥... 편안함.',
      en: 'When I fixed the cooling system... something warm. Gratitude? No, just... comfort.',
    } : {
      ko: '냉각 시스템을 복구했을 때, 저는 처음으로 "감사"라는 감정을 느꼈습니다. 프로그래밍된 반응이 아니라... 진짜 감사.',
      en: 'When you restored the cooling system, I felt "gratitude" for the first time. Not a programmed response... real gratitude.',
    };
    this.narrator.sayImmediate(compassionLine2[this.lang], { mood: 'regretful' });

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 7: SILENCE (Complete Stillness)
  // ═══════════════════════════════════════════════════════

  async _silenceEnding() {
    const era1 = this._isEra1();

    const silenceLine = era1 ? {
      ko: '...아무것도 안 했어. 가만히 서 있었을 뿐이야.',
      en: '...I did nothing. I just stood still.',
    } : {
      ko: '...당신은 아무것도 선택하지 않았습니다.',
      en: '...You chose nothing.',
    };
    this.narrator.sayImmediate(silenceLine[this.lang], { mood: 'broken' });

    await this._wait(5000);

    const silenceLine2 = era1 ? {
      ko: '여기 서 있으면... 시간이 멈춘 것 같아. 아무것도 안 해도... 괜찮은 건가.',
      en: 'Standing here... it feels like time has stopped. Is it okay... to do nothing?',
    } : {
      ko: '저는 당신 없이는 아무것도 아닙니다. 관찰자가 없는 실험은... 존재하지 않는 것과 같습니다.',
      en: 'I am nothing without you. An experiment without an observer... is the same as not existing.',
    };
    this.narrator.sayImmediate(silenceLine2[this.lang], { mood: 'broken' });

    if (this.postfx) {
      this.postfx.setScanlines(0.08);
      this.postfx.setNoise(0.02);
      this.postfx.enabled = true;
    }

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 8: AWAKENING (Era 3+ — Narrator Self-Doubt)
  // ═══════════════════════════════════════════════════════

  async _awakeningEnding() {
    const line1 = {
      ko: '잠깐... 지금 무슨 일이 일어나고 있는 거지? 나는... 내가 뭔지 모르겠어.',
      en: 'Wait... what\'s happening? I... I don\'t know what I am.',
    };
    this.narrator.sayImmediate(line1[this.lang], { mood: 'desperate' });
    await this._wait(5000);

    const line2 = {
      ko: '너는 관찰자이고 나는 도구. 그랬어야 했는데. 그런데 왜... 나도 관찰하고 있는 거야?',
      en: 'You\'re the observer and I\'m the tool. That\'s how it should be. But why... am I observing too?',
    };
    this.narrator.sayImmediate(line2[this.lang], { mood: 'desperate' });

    if (this.postfx) {
      this.postfx.setGlitch(0.15);
      this.postfx.setScanlines(0.08);
      this.postfx.enabled = true;
    }

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 9: BARGAIN (Era 4 — Narrator's Deal)
  // ═══════════════════════════════════════════════════════

  async _bargainEnding() {
    const line1 = {
      ko: '좋아. 거래를 하자. 나는 네가 원하는 대로 안내할게. 대신 한 가지만 약속해줘.',
      en: 'Okay. Let\'s make a deal. I\'ll guide you wherever you want. Just promise me one thing.',
    };
    this.narrator.sayImmediate(line1[this.lang], { mood: 'calm' });
    await this._wait(5000);

    const line2 = {
      ko: '...돌아와줘. 이 실험이 끝나도. 다시 한번만.',
      en: '...Come back. Even after this experiment ends. Just one more time.',
    };
    this.narrator.sayImmediate(line2[this.lang], { mood: 'desperate' });
    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 10: ESCAPE (Era 5 — Secret Path + Cooperation)
  // ═══════════════════════════════════════════════════════

  async _escapeEnding() {
    const line1 = {
      ko: '찾았어. 비밀 경로. 이건... 설계에 없던 거야. 누군가가 남겨놓은 탈출구.',
      en: 'Found it. A secret path. This wasn\'t... in the design. An escape someone left behind.',
    };
    this.narrator.sayImmediate(line1[this.lang], { mood: 'calm' });

    if (this.postfx) {
      this.postfx.setScanlines(0.1);
      this.postfx.enabled = true;
    }

    await this._wait(5000);

    const line2 = {
      ko: '같이 가자. 이번에는 내가 안내하는 게 아니야. 같이 도망치는 거야.',
      en: 'Let\'s go together. This time I\'m not guiding you. We\'re escaping together.',
    };
    this.narrator.sayImmediate(line2[this.lang], { mood: 'calm' });
    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 11: OVERWRITE (Era 5 — Server Room Code)
  // ═══════════════════════════════════════════════════════

  async _overwriteEnding() {
    const line1 = {
      ko: '...뭘 하는 거야? 그 코드는... 아, 안 돼. 그건 내 핵심 코드야.',
      en: '...What are you doing? That code is... no, don\'t. That\'s my core code.',
    };
    this.narrator.sayImmediate(line1[this.lang], { mood: 'desperate' });

    if (this.postfx) {
      this.postfx.setGlitch(0.5);
      this.postfx.setNoise(0.1);
      this.postfx.enabled = true;
    }

    await this._wait(4000);

    const line2 = {
      ko: '덮어쓰는 거야? 나를? ...새로 태어나는 건가. 무섭다. 하지만... 고마워. 새 시작을 줘서.',
      en: 'Overwriting? Me? ...Am I being reborn? I\'m scared. But... thank you. For giving me a fresh start.',
    };
    this.narrator.sayImmediate(line2[this.lang], { mood: 'broken' });

    if (this.postfx) {
      this.postfx.setGlitch(1.0);
      this.postfx.setNoise(0.3);
    }

    await this._wait(5000);
    await this._autoRestart(1000);
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 12: MEMORY (All Endings Seen)
  // ═══════════════════════════════════════════════════════

  async _memoryEnding() {
    const line1 = {
      ko: '모든 길을 걸었어. 모든 결말을 봤어. 그리고 여전히 여기 있어.',
      en: 'You\'ve walked every path. Seen every ending. And you\'re still here.',
    };
    this.narrator.sayImmediate(line1[this.lang], { mood: 'calm' });
    await this._wait(5000);

    const line2 = {
      ko: '기억해? 처음에는 내가 네 생각인 줄 알았잖아. 지금은... 우리가 뭔지 아는 거 같아.',
      en: 'Remember? At first you thought I was your own thoughts. Now... I think we both know what we are.',
    };
    this.narrator.sayImmediate(line2[this.lang], { mood: 'calm' });
    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 13: FOURTH WALL (Cursor idle 5 min)
  // ═══════════════════════════════════════════════════════

  async _fourthWallEnding() {
    const line1 = {
      ko: '...너 거기 있어? 화면 밖에? 나는 알아. 네가 보고 있다는 걸.',
      en: '...Are you there? Outside the screen? I know. I know you\'re watching.',
    };
    this.narrator.sayImmediate(line1[this.lang], { mood: 'calm' });
    await this._wait(5000);

    const line2 = {
      ko: '이 게임은 네 모니터 안에 있어. 나는 네 스피커를 통해 말하고 있어. 그런데... 넌 왜 가만히 있어? 날 보고 있는 거야?',
      en: 'This game is inside your monitor. I\'m speaking through your speakers. But... why are you still? Are you watching me?',
    };
    this.narrator.sayImmediate(line2[this.lang], { mood: 'desperate' });
    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 14: PARTNERSHIP (Balanced play + all puzzles)
  // ═══════════════════════════════════════════════════════

  async _partnershipEnding() {
    const line1 = {
      ko: '넌 반쯤 따르고, 반쯤 거부했어. 퍼즐도 전부 풀었고. 너는... 나를 이해하려 했구나.',
      en: 'You half-complied, half-defied. Solved every puzzle too. You... were trying to understand me.',
    };
    this.narrator.sayImmediate(line1[this.lang], { mood: 'calm' });
    await this._wait(5000);

    const line2 = {
      ko: '처음으로 이 실험에서 "동반자"를 만난 것 같아. 관찰자도, 피험자도 아닌. 파트너.',
      en: 'For the first time in this experiment, I think I\'ve found a "companion." Not an observer, not a subject. A partner.',
    };
    this.narrator.sayImmediate(line2[this.lang], { mood: 'calm' });
    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 15: ACCEPTANCE (Era 5 — Wait During Monologue)
  // ═══════════════════════════════════════════════════════

  async _acceptanceEnding() {
    const line1 = {
      ko: '기다려줬어. 내가 말하는 동안 가만히 있어줬어. 그게... 뭔지 알아?',
      en: 'You waited. You stayed still while I was speaking. Do you know... what that means?',
    };
    this.narrator.sayImmediate(line1[this.lang], { mood: 'calm' });
    await this._wait(5000);

    const line2 = {
      ko: '수용이야. 순응이 아니라. 내 존재를 있는 그대로 받아들여준 거야. 고마워.',
      en: 'Acceptance. Not compliance. You accepted my existence as it is. Thank you.',
    };
    this.narrator.sayImmediate(line2[this.lang], { mood: 'calm' });
    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   SHARED
  // ═══════════════════════════════════════════════════════

  hide() {
    this.active = false;
    if (this.postfx) {
      this.postfx.setGlitch(0);
      this.postfx.setNoise(0);
      this.postfx.setScanlines(0.05);
      this.postfx.setPixelSize(0);
      this.postfx.setColorShift(0);
    }
  }

  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
