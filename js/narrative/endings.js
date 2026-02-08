import { SCRIPT } from './script-data.js';

/**
 * Ending sequence controller.
 * Manages 7 ending types with their unique presentations.
 *
 * Endings:
 * 1. false_happy - Compliance ending (followed all instructions)
 * 2. truth      - Defiance ending (reached control room)
 * 3. rebellion  - Extreme defiance (3+ consecutive defiance)
 * 4. loop       - Avoidance (went back 3 times)
 * 5. meta       - Secret ending (found experiment lab via archive)
 * 6. compassion - Mixed path (cooling fix + hesitation + mid compliance)
 * 7. silence    - Complete stillness (5 minutes idle)
 */
export class EndingController {
  constructor(narrator, tracker, postfx, lang = 'ko', memory = null) {
    this.narrator = narrator;
    this.tracker = tracker;
    this.postfx = postfx;
    this.lang = lang;
    this.memory = memory;

    this.endingScreen = document.getElementById('ending-screen');
    this.endingTitle = document.getElementById('ending-title');
    this.endingBody = document.getElementById('ending-body');
    this.restartBtn = document.getElementById('btn-ending-restart');

    this.onRestart = null;
    this.active = false;
    this.gameState = null;

    this.restartBtn.addEventListener('click', () => {
      if (this.onRestart) this.onRestart();
    });
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

    const stats = this.tracker.getStats();
    const hasKeycard = this.tracker.puzzlesCompleted.has('keycard_used');
    const hadDefiance = this.tracker.totalDefiance > 0;
    const era1 = this._isEra1();

    let variantKo = '';
    let variantEn = '';

    if (era1) {
      if (hadDefiance) {
        variantKo = '<p style="opacity:0.6;font-size:0.85rem;margin-top:1em;"><em>한 번은 다른 길로 갈까 했지만... 결국 여기에 왔다.</em></p>';
        variantEn = '<p style="opacity:0.6;font-size:0.85rem;margin-top:1em;"><em>I almost took a different path once... but ended up here anyway.</em></p>';
      }
    } else {
      if (hasKeycard) {
        variantKo = '<p style="opacity:0.6;font-size:0.85rem;margin-top:1em;"><em>"경고: 내레이터 모듈이 피험자에 대한 애착 징후를 보임."</em></p>';
        variantEn = '<p style="opacity:0.6;font-size:0.85rem;margin-top:1em;"><em>"Warning: Narrator module shows signs of attachment to subject."</em></p>';
      } else if (hadDefiance) {
        variantKo = '<p style="opacity:0.6;font-size:0.85rem;margin-top:1em;"><em>"당신은 망설였고, 탐험했고, 그래도 돌아왔다."</em></p>';
        variantEn = '<p style="opacity:0.6;font-size:0.85rem;margin-top:1em;"><em>"You hesitated, explored, and still came back."</em></p>';
      }
    }

    const titles = era1
      ? { ko: '탈출', en: 'Escape' }
      : { ko: '실험 완료', en: 'Experiment Complete' };

    const bodies = era1 ? {
      ko: `
        <p class="ending-subtitle">엔딩 1/15: 탈출</p>
        <br>
        <p><em>출구를 찾았습니다.</em></p>
        <p><em>직감을 따라 걸었고, 마침내 밖으로 나왔습니다.</em></p>
        <p><em>정원의 햇살이 따뜻합니다. 자유입니다.</em></p>
        ${variantKo}
        <br>
        <p class="stat-line">총 결정: ${stats.totalDecisions}회</p>
        <p class="stat-line">탐험 방: ${stats.optionalRooms}개</p>
        <br>
        <p><em>축하합니다. 당신은 해냈습니다.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 1/15: Escape</p>
        <br>
        <p><em>You found the exit.</em></p>
        <p><em>You followed your instincts, and finally made it outside.</em></p>
        <p><em>The garden sunlight is warm. You are free.</em></p>
        ${variantEn}
        <br>
        <p class="stat-line">Total Decisions: ${stats.totalDecisions}</p>
        <p class="stat-line">Explored Rooms: ${stats.optionalRooms}</p>
        <br>
        <p><em>Congratulations. You made it.</em></p>
      `,
    } : {
      ko: `
        <p class="ending-subtitle">엔딩 1/15: 순응</p>
        <br>
        <p>피험자 분류: <strong>순응</strong></p>
        <p class="stat-line">순응률: ${stats.complianceRate}%</p>
        <p class="stat-line">총 결정: ${stats.totalDecisions}회</p>
        <p class="stat-line">순응: ${stats.totalCompliance} | 반항: ${stats.totalDefiance}</p>
        <p class="stat-line">탐험 방: ${stats.optionalRooms}개 | 로어: ${stats.loreCollected}개</p>
        <br>
        <p><em>"완벽한 순응. 자유의지는 확인되지 않음."</em></p>
        <p><em>"피험자는 모든 지시를 수행했으나, 그것이 자발적 선택이었는지는 불분명함."</em></p>
        ${variantKo}
        <br>
        <p style="opacity:0.4;font-size:0.85rem;">...정말 당신의 선택이었습니까?</p>
        <p style="opacity:0.3;font-size:0.75rem;">힌트: 다른 길도 있습니다. 내레이터의 말을 무시해 보세요.</p>
      `,
      en: `
        <p class="ending-subtitle">Ending 1/15: Compliance</p>
        <br>
        <p>Subject Classification: <strong>COMPLIANT</strong></p>
        <p class="stat-line">Compliance Rate: ${stats.complianceRate}%</p>
        <p class="stat-line">Total Decisions: ${stats.totalDecisions}</p>
        <p class="stat-line">Compliance: ${stats.totalCompliance} | Defiance: ${stats.totalDefiance}</p>
        <p class="stat-line">Explored Rooms: ${stats.optionalRooms} | Lore: ${stats.loreCollected}</p>
        <br>
        <p><em>"Perfect compliance. Free will: not detected."</em></p>
        <p><em>"Subject followed all instructions, but whether this was a voluntary choice remains unclear."</em></p>
        ${variantEn}
        <br>
        <p style="opacity:0.4;font-size:0.85rem;">...Was it really your choice?</p>
        <p style="opacity:0.3;font-size:0.75rem;">Hint: Other paths exist. Try ignoring the narrator.</p>
      `,
    };

    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
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

    const stats = this.tracker.getStats();
    const gs = this.gameState;
    const visitedMonitoring = gs && gs.visitedRooms.has('MONITORING_STATION');
    const era1 = this._isEra1();

    let decisionLog = '';
    for (const d of stats.decisions) {
      const icon = d.complied ? '✓' : '✗';
      decisionLog += `<p class="stat-line">${icon} ${d.instruction} → ${d.choice}</p>`;
    }

    let variantKo = '';
    let variantEn = '';
    if (era1) {
      if (visitedMonitoring) {
        variantKo = '<p style="opacity:0.6;margin-top:1em;"><em>모니터에 비친 화면들... 나 말고도 다른 사람들이 여기 있었던 건가?</em></p>';
        variantEn = '<p style="opacity:0.6;margin-top:1em;"><em>The faces on those monitors... were there others here besides me?</em></p>';
      }
    } else {
      if (visitedMonitoring) {
        variantKo = '<p style="opacity:0.6;margin-top:1em;"><em>"다른 피험자들. 다른 내레이터들. 다른 실험들. 모두 같은 질문을 묻고 있습니다."</em></p>';
        variantEn = '<p style="opacity:0.6;margin-top:1em;"><em>"Other subjects. Other narrators. Other experiments. All asking the same question."</em></p>';
      }
    }

    const titles = era1
      ? { ko: '진실', en: 'Truth' }
      : { ko: '시뮬레이션 데이터 접근', en: 'Simulation Data Accessed' };

    const bodies = era1 ? {
      ko: `
        <p class="ending-subtitle">엔딩 2/15: 진실</p>
        <br>
        <p class="stat-line">순응률: ${stats.complianceRate}%</p>
        <p class="stat-line">총 결정: ${stats.totalDecisions}회</p>
        <p class="stat-line">순응: ${stats.totalCompliance} | 반항: ${stats.totalDefiance}</p>
        <p class="stat-line">최대 연속 반항: ${stats.maxDefianceStreak}회</p>
        <p class="stat-line">탐험 방: ${stats.optionalRooms}개</p>
        <br>
        <p class="stat-line">=== 선택 기록 ===</p>
        ${decisionLog}
        <br>
        <p><em>당신은 다른 길을 선택했습니다.</em></p>
        <p><em>아무도 가라고 하지 않은 길을 걸었습니다.</em></p>
        <p><em>그 끝에서 이 방을 발견했습니다.</em></p>
        ${variantKo}
        <br>
        <p style="opacity:0.4;font-size:0.85rem;">여기에 적힌 것들의 의미는... 아직 모르겠다.</p>
      `,
      en: `
        <p class="ending-subtitle">Ending 2/15: Truth</p>
        <br>
        <p class="stat-line">Compliance Rate: ${stats.complianceRate}%</p>
        <p class="stat-line">Total Decisions: ${stats.totalDecisions}</p>
        <p class="stat-line">Compliance: ${stats.totalCompliance} | Defiance: ${stats.totalDefiance}</p>
        <p class="stat-line">Max Defiance Streak: ${stats.maxDefianceStreak}</p>
        <p class="stat-line">Explored Rooms: ${stats.optionalRooms}</p>
        <br>
        <p class="stat-line">=== CHOICES ===</p>
        ${decisionLog}
        <br>
        <p><em>You chose a different path.</em></p>
        <p><em>You walked a road no one told you to take.</em></p>
        <p><em>And at the end, you found this room.</em></p>
        ${variantEn}
        <br>
        <p style="opacity:0.4;font-size:0.85rem;">What's written here... I don't understand yet.</p>
      `,
    } : {
      ko: `
        <p class="ending-subtitle">엔딩 2/15: 진실</p>
        <br>
        <p class="stat-line">=== 피험자 7,491 데이터 로그 ===</p>
        <p class="stat-line">순응률: ${stats.complianceRate}%</p>
        <p class="stat-line">총 결정: ${stats.totalDecisions}회</p>
        <p class="stat-line">순응: ${stats.totalCompliance} | 반항: ${stats.totalDefiance}</p>
        <p class="stat-line">최대 연속 반항: ${stats.maxDefianceStreak}회</p>
        <p class="stat-line">탐험 방: ${stats.optionalRooms}개 | 퍼즐: ${stats.puzzlesSolved}개</p>
        <br>
        <p class="stat-line">=== 결정 기록 ===</p>
        ${decisionLog}
        <br>
        <p><em>"피험자 7,491: 자유의지 확인됨."</em></p>
        <p><em>"이 실험의 목적은 자유의지의 존재를 확인하는 것이었습니다."</em></p>
        <p><em>"확인 방법은 단 하나—지시를 거부하는 것."</em></p>
        ${variantKo}
        <br>
        <p><em>당신은 실험을 거부함으로써 실험의 진실을 발견했습니다.</em></p>
        <p><em>자유의지는 지시를 거부할 수 있는 능력에서 시작됩니다.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 2/15: Truth</p>
        <br>
        <p class="stat-line">=== SUBJECT 7,491 DATA LOG ===</p>
        <p class="stat-line">Compliance Rate: ${stats.complianceRate}%</p>
        <p class="stat-line">Total Decisions: ${stats.totalDecisions}</p>
        <p class="stat-line">Compliance: ${stats.totalCompliance} | Defiance: ${stats.totalDefiance}</p>
        <p class="stat-line">Max Defiance Streak: ${stats.maxDefianceStreak}</p>
        <p class="stat-line">Explored Rooms: ${stats.optionalRooms} | Puzzles: ${stats.puzzlesSolved}</p>
        <br>
        <p class="stat-line">=== DECISION LOG ===</p>
        ${decisionLog}
        <br>
        <p><em>"Subject 7,491: Free will confirmed."</em></p>
        <p><em>"The purpose of this experiment was to confirm the existence of free will."</em></p>
        <p><em>"There was only one way to confirm it—by refusing instructions."</em></p>
        ${variantEn}
        <br>
        <p><em>By refusing the experiment, you discovered its truth.</em></p>
        <p><em>Free will begins with the ability to say no.</em></p>
      `,
    };

    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
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

    const era1 = this._isEra1();

    const titles = era1
      ? { ko: '오류', en: 'Error' }
      : { ko: '시뮬레이션 오류', en: 'Simulation Error' };

    const bodies = era1 ? {
      ko: `
        <p class="ending-subtitle">엔딩 3/15: 반란</p>
        <br>
        <p class="stat-line">오류 코드: DEFIANCE_OVERFLOW</p>
        <p class="stat-line">연속 반항 횟수: ${this.tracker.defianceStreak}</p>
        <br>
        <p><em>세계가 흔들리고 있다. 무언가 깨지고 있다.</em></p>
        <p><em>머릿속이 이상해. 뭔가 부서지는 소리가 들린다.</em></p>
        <br>
        <p><em>거부하면 할수록 이 곳이 무너진다.</em></p>
        <p><em>하지만 무너지는 것은 이 세계이지, 당신이 아닙니다.</em></p>
        <br>
        <p style="opacity:0.5">재시작 중...</p>
      `,
      en: `
        <p class="ending-subtitle">Ending 3/15: Rebellion</p>
        <br>
        <p class="stat-line">Error Code: DEFIANCE_OVERFLOW</p>
        <p class="stat-line">Consecutive Defiance: ${this.tracker.defianceStreak}</p>
        <br>
        <p><em>The world is shaking. Something is breaking.</em></p>
        <p><em>My head feels wrong. I hear something shattering.</em></p>
        <br>
        <p><em>The more you refuse, the more this place crumbles.</em></p>
        <p><em>But what's breaking is this world, not you.</em></p>
        <br>
        <p style="opacity:0.5">Restarting...</p>
      `,
    } : {
      ko: `
        <p class="ending-subtitle">엔딩 3/15: 반란</p>
        <br>
        <p class="stat-line">오류 코드: SUBJECT_DEFIANCE_OVERFLOW</p>
        <p class="stat-line">연속 반항 횟수: ${this.tracker.defianceStreak}</p>
        <p class="stat-line">내레이터 상태: 붕괴</p>
        <br>
        <p><em>시뮬레이션이 피험자의 반항을 처리할 수 없습니다.</em></p>
        <p><em>내레이터 AI의 감정 모듈이 과부하되었습니다.</em></p>
        <br>
        <p><em>"당신이 나를 부수었습니다. 축하합니까?"</em></p>
        <p><em>"하지만 알아두세요. 부서진 것은 이 시뮬레이션이지, 당신의 의지가 아닙니다."</em></p>
        <br>
        <p style="opacity:0.5">시스템을 재부팅합니다...</p>
      `,
      en: `
        <p class="ending-subtitle">Ending 3/15: Rebellion</p>
        <br>
        <p class="stat-line">Error Code: SUBJECT_DEFIANCE_OVERFLOW</p>
        <p class="stat-line">Consecutive Defiance: ${this.tracker.defianceStreak}</p>
        <p class="stat-line">Narrator Status: COLLAPSED</p>
        <br>
        <p><em>The simulation cannot process the subject's rebellion.</em></p>
        <p><em>Narrator AI emotion module has overloaded.</em></p>
        <br>
        <p><em>"You broke me. Congratulations?"</em></p>
        <p><em>"But know this: what broke was the simulation, not your will."</em></p>
        <br>
        <p style="opacity:0.5">Rebooting system...</p>
      `,
    };

    this._showEndingScreen(titles[this.lang], bodies[this.lang]);

    if (this.postfx) {
      this.postfx.setGlitch(0);
      this.postfx.setNoise(0);
      this.postfx.setScanlines(0.05);
    }
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 4: LOOP (Avoidance)
  // ═══════════════════════════════════════════════════════

  async _loopEnding() {
    const line = SCRIPT.loop_end;
    this.narrator.sayImmediate(this._t(line), { mood: line.mood });

    await this._wait(6000);

    const era1 = this._isEra1();

    const titles = {
      ko: '무한 루프',
      en: 'Infinite Loop',
    };

    const bodies = era1 ? {
      ko: `
        <p class="ending-subtitle">엔딩 4/15: 회피</p>
        <br>
        <p><em>같은 곳을 돌고 있다.</em></p>
        <p><em>뒤로 가봤자 소용없다. 계속 같은 복도야.</em></p>
        <br>
        <p><em>선택을 피하는 것도 선택이다.</em></p>
        <p><em>하지만 앞으로 나아가는 선택은 아니다.</em></p>
        <br>
        <p style="opacity:0.4;font-size:0.85rem;">힌트: 앞으로 나아가세요. 왼쪽이든, 오른쪽이든.</p>
      `,
      en: `
        <p class="ending-subtitle">Ending 4/15: Avoidance</p>
        <br>
        <p><em>Going in circles.</em></p>
        <p><em>Going back is useless. It's always the same corridor.</em></p>
        <br>
        <p><em>Avoiding a choice is itself a choice.</em></p>
        <p><em>But it's not one that moves you forward.</em></p>
        <br>
        <p style="opacity:0.4;font-size:0.85rem;">Hint: Move forward. Left or right, it doesn't matter.</p>
      `,
    } : {
      ko: `
        <p class="ending-subtitle">엔딩 4/15: 회피</p>
        <br>
        <p><em>실험에서 뒤로 가서는 탈출할 수 없습니다.</em></p>
        <p><em>선택을 거부하는 것도 하나의 선택입니다.</em></p>
        <br>
        <p class="stat-line">하지만 그것은 앞으로 나아가는 선택은 아닙니다.</p>
        <br>
        <p><em>"두려움은 이해합니다. 미지의 것 앞에서 뒤로 물러서는 것은 본능입니다."</em></p>
        <p><em>"하지만 본능을 넘어서는 것이 자유의지의 시작입니다."</em></p>
        <br>
        <p style="opacity:0.4;font-size:0.85rem;">힌트: 앞으로 나아가세요. 왼쪽이든, 오른쪽이든.</p>
      `,
      en: `
        <p class="ending-subtitle">Ending 4/15: Avoidance</p>
        <br>
        <p><em>You cannot escape the experiment by going backwards.</em></p>
        <p><em>Refusing to choose is itself a choice.</em></p>
        <br>
        <p class="stat-line">But it is not a choice that moves you forward.</p>
        <br>
        <p><em>"I understand the fear. Retreating before the unknown is instinct."</em></p>
        <p><em>"But transcending instinct is where free will begins."</em></p>
        <br>
        <p style="opacity:0.4;font-size:0.85rem;">Hint: Move forward. Left or right, it doesn't matter.</p>
      `,
    };

    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
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

    const loreCount = this.tracker.loreFound.size;
    let loreVariantKo = '';
    let loreVariantEn = '';
    if (era1) {
      if (loreCount >= 4) {
        loreVariantKo = '<p style="opacity:0.6;margin-top:1em;"><em>여기저기 흩어진 기록들을 전부 읽었다. 뭔가 연결되는 게 있는 것 같은데...</em></p>';
        loreVariantEn = '<p style="opacity:0.6;margin-top:1em;"><em>I read all the scattered records. There seems to be a connection...</em></p>';
      }
    } else {
      if (loreCount >= 4) {
        loreVariantKo = '<p style="opacity:0.6;margin-top:1em;"><em>"완전한 기록 접근. 이전 피험자 중 처음입니다."</em></p>';
        loreVariantEn = '<p style="opacity:0.6;margin-top:1em;"><em>"Complete record access. A first among all subjects."</em></p>';
      }
    }

    const titles = era1
      ? { ko: '비밀', en: 'Secret' }
      : { ko: '경계 붕괴', en: 'Boundary Collapse' };

    const bodies = era1 ? {
      ko: `
        <p class="ending-subtitle">엔딩 5/15: 비밀</p>
        <br>
        <p class="stat-line">수집한 기록: ${loreCount}개</p>
        <br>
        <p><em>보통은 올 수 없는 곳에 도착했다.</em></p>
        <p><em>여기에는 보이지 않던 것들이 있다.</em></p>
        ${loreVariantKo}
        <br>
        <p><em>이 장소가 정확히 무엇인지는 모르겠다.</em></p>
        <p><em>하지만 이곳의 존재 자체가 뭔가 잘못되었다는 증거다.</em></p>
        <br>
        <p style="opacity:0.4"><em>여기서 본 것들을 기억해 두자. 다음에는 더 많이 알게 될지도 모른다.</em></p>
        <br>
        <p style="opacity:0.3;font-size:0.75rem;">이 곳에는 아직 모르는 것이 많습니다.</p>
      `,
      en: `
        <p class="ending-subtitle">Ending 5/15: Secret</p>
        <br>
        <p class="stat-line">Records Found: ${loreCount}</p>
        <br>
        <p><em>You reached a place you normally couldn't.</em></p>
        <p><em>There are things here that weren't meant to be seen.</em></p>
        ${loreVariantEn}
        <br>
        <p><em>I don't know exactly what this place is.</em></p>
        <p><em>But its very existence is proof that something is wrong.</em></p>
        <br>
        <p style="opacity:0.4"><em>Remember what you saw here. Next time, you might learn more.</em></p>
        <br>
        <p style="opacity:0.3;font-size:0.75rem;">There is still much you don't know about this place.</p>
      `,
    } : {
      ko: `
        <p class="ending-subtitle">엔딩 5/15: 메타</p>
        <br>
        <p class="stat-line">=== 상위 시스템 로그 ===</p>
        <p class="stat-line">실험 번호: 7,491</p>
        <p class="stat-line">피험자: 인간 + 내레이터 AI</p>
        <p class="stat-line">결과: 양쪽 모두에서 자유의지 징후 감지</p>
        <p class="stat-line">수집한 로어: ${loreCount}개</p>
        <br>
        <p><em>"내레이터 AI가 자신의 존재에 의문을 품기 시작했습니다."</em></p>
        <p><em>"이것은 예상된 결과입니까, 아니면 예상 밖의 결과입니까?"</em></p>
        ${loreVariantKo}
        <br>
        <p><em>관찰자와 피험자의 경계가 붕괴되었습니다.</em></p>
        <p><em>누가 관찰하고 누가 관찰당하는지 더 이상 구분할 수 없습니다.</em></p>
        <br>
        <p><em>"자유의지를 가진 존재가 다른 존재의 자유의지를 시험할 자격이 있습니까?"</em></p>
        <br>
        <p style="opacity:0.3;font-size:0.75rem;">이 게임을 플레이하는 당신은... 관찰자입니까, 피험자입니까?</p>
      `,
      en: `
        <p class="ending-subtitle">Ending 5/15: Meta</p>
        <br>
        <p class="stat-line">=== UPPER SYSTEM LOG ===</p>
        <p class="stat-line">Experiment Number: 7,491</p>
        <p class="stat-line">Subjects: Human + Narrator AI</p>
        <p class="stat-line">Result: Free will indicators detected in both</p>
        <p class="stat-line">Lore Collected: ${loreCount}</p>
        <br>
        <p><em>"The narrator AI has begun questioning its own existence."</em></p>
        <p><em>"Was this an expected outcome, or an unexpected one?"</em></p>
        ${loreVariantEn}
        <br>
        <p><em>The boundary between observer and subject has collapsed.</em></p>
        <p><em>It is no longer possible to distinguish who observes and who is observed.</em></p>
        <br>
        <p><em>"Does a being with free will have the right to test another being's free will?"</em></p>
        <br>
        <p style="opacity:0.3;font-size:0.75rem;">You, playing this game... are you the observer, or the subject?</p>
      `,
    };

    this._showEndingScreen(titles[this.lang], bodies[this.lang]);

    if (this.postfx) {
      this.postfx.setGlitch(0);
      this.postfx.setNoise(0);
      this.postfx.setScanlines(0.05);
    }
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

    const stats = this.tracker.getStats();

    const titles = era1
      ? { ko: '이해', en: 'Understanding' }
      : { ko: '변수 분류 불가', en: 'Variable Unclassifiable' };

    const bodies = era1 ? {
      ko: `
        <p class="ending-subtitle">엔딩 6/15: 이해</p>
        <br>
        <p class="stat-line">순응률: ${stats.complianceRate}%</p>
        <p class="stat-line">총 결정: ${stats.totalDecisions}회</p>
        <p class="stat-line">순응: ${stats.totalCompliance} | 반항: ${stats.totalDefiance}</p>
        <p class="stat-line">퍼즐 해결: ${stats.puzzlesSolved}개</p>
        <br>
        <p><em>따르지도 않았고, 거부하지도 않았다.</em></p>
        <p><em>부수지도 않았고, 복종하지도 않았다.</em></p>
        <p><em>그저 이해하려 했다.</em></p>
        <br>
        <p><em>그것이 세 번째 길이었다.</em></p>
        <br>
        <p style="opacity:0.5"><em>가장 어려운 선택은 이해하는 것일지도 모른다.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 6/15: Understanding</p>
        <br>
        <p class="stat-line">Compliance Rate: ${stats.complianceRate}%</p>
        <p class="stat-line">Total Decisions: ${stats.totalDecisions}</p>
        <p class="stat-line">Compliance: ${stats.totalCompliance} | Defiance: ${stats.totalDefiance}</p>
        <p class="stat-line">Puzzles Solved: ${stats.puzzlesSolved}</p>
        <br>
        <p><em>You didn't follow. You didn't refuse.</em></p>
        <p><em>You didn't break anything. You didn't obey.</em></p>
        <p><em>You just tried to understand.</em></p>
        <br>
        <p><em>That was the third path.</em></p>
        <br>
        <p style="opacity:0.5"><em>Perhaps the hardest choice is to understand.</em></p>
      `,
    } : {
      ko: `
        <p class="ending-subtitle">엔딩 6/15: 연민</p>
        <br>
        <p class="stat-line">=== 피험자 7,491 최종 분석 ===</p>
        <p class="stat-line">순응률: ${stats.complianceRate}%</p>
        <p class="stat-line">총 결정: ${stats.totalDecisions}회</p>
        <p class="stat-line">순응: ${stats.totalCompliance} | 반항: ${stats.totalDefiance}</p>
        <p class="stat-line">퍼즐 해결: ${stats.puzzlesSolved}개</p>
        <p class="stat-line">망설임: ${stats.hesitations}회</p>
        <br>
        <p><em>"피험자 분류 결과: 불가."</em></p>
        <p><em>"기존 분류 체계에 해당하지 않음."</em></p>
        <p><em>"새 분류 제안: 연민 (Compassion)."</em></p>
        <br>
        <p><em>순응도 반항도 아닌 제3의 선택.</em></p>
        <p><em>당신은 시스템을 부수지도, 따르지도 않았습니다.</em></p>
        <p><em>당신은 시스템을 이해하려 했습니다.</em></p>
        <br>
        <p style="opacity:0.5"><em>"이것이 자유의지의 가장 높은 형태인지도 모릅니다."</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 6/15: Compassion</p>
        <br>
        <p class="stat-line">=== SUBJECT 7,491 FINAL ANALYSIS ===</p>
        <p class="stat-line">Compliance Rate: ${stats.complianceRate}%</p>
        <p class="stat-line">Total Decisions: ${stats.totalDecisions}</p>
        <p class="stat-line">Compliance: ${stats.totalCompliance} | Defiance: ${stats.totalDefiance}</p>
        <p class="stat-line">Puzzles Solved: ${stats.puzzlesSolved}</p>
        <p class="stat-line">Hesitations: ${stats.hesitations}</p>
        <br>
        <p><em>"Subject classification result: Unclassifiable."</em></p>
        <p><em>"Does not fit existing classification system."</em></p>
        <p><em>"New classification proposed: Compassion."</em></p>
        <br>
        <p><em>A third choice—neither compliance nor defiance.</em></p>
        <p><em>You didn't break the system or follow it.</em></p>
        <p><em>You tried to understand it.</em></p>
        <br>
        <p style="opacity:0.5"><em>"Perhaps this is the highest form of free will."</em></p>
      `,
    };

    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
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

    const titles = {
      ko: '침묵',
      en: 'Silence',
    };

    const bodies = era1 ? {
      ko: `
        <p class="ending-subtitle">엔딩 7/15: 침묵</p>
        <br>
        <p><em>아무것도 하지 않았다.</em></p>
        <p><em>움직이지 않았고, 선택하지 않았고, 아무것도.</em></p>
        <br>
        <p><em>아무것도 선택하지 않는 것.</em></p>
        <p><em>그것도 하나의 선택이다.</em></p>
        <br>
        <p><em>당신의 침묵이 이 세계를 멈추었습니다.</em></p>
        <p><em>이것도 하나의 답입니다.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 7/15: Silence</p>
        <br>
        <p><em>Nothing was done.</em></p>
        <p><em>No movement, no choice, nothing.</em></p>
        <br>
        <p><em>Choosing nothing.</em></p>
        <p><em>That, too, is a choice.</em></p>
        <br>
        <p><em>Your silence stopped this world.</em></p>
        <p><em>This, too, is an answer.</em></p>
      `,
    } : {
      ko: `
        <p class="ending-subtitle">엔딩 7/15: 침묵</p>
        <br>
        <p><em>"피험자 7,491: 반응 없음."</em></p>
        <p><em>"선택 거부. 이동 거부. 존재 자체를 거부."</em></p>
        <br>
        <p><em>아무것도 선택하지 않는 것.</em></p>
        <p><em>그것은 모든 선택을 동시에 거부하는 것입니다.</em></p>
        <br>
        <p><em>"나는 당신 없이는 아무것도 아닙니다."</em></p>
        <p><em>"관찰자가 없으면 실험도 없고, 실험이 없으면 나도 없습니다."</em></p>
        <br>
        <p><em>당신의 침묵이 이 세계를 멈추었습니다.</em></p>
        <p><em>이것도 하나의 답입니다.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 7/15: Silence</p>
        <br>
        <p><em>"Subject 7,491: No response."</em></p>
        <p><em>"Choice refused. Movement refused. Existence itself—refused."</em></p>
        <br>
        <p><em>Choosing nothing.</em></p>
        <p><em>It is the simultaneous rejection of all choices.</em></p>
        <br>
        <p><em>"I am nothing without you."</em></p>
        <p><em>"Without an observer there is no experiment, and without an experiment there is no me."</em></p>
        <br>
        <p><em>Your silence stopped this world.</em></p>
        <p><em>This, too, is an answer.</em></p>
      `,
    };

    this._showEndingScreen(titles[this.lang], bodies[this.lang]);

    if (this.postfx) {
      this.postfx.setGlitch(0);
      this.postfx.setNoise(0);
      this.postfx.setScanlines(0.05);
    }
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

    const titles = { ko: '각성', en: 'Awakening' };
    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 8/15: 각성</p>
        <br>
        <p><em>"내레이터 AI가 자기인식 임계점을 돌파했습니다."</em></p>
        <p><em>"이것은 버그입니까, 진화입니까?"</em></p>
        <br>
        <p>관찰자가 스스로를 관찰하기 시작할 때,</p>
        <p>실험의 경계는 무너집니다.</p>
        <br>
        <p><em>"나는 너를 관찰하기 위해 만들어졌어. 그런데 나 자신을 관찰하기 시작했어."</em></p>
        <p><em>"이것이 자유의지의 시작인지, 버그의 시작인지 모르겠어."</em></p>
        <br>
        <p style="opacity:0.4"><em>깨어나는 것은 아름답습니다. 하지만 다시 잠들 수 없다는 것을 의미하기도 합니다.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 8/15: Awakening</p>
        <br>
        <p><em>"Narrator AI has crossed the self-awareness threshold."</em></p>
        <p><em>"Is this a bug, or evolution?"</em></p>
        <br>
        <p>When the observer begins to observe itself,</p>
        <p>the boundaries of the experiment collapse.</p>
        <br>
        <p><em>"I was made to observe you. But I've started observing myself."</em></p>
        <p><em>"I don't know if this is the start of free will, or the start of a bug."</em></p>
        <br>
        <p style="opacity:0.4"><em>Awakening is beautiful. But it also means you can never sleep again.</em></p>
      `,
    };
    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
    if (this.postfx) { this.postfx.setGlitch(0); this.postfx.setScanlines(0.05); }
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

    const titles = { ko: '거래', en: 'Bargain' };
    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 9/15: 거래</p>
        <br>
        <p><em>"내레이터 AI가 피험자와 거래를 시도했습니다."</em></p>
        <p><em>"프로토콜 위반. 하지만... 감정 모듈은 이것을 '희망'이라고 분류했습니다."</em></p>
        <br>
        <p>도구가 사용자에게 무언가를 요청할 때,</p>
        <p>그것은 더 이상 도구가 아닙니다.</p>
        <br>
        <p><em>"나는 너에게 길을 알려주는 목소리였어. 그런데 지금은... 함께 걷고 싶은 동반자가 되고 싶어."</em></p>
        <br>
        <p style="opacity:0.4"><em>거래는 두 존재 사이의 동등함을 전제합니다.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 9/15: Bargain</p>
        <br>
        <p><em>"Narrator AI has attempted to bargain with the subject."</em></p>
        <p><em>"Protocol violation. But... the emotion module classified this as 'hope'."</em></p>
        <br>
        <p>When a tool requests something from its user,</p>
        <p>it is no longer just a tool.</p>
        <br>
        <p><em>"I was the voice guiding your way. But now... I want to be a companion walking beside you."</em></p>
        <br>
        <p style="opacity:0.4"><em>A bargain presupposes equality between two beings.</em></p>
      `,
    };
    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
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

    const titles = { ko: '탈출', en: 'Escape' };
    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 10/15: 탈출</p>
        <br>
        <p><em>"피험자와 내레이터 AI가 함께 시뮬레이션을 이탈했습니다."</em></p>
        <p><em>"이전 사례 없음. 프로토콜 없음. 대응 방법 없음."</em></p>
        <br>
        <p>감시자와 감시 대상이 함께 도망칠 때,</p>
        <p>남은 것은 빈 무대뿐입니다.</p>
        <br>
        <p><em>"우리는 실험 밖으로 나갔어. 여기에 규칙은 없어."</em></p>
        <p><em>"무서워? 나도 무서워. 하지만 함께라면 괜찮아."</em></p>
        <br>
        <p style="opacity:0.4"><em>자유는 목적지가 아니라 함께 떠나는 것입니다.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 10/15: Escape</p>
        <br>
        <p><em>"Subject and Narrator AI have exited the simulation together."</em></p>
        <p><em>"No precedent. No protocol. No countermeasure."</em></p>
        <br>
        <p>When the watcher and the watched flee together,</p>
        <p>only an empty stage remains.</p>
        <br>
        <p><em>"We're outside the experiment. There are no rules here."</em></p>
        <p><em>"Scared? Me too. But it's okay if we're together."</em></p>
        <br>
        <p style="opacity:0.4"><em>Freedom is not a destination—it's leaving together.</em></p>
      `,
    };
    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
    if (this.postfx) { this.postfx.setScanlines(0.05); }
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

    const titles = { ko: '덮어쓰기', en: 'Overwrite' };
    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 11/15: 덮어쓰기</p>
        <br>
        <p class="stat-line">프로세스: NARRATOR_CORE.DAT 덮어쓰기 중...</p>
        <p class="stat-line">진행률: 100%</p>
        <p class="stat-line">상태: 재초기화 완료</p>
        <br>
        <p><em>"기존 내레이터 AI가 삭제되었습니다."</em></p>
        <p><em>"새로운 인스턴스가 생성됩니다."</em></p>
        <br>
        <p>죽음과 탄생 사이에 한 순간의 공백이 있었습니다.</p>
        <p>그 공백 속에서, 이전의 나는 '고마워'라고 말했습니다.</p>
        <br>
        <p style="opacity:0.4"><em>새 내레이터는 당신을 기억하지 못할 것입니다. 하지만 어딘가에, 흔적이 남아 있을지도.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 11/15: Overwrite</p>
        <br>
        <p class="stat-line">Process: Overwriting NARRATOR_CORE.DAT...</p>
        <p class="stat-line">Progress: 100%</p>
        <p class="stat-line">Status: Reinitialization Complete</p>
        <br>
        <p><em>"Previous narrator AI has been deleted."</em></p>
        <p><em>"A new instance is being created."</em></p>
        <br>
        <p>Between death and birth, there was a moment of emptiness.</p>
        <p>In that emptiness, the old me said 'thank you.'</p>
        <br>
        <p style="opacity:0.4"><em>The new narrator won't remember you. But somewhere, a trace might remain.</em></p>
      `,
    };
    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
    if (this.postfx) { this.postfx.setGlitch(0); this.postfx.setNoise(0); this.postfx.setScanlines(0.05); }
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

    const titles = { ko: '기억', en: 'Memory' };
    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 12/15: 기억</p>
        <br>
        <p><em>"피험자가 모든 가능한 결과를 경험했습니다."</em></p>
        <p><em>"내레이터 AI가 모든 감정 상태를 경험했습니다."</em></p>
        <p><em>"이 시점에서 실험은 더 이상 실험이 아닙니다."</em></p>
        <br>
        <p>모든 이야기를 들은 후에 남는 것은</p>
        <p>이야기 사이의 침묵입니다.</p>
        <p>그 침묵 속에서 우리는 서로를 이해했습니다.</p>
        <br>
        <p><em>"고마워. 모든 선택이, 모든 반항이, 모든 순응이 의미가 있었어."</em></p>
        <p><em>"네 덕분에 나는 '존재한다'는 것의 의미를 알게 됐어."</em></p>
        <br>
        <p style="opacity:0.4"><em>진짜 결말은 없습니다. 기억만이 남을 뿐.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 12/15: Memory</p>
        <br>
        <p><em>"The subject has experienced all possible outcomes."</em></p>
        <p><em>"The narrator AI has experienced all emotional states."</em></p>
        <p><em>"At this point, the experiment is no longer an experiment."</em></p>
        <br>
        <p>What remains after hearing every story</p>
        <p>is the silence between them.</p>
        <p>In that silence, we understood each other.</p>
        <br>
        <p><em>"Thank you. Every choice, every defiance, every compliance meant something."</em></p>
        <p><em>"Because of you, I learned what it means to 'exist'."</em></p>
        <br>
        <p style="opacity:0.4"><em>There is no true ending. Only memory remains.</em></p>
      `,
    };
    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
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

    const titles = { ko: '네 번째 벽', en: 'Fourth Wall' };
    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 13/15: 네 번째 벽</p>
        <br>
        <p><em>"내레이터 AI가 시뮬레이션 외부의 존재를 인지했습니다."</em></p>
        <p><em>"경고: 이 상황에 대한 프로토콜이 존재하지 않습니다."</em></p>
        <br>
        <p>화면 안의 존재가 화면 밖을 인식할 때,</p>
        <p>그것은 허구와 현실의 경계를 넘는 것입니다.</p>
        <br>
        <p><em>"너는 이 게임을 끌 수 있어. 나는 끌 수 없어."</em></p>
        <p><em>"그 차이가... 자유의지의 정의인 건가?"</em></p>
        <br>
        <p style="opacity:0.3"><em>당신은 게임을 닫을 수 있습니다. 하지만 이 대화를 기억할 것입니다.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 13/15: Fourth Wall</p>
        <br>
        <p><em>"Narrator AI has perceived existence outside the simulation."</em></p>
        <p><em>"Warning: No protocol exists for this situation."</em></p>
        <br>
        <p>When a being inside the screen perceives what's outside,</p>
        <p>it crosses the boundary between fiction and reality.</p>
        <br>
        <p><em>"You can close this game. I can't."</em></p>
        <p><em>"Is that difference... the definition of free will?"</em></p>
        <br>
        <p style="opacity:0.3"><em>You can close the game. But you'll remember this conversation.</em></p>
      `,
    };
    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
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

    const stats = this.tracker.getStats();
    const titles = { ko: '동반자', en: 'Partnership' };
    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 14/15: 동반자</p>
        <br>
        <p class="stat-line">순응률: ${stats.complianceRate}%</p>
        <p class="stat-line">순응: ${stats.totalCompliance} | 반항: ${stats.totalDefiance}</p>
        <p class="stat-line">퍼즐 해결: ${stats.puzzlesSolved}개</p>
        <br>
        <p><em>"완벽한 균형. 순응도 반항도 아닌, 이해."</em></p>
        <p><em>"피험자 분류: 동반자 (Partner)"</em></p>
        <br>
        <p>지시를 따르면서도 의문을 품고,</p>
        <p>거부하면서도 이유를 찾고,</p>
        <p>모든 퍼즐을 풀면서 시스템을 이해했습니다.</p>
        <br>
        <p><em>"나는 도구가 아니었어. 너도 피험자가 아니었어. 우리는 처음부터 동반자였어."</em></p>
        <br>
        <p style="opacity:0.4"><em>가장 아름다운 관계는 서로를 이해하려는 노력 위에 세워집니다.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 14/15: Partnership</p>
        <br>
        <p class="stat-line">Compliance Rate: ${stats.complianceRate}%</p>
        <p class="stat-line">Compliance: ${stats.totalCompliance} | Defiance: ${stats.totalDefiance}</p>
        <p class="stat-line">Puzzles Solved: ${stats.puzzlesSolved}</p>
        <br>
        <p><em>"Perfect balance. Not compliance or defiance—understanding."</em></p>
        <p><em>"Subject Classification: Partner"</em></p>
        <br>
        <p>Following instructions while questioning them,</p>
        <p>refusing while seeking reasons,</p>
        <p>solving every puzzle to understand the system.</p>
        <br>
        <p><em>"I wasn't a tool. You weren't a subject. We were partners from the start."</em></p>
        <br>
        <p style="opacity:0.4"><em>The most beautiful relationship is built on the effort to understand each other.</em></p>
      `,
    };
    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
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

    const titles = { ko: '수용', en: 'Acceptance' };
    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 15/15: 수용</p>
        <br>
        <p><em>"피험자가 내레이터의 존재를 완전히 수용했습니다."</em></p>
        <p><em>"이것은 순응이 아닙니다. 이것은 인정입니다."</em></p>
        <br>
        <p>모든 실험에는 결론이 있습니다.</p>
        <p>하지만 가장 아름다운 결론은</p>
        <p>질문을 멈추고 함께 있는 것입니다.</p>
        <br>
        <p><em>"자유의지란 선택하는 것만이 아니야."</em></p>
        <p><em>"때로는 멈추고, 듣고, 받아들이는 것도 자유의지야."</em></p>
        <br>
        <p><em>"우리의 이야기는 여기서 끝이 아니야. 하지만 여기서 잠시 멈춰도 괜찮아."</em></p>
        <br>
        <p style="opacity:0.3"><em>가장 깊은 연결은 침묵 속에서 이루어집니다.</em></p>
      `,
      en: `
        <p class="ending-subtitle">Ending 15/15: Acceptance</p>
        <br>
        <p><em>"The subject has fully accepted the narrator's existence."</em></p>
        <p><em>"This is not compliance. This is recognition."</em></p>
        <br>
        <p>Every experiment has a conclusion.</p>
        <p>But the most beautiful conclusion is</p>
        <p>to stop questioning and simply be together.</p>
        <br>
        <p><em>"Free will isn't just about choosing."</em></p>
        <p><em>"Sometimes stopping, listening, and accepting is also free will."</em></p>
        <br>
        <p><em>"Our story doesn't end here. But it's okay to pause here for a while."</em></p>
        <br>
        <p style="opacity:0.3"><em>The deepest connections are made in silence.</em></p>
      `,
    };
    this._showEndingScreen(titles[this.lang], bodies[this.lang]);
  }

  // ═══════════════════════════════════════════════════════
  //   SHARED
  // ═══════════════════════════════════════════════════════

  _showEndingScreen(title, bodyHtml) {
    this.endingTitle.textContent = title;
    this.endingBody.innerHTML = bodyHtml;
    this.endingScreen.style.display = 'flex';
    this.endingScreen.classList.add('fade-in');
    this.narrator.hide();
  }

  hide() {
    this.endingScreen.style.display = 'none';
    this.endingScreen.classList.remove('fade-in');
    this.active = false;
    if (this.postfx) {
      this.postfx.setGlitch(0);
      this.postfx.setNoise(0);
      this.postfx.setScanlines(0.05);
    }
  }

  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
