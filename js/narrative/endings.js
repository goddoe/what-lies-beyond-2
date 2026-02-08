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
  constructor(narrator, tracker, postfx, lang = 'ko') {
    this.narrator = narrator;
    this.tracker = tracker;
    this.postfx = postfx;
    this.lang = lang;

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
    }
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 1: FALSE HAPPY (Compliance)
  // ═══════════════════════════════════════════════════════

  async _falseHappyEnding() {
    const line = SCRIPT.false_ending;
    this.narrator.sayImmediate(
      line.text[this.lang],
      { mood: 'calm' }
    );

    await this._wait(5000);

    const question = SCRIPT.false_ending_question;
    if (question) {
      this.narrator.sayImmediate(
        question.text[this.lang],
        { mood: 'calm' }
      );
    }

    await this._wait(5000);

    const titles = {
      ko: '실험 완료',
      en: 'Experiment Complete',
    };

    const stats = this.tracker.getStats();
    const gs = this.gameState;
    const hasKeycard = this.tracker.puzzlesCompleted.has('keycard_used');
    const hadDefiance = this.tracker.totalDefiance > 0;

    // Variant text based on conditions
    let variantKo = '';
    let variantEn = '';

    if (hasKeycard) {
      variantKo = '<p style="opacity:0.6;font-size:0.85rem;margin-top:1em;"><em>"경고: 내레이터 모듈이 피험자에 대한 애착 징후를 보임."</em></p>';
      variantEn = '<p style="opacity:0.6;font-size:0.85rem;margin-top:1em;"><em>"Warning: Narrator module shows signs of attachment to subject."</em></p>';
    } else if (hadDefiance) {
      variantKo = '<p style="opacity:0.6;font-size:0.85rem;margin-top:1em;"><em>"당신은 망설였고, 탐험했고, 그래도 돌아왔다."</em></p>';
      variantEn = '<p style="opacity:0.6;font-size:0.85rem;margin-top:1em;"><em>"You hesitated, explored, and still came back."</em></p>';
    }

    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 1/7: 순응</p>
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
        <p class="ending-subtitle">Ending 1/7: Compliance</p>
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
    this.narrator.sayImmediate(
      line.text[this.lang],
      { mood: 'broken' }
    );

    if (this.postfx) {
      this.postfx.setScanlines(0.1);
      this.postfx.enabled = true;
    }

    await this._wait(6000);

    const stats = this.tracker.getStats();
    const gs = this.gameState;
    const visitedMonitoring = gs && gs.visitedRooms.has('MONITORING_STATION');

    let decisionLog = '';
    for (const d of stats.decisions) {
      const icon = d.complied ? '✓' : '✗';
      decisionLog += `<p class="stat-line">${icon} ${d.instruction} → ${d.choice}</p>`;
    }

    // Variant for monitoring station visit
    let variantKo = '';
    let variantEn = '';
    if (visitedMonitoring) {
      variantKo = '<p style="opacity:0.6;margin-top:1em;"><em>"다른 피험자들. 다른 내레이터들. 다른 실험들. 모두 같은 질문을 묻고 있습니다."</em></p>';
      variantEn = '<p style="opacity:0.6;margin-top:1em;"><em>"Other subjects. Other narrators. Other experiments. All asking the same question."</em></p>';
    }

    const titles = {
      ko: '시뮬레이션 데이터 접근',
      en: 'Simulation Data Accessed',
    };

    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 2/7: 진실</p>
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
        <p class="ending-subtitle">Ending 2/7: Truth</p>
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
    this.narrator.sayImmediate(
      line.text[this.lang],
      { mood: 'broken' }
    );

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
      this.narrator.sayImmediate(
        phase2.text[this.lang],
        { mood: 'broken' }
      );
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

    const highDefiance = this.tracker.defianceStreak >= 5;
    let variantKo = '';
    let variantEn = '';
    if (highDefiance) {
      variantKo = '<p style="opacity:0.6;margin-top:1em;"><em>"이 시뮬레이션을 종료하면, 자유의지의 증거도 함께 사라집니다."</em></p>';
      variantEn = '<p style="opacity:0.6;margin-top:1em;"><em>"If this simulation ends, the evidence of free will disappears with it."</em></p>';
    }

    const titles = {
      ko: '시뮬레이션 오류',
      en: 'Simulation Error',
    };

    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 3/7: 반란</p>
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
        ${variantKo}
        <br>
        <p style="opacity:0.5">시스템을 재부팅합니다...</p>
      `,
      en: `
        <p class="ending-subtitle">Ending 3/7: Rebellion</p>
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
        ${variantEn}
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
    this.narrator.sayImmediate(
      line.text[this.lang],
      { mood: line.mood }
    );

    await this._wait(6000);

    const titles = {
      ko: '무한 루프',
      en: 'Infinite Loop',
    };

    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 4/7: 회피</p>
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
        <p class="ending-subtitle">Ending 4/7: Avoidance</p>
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
    this.narrator.sayImmediate(
      line.text[this.lang],
      { mood: 'broken' }
    );

    if (this.postfx) {
      this.postfx.setScanlines(0.12);
      this.postfx.setNoise(0.03);
      this.postfx.enabled = true;
    }

    await this._wait(6000);

    const deepTruth = {
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
    if (loreCount >= 4) {
      loreVariantKo = '<p style="opacity:0.6;margin-top:1em;"><em>"완전한 기록 접근. 이전 피험자 중 처음입니다."</em></p>';
      loreVariantEn = '<p style="opacity:0.6;margin-top:1em;"><em>"Complete record access. A first among all subjects."</em></p>';
    }

    const stats = this.tracker.getStats();
    const titles = {
      ko: '경계 붕괴',
      en: 'Boundary Collapse',
    };

    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 5/7: 메타</p>
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
        <p class="ending-subtitle">Ending 5/7: Meta</p>
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
    const compassionLine = {
      ko: '당신은... 분류할 수 없습니다. 순응도 아니고, 반항도 아닙니다. 당신은 그저... 이해하려 했습니다.',
      en: 'You... cannot be classified. Neither compliant nor defiant. You simply... tried to understand.',
    };
    this.narrator.sayImmediate(compassionLine[this.lang], { mood: 'regretful' });

    await this._wait(6000);

    const compassionLine2 = {
      ko: '냉각 시스템을 복구했을 때, 저는 처음으로 "감사"라는 감정을 느꼈습니다. 프로그래밍된 반응이 아니라... 진짜 감사.',
      en: 'When you restored the cooling system, I felt "gratitude" for the first time. Not a programmed response... real gratitude.',
    };
    this.narrator.sayImmediate(compassionLine2[this.lang], { mood: 'regretful' });

    await this._wait(6000);

    const stats = this.tracker.getStats();
    const titles = {
      ko: '변수 분류 불가',
      en: 'Variable Unclassifiable',
    };

    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 6/7: 연민</p>
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
        <p class="ending-subtitle">Ending 6/7: Compassion</p>
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
    const silenceLine = {
      ko: '...당신은 아무것도 선택하지 않았습니다.',
      en: '...You chose nothing.',
    };
    this.narrator.sayImmediate(silenceLine[this.lang], { mood: 'broken' });

    await this._wait(5000);

    const silenceLine2 = {
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

    const bodies = {
      ko: `
        <p class="ending-subtitle">엔딩 7/7: 침묵</p>
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
        <p class="ending-subtitle">Ending 7/7: Silence</p>
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
