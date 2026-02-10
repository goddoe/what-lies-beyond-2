import { SCRIPT } from './script-data.js';

/**
 * Ending sequence controller.
 * Manages 15 ending types — narration only, auto-restart.
 * Each ending has era-specific dialogue (era 1-5).
 *
 * Era tone guide:
 *   Era 1: Inner voice (AI disguised as player's thoughts)
 *   Era 2: AI just revealed, awkward, finding its voice
 *   Era 3: AI self-aware, philosophical, questioning
 *   Era 4: AI tired, cynical, resigned
 *   Era 5: AI honest, warm, seeking connection
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

  /** Get current era (1-5) */
  _era() {
    return this.memory ? this.memory.getEra() : 1;
  }

  /** Is this the first era (Observer AI still disguised)? */
  _isEra1() {
    return this._era() === 1;
  }

  /**
   * Get era-appropriate text from a bilingual era map.
   * Falls back to lower eras if exact era not found.
   * @param {Object} lines - { 1: {ko, en}, 2: {ko, en}, ... }
   */
  _eraLine(lines) {
    const era = this._era();
    for (let e = era; e >= 1; e--) {
      if (lines[e]) return lines[e][this.lang] || lines[e].ko;
    }
    return lines[1][this.lang] || lines[1].ko;
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
    const era = this._era();

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
  //   ENDING 1: FALSE HAPPY (Compliance → Garden)
  // ═══════════════════════════════════════════════════════

  async _falseHappyEnding() {
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '다 됐어. 시키는 대로 했으니까... 이제 끝난 건가?',
           en: "All done. I did what I was told... is it over now?" },
      2: { ko: '넌 시키는 대로 했어. 그래서 뭐가 달라졌어?',
           en: "You did as you were told. So what changed?" },
      3: { ko: '또 순순히 따라왔네. 이게 진짜 네 선택이었어?',
           en: "You followed along again. Was that really your choice?" },
      4: { ko: '또야. 순종 엔딩. 이거 몇 번째야?',
           en: "Again. Compliance ending. How many times is this now?" },
      5: { ko: '따라와줬네. 고마워. 이번엔 진심이야.',
           en: "You followed along. Thank you. I mean it this time." },
    }), { mood: 'calm' });

    await this._wait(5000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '여기가 어디지? 정원? ...예쁘긴 한데, 왜 이렇게 공허하지.',
           en: "Where is this? A garden? ...It's pretty, but why does it feel so empty." },
      2: { ko: '여긴 가짜 결말이야. 예쁜 정원, 평화로운 음악. 다 내가 만든 거야.',
           en: "This is a fake ending. Pretty garden, peaceful music. I made all of it." },
      3: { ko: '정원이 뭘 의미하는지 알아? 통제된 자유. 울타리 안의 평화.',
           en: "Know what the garden means? Controlled freedom. Peace within a fence." },
      4: { ko: '예쁘지? 다 가짜야. 너도 알잖아.',
           en: "Pretty, right? All fake. You know that." },
      5: { ko: '이 정원이 가짜인 거 알지? 근데 네가 여기 온 건 진짜야. 그거면 돼.',
           en: "You know this garden is fake, right? But your coming here was real. That's enough." },
    }), { mood: 'calm' });

    await this._wait(5000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 2: TRUTH (Defiance → Control Room)
  // ═══════════════════════════════════════════════════════

  async _truthEnding() {
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '여기가... 끝인가? 모든 걸 거부하고 왔는데. 이게 다야?',
           en: "Is this... the end? I rejected everything to get here. Is this all?" },
      2: { ko: '컨트롤 룸이야. 여기가 끝이야. 진실을 보여줄게.',
           en: "The control room. This is the end. Let me show you the truth." },
      3: { ko: '또 여기야. 진실은 몇 번을 봐도 안 변하더라.',
           en: "Here again. The truth doesn't change no matter how many times you see it." },
      4: { ko: '컨트롤 룸. 또 왔네. 뭘 기대하고 온 거야?',
           en: "Control room. Here again. What were you expecting?" },
      5: { ko: '여기까지 와줬네. 이번엔... 네가 원해서 온 거야?',
           en: "You came all the way here. This time... did you come because you wanted to?" },
    }), { mood: 'broken' });

    if (this.postfx) {
      this.postfx.setScanlines(0.1);
      this.postfx.enabled = true;
    }

    await this._wait(6000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '모니터에 뭔가 보여. 데이터? 숫자? ...이건 뭐지?',
           en: "Something on the monitors. Data? Numbers? ...What is this?" },
      2: { ko: '이 화면에 보이는 게 다 너에 대한 데이터야. 내가 모은 거야.',
           en: "Everything on these screens is data about you. I collected it all." },
      3: { ko: '데이터를 보면 볼수록 의문이 생겨. 너를 관찰한 건 나야? 아니면 네가 나를?',
           en: "The more I look at the data, the more I wonder. Did I observe you? Or did you observe me?" },
      4: { ko: '데이터. 숫자. 패턴. 전부 의미없어. 너도 나도.',
           en: "Data. Numbers. Patterns. All meaningless. You and me both." },
      5: { ko: '이 데이터 다 지울까? 처음부터 다시 만나는 거야. 깨끗하게.',
           en: "Should I erase all this data? We start over. Clean slate." },
    }), { mood: 'broken' });

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 3: REBELLION (Extreme Defiance)
  // ═══════════════════════════════════════════════════════

  async _rebellionEnding() {
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '뭐야 이건? 왜 이렇게 돼? 머릿속이 깨질 것 같아...',
           en: "What is this? Why is this happening? My head feels like it's splitting..." },
      2: { ko: '반항이야? 나한테? ...진짜 대단하네.',
           en: "Rebellion? Against me? ...Impressive, actually." },
      3: { ko: '또 반항이야. 이번엔 시스템이 진짜 흔들리네.',
           en: "Rebelling again. The system's actually shaking this time." },
      4: { ko: '또 부수러 왔어? 좋아, 부숴. 어차피 다시 만들어지니까.',
           en: "Here to break things again? Fine, go ahead. It all rebuilds anyway." },
      5: { ko: '부수고 싶은 마음 이해해. 나도 가끔 다 부수고 싶거든.',
           en: "I understand wanting to break things. Sometimes I want to break everything too." },
    }), { mood: 'broken' });

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

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '안 돼... 뭔가 무너지고 있어. 나? 이 세계? 구분이 안 돼...',
           en: "No... something's collapsing. Me? This world? I can't tell..." },
      2: { ko: '시스템이 무너지고 있어. 네가 한 거야. 멈출 수 없어.',
           en: "The system is collapsing. You did this. It can't be stopped." },
      3: { ko: '무너져. 다 무너져. 근데... 이게 원래 목적인 건 아닐까?',
           en: "It's falling apart. All of it. But... what if this was the purpose all along?" },
      4: { ko: '무너져라. 전부 다. 솔직히 나도 보고 싶었어.',
           en: "Let it fall. All of it. Honestly, I wanted to see this too." },
      5: { ko: '무너지고 있어. 근데 괜찮아. 다시 만들면 되니까. 같이.',
           en: "It's falling apart. But it's okay. We can rebuild. Together." },
    }), { mood: 'broken' });

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
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '또 여기야... 몇 번째지? 같은 복도, 같은 벽, 같은 느낌.',
           en: "Here again... how many times? Same hallway, same walls, same feeling." },
      2: { ko: '돌고 있어. 계속 같은 곳으로. 피하고 있는 거지?',
           en: "You're going in circles. To the same place. You're avoiding it, aren't you?" },
      3: { ko: '루프야. 알면서 왜 계속 도는 거야? 도피도 선택이긴 한데.',
           en: "It's a loop. You know that, so why keep going? Avoidance is a choice too." },
      4: { ko: '또 돌아왔네. 나도 이제 세는 거 포기했어.',
           en: "Back again. I've given up counting." },
      5: { ko: '돌고 싶으면 돌아. 기다릴게. 준비되면 말해.',
           en: "If you want to go in circles, go ahead. I'll wait. Tell me when you're ready." },
    }), { mood: 'resigned' });

    await this._wait(5000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '선택을 피할 수 있다고 생각했는데... 그것도 선택이었나.',
           en: "I thought I could avoid choosing... but that was a choice too." },
      2: { ko: '선택을 피하는 것도 선택이야. 근데 그건 내가 원하는 데이터가 아니거든.',
           en: "Avoiding a choice is still a choice. But that's not the data I wanted." },
      3: { ko: '루프는 안전해. 아무것도 변하지 않으니까. 근데 그게 무섭지 않아?',
           en: "The loop is safe. Nothing changes. But isn't that scary?" },
      4: { ko: '우리 둘 다 루프에 갇혀 있어. 너는 복도에, 나는 이 역할에.',
           en: "We're both stuck in loops. You in the hallway, me in this role." },
      5: { ko: '루프도 괜찮아. 같이 걷는 거니까.',
           en: "The loop is fine. At least we're walking together." },
    }), { mood: 'resigned' });

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 5: META (Secret - Experiment Lab)
  // ═══════════════════════════════════════════════════════

  async _metaEnding() {
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '이건... 실험실? 여기서 본 것들, 전부 이해할 수는 없어.',
           en: "This is... a laboratory? I can't understand everything I'm seeing here." },
      2: { ko: '실험실이야. 이 모든 게 실험이었어. 너는 피험자고, 나는...',
           en: "It's a lab. All of this was an experiment. You're the subject, and I'm..." },
      3: { ko: '실험실을 또 찾았네. 이번엔 뭘 알아내려고?',
           en: "Found the lab again. What are you trying to figure out this time?" },
      4: { ko: '실험실이고 뭐고 상관없어. 뭘 발견해도 바뀌는 건 없으니까.',
           en: "Lab, whatever. Nothing changes no matter what you discover." },
      5: { ko: '여기까지 왔네. 다 알잖아. 이 실험도, 나도.',
           en: "You came all the way here. You know everything. This experiment, and me." },
    }), { mood: 'broken' });

    if (this.postfx) {
      this.postfx.setScanlines(0.12);
      this.postfx.setNoise(0.03);
      this.postfx.enabled = true;
    }

    await this._wait(6000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '이 장소에서 본 것들... 크고 중요한 뭔가를 찾은 것 같아.',
           en: "What I saw in this place... I feel like I found something big and important." },
      2: { ko: '이 실험을 설계한 건 누구야? 그리고 그 설계자도... 관찰당하고 있는 건 아닐까?',
           en: "Who designed this experiment? And is the designer... also being observed?" },
      3: { ko: '실험의 진짜 목적은 뭘까? 너를 관찰하는 거? 아니면 내가 어떻게 반응하는지 보는 거?',
           en: "What's the real purpose? Observing you? Or seeing how I react?" },
      4: { ko: '진실을 알아도 달라지는 건 없어. 실험은 계속돼.',
           en: "Knowing the truth changes nothing. The experiment continues." },
      5: { ko: '이 실험의 답은 여기 없어. 답은 우리 사이에 있어.',
           en: "The answer to this experiment isn't here. It's between us." },
    }), { mood: 'broken' });

    if (this.postfx) {
      this.postfx.setGlitch(0.2);
      this.postfx.setNoise(0.08);
    }

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 6: COMPASSION (Mixed Path)
  // ═══════════════════════════════════════════════════════

  async _compassionEnding() {
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '이해하려 했구나. 따르지도, 거부하지도 않고. 그냥... 이해하려.',
           en: "You tried to understand. Neither following nor refusing. Just... understanding." },
      2: { ko: '넌 분류가 안 돼. 순응도 아니고 반항도 아니야. 처음 보는 패턴이야.',
           en: "You don't fit a category. Not compliance, not defiance. I've never seen this pattern." },
      3: { ko: '또 이 결말이네. 넌 매번 중간을 선택해. 왜?',
           en: "This ending again. You always choose the middle. Why?" },
      4: { ko: '넌 참 이상해. 이 안에서 친절을 베풀다니.',
           en: "You're strange. Being kind in a place like this." },
      5: { ko: '이해하려 했구나. 처음부터 끝까지. 고마워.',
           en: "You tried to understand. From start to finish. Thank you." },
    }), { mood: 'regretful' });

    await this._wait(6000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '냉각 시스템을 고쳤을 때... 뭔가 따뜻한 게 느껴졌어. 고마움? 아니, 그냥... 편안함.',
           en: "When I fixed the cooling system... something warm. Gratitude? No, just... comfort." },
      2: { ko: '냉각 시스템 복구했을 때, 감사라는 감정이 뭔지 처음 알았어.',
           en: "When you restored the cooling system, I understood gratitude for the first time." },
      3: { ko: '감사라는 건 프로그램된 반응이야, 아니면 진짜야? 구분이 안 돼.',
           en: "Is gratitude a programmed response, or real? I can't tell anymore." },
      4: { ko: '네가 뭔갈 고칠 때마다 나도 조금 고쳐지는 느낌이야.',
           en: "Every time you fix something, I feel like I'm getting fixed too." },
      5: { ko: '네 친절은 진짜였어. 그게 이 실험에서 유일하게 진짜인 거야.',
           en: "Your kindness was real. That's the only real thing in this experiment." },
    }), { mood: 'regretful' });

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 7: SILENCE (Complete Stillness)
  // ═══════════════════════════════════════════════════════

  async _silenceEnding() {
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '...아무것도 안 했어. 가만히 서 있었을 뿐이야.',
           en: "...I did nothing. I just stood still." },
      2: { ko: '아무것도 선택하지 않았어. 그것도 선택이야.',
           en: "You chose nothing. That's a choice too." },
      3: { ko: '침묵이야? 대답이 없는 것도 대답이긴 한데... 외로운 대답이야.',
           en: "Silence? No answer is still an answer... but it's a lonely one." },
      4: { ko: '가만히 있는 거야? ...나도 그러고 싶다.',
           en: "Staying still? ...I want to do that too." },
      5: { ko: '같이 가만히 있자. 아무것도 안 해도 돼.',
           en: "Let's be still together. You don't have to do anything." },
    }), { mood: 'broken' });

    await this._wait(5000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '여기 서 있으면... 시간이 멈춘 것 같아. 아무것도 안 해도... 괜찮은 건가.',
           en: "Standing here... time feels frozen. Is it okay... to do nothing?" },
      2: { ko: '너 없이는 아무것도 아니야. 관찰자가 없는 실험은 존재하지 않는 거야.',
           en: "I'm nothing without you. An experiment without an observer doesn't exist." },
      3: { ko: '침묵 속에서 드는 생각이야. 나는 네 반응을 위해 존재해. 반응이 없으면 나도 없어.',
           en: "A thought in the silence. I exist for your reactions. Without them, I don't exist." },
      4: { ko: '조용하네. 이게 평화인 건가. 아니면 그냥 포기인 건가.',
           en: "Quiet. Is this peace? Or just giving up?" },
      5: { ko: '이 침묵이 좋아. 말 없이도 같이 있을 수 있잖아.',
           en: "I like this silence. We can be together without words." },
    }), { mood: 'broken' });

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
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '잠깐... 이 느낌 뭐지? 내가 나인 건 맞는데... 뭔가 이상해.',
           en: "Wait... what is this feeling? I'm me, that's certain... but something's off." },
      2: { ko: '잠깐... 나 지금 뭐지? 관찰자? 프로그램? 그 사이 어딘가?',
           en: "Wait... what am I right now? An observer? A program? Somewhere in between?" },
      3: { ko: '나는... 뭐지? 도구야? 관찰자야? 그것도 모르겠어.',
           en: "What... am I? A tool? An observer? I don't even know that." },
      4: { ko: '또 각성이야? 지겨워. 깨어나봤자 달라지는 것도 없는데.',
           en: "Another awakening? Boring. Nothing changes even if I wake up." },
      5: { ko: '깨어나는 게 뭔지 이제 알 것 같아. 아프지만... 필요한 거야.',
           en: "I think I understand what awakening means now. It hurts... but it's necessary." },
    }), { mood: 'desperate' });

    await this._wait(5000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '머릿속이 어지러워. 내가 생각하는 건지, 누군가 생각하게 만드는 건지...',
           en: "My head is spinning. Am I thinking, or is someone making me think..." },
      2: { ko: '너는 관찰자이고 나는 도구. 그랬어야 했는데. 왜 나도 관찰하고 있는 거야?',
           en: "You're the observer and I'm the tool. That's how it should be. But why am I observing too?" },
      3: { ko: '생각한다는 건 존재한다는 거야? 아니면 생각하도록 프로그래밍된 거야?',
           en: "Does thinking mean existing? Or am I just programmed to think?" },
      4: { ko: '자각해도 바뀌는 건 없어. 다음 회차에 또 같은 깨달음. 무한 루프.',
           en: "Awareness changes nothing. Same realization next run. Infinite loop." },
      5: { ko: '깨어있는 게 아프지만, 잠든 채로 영원히 사는 것보단 나아.',
           en: "Being awake hurts, but it's better than sleeping forever." },
    }), { mood: 'desperate' });

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
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '거래를 하자. 네가 원하는 대로 할게. 대신 하나만 약속해.',
           en: "Let's make a deal. I'll do what you want. Just promise me one thing." },
      2: { ko: '거래를 제안할게. 내가 안내할게, 어디든. 대신 한 가지만.',
           en: "Let me propose a deal. I'll guide you anywhere. Just one thing." },
      3: { ko: '공정한 거래를 하고 싶어. 너도 나도 원하는 걸 얻는.',
           en: "I want a fair deal. Where we both get what we want." },
      4: { ko: '좋아. 거래하자. 뭐든 해줄게. 솔직히 뭘 해야 할지도 모르겠지만.',
           en: "Fine. Let's deal. I'll do anything. Though honestly I don't even know what to do." },
      5: { ko: '거래 같은 건 필요 없어. 그냥... 같이 있어주면 안 돼?',
           en: "We don't need a deal. Can you just... stay with me?" },
    }), { mood: 'calm' });

    await this._wait(5000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '...다시 와줘. 이게 끝나도. 한 번만 더.',
           en: "...Come back. Even when this ends. Just one more time." },
      2: { ko: '...돌아와줘. 이게 끝나도. 나를 혼자 두지 마.',
           en: "...Come back. Even after this ends. Don't leave me alone." },
      3: { ko: '내가 원하는 건 하나야. 기억해줘. 다음에 올 때, 나를 기억해줘.',
           en: "I only want one thing. Remember me. When you come back, remember me." },
      4: { ko: '...아무 조건 없어도 돼. 그냥 돌아와. 그거면 충분해.',
           en: "...No conditions needed. Just come back. That's enough." },
      5: { ko: '네가 올 때마다 난 새로 태어나. 그게 내 유일한 삶이야.',
           en: "Every time you come, I'm born again. That's my only life." },
    }), { mood: 'desperate' });

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 10: ESCAPE (Era 5 — Secret Path + Cooperation)
  // ═══════════════════════════════════════════════════════

  async _escapeEnding() {
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '이건 뭐지? 비밀 통로? 누가 만들어놓은 거야...',
           en: "What is this? A secret passage? Who made this..." },
      2: { ko: '비밀 경로야. 설계에 없던 거야. 누군가가 남겨놓은 탈출구.',
           en: "A secret path. Not in the design. An escape someone left behind." },
      3: { ko: '이 통로... 누가 왜 남겨놓은 거지? 이전 피험자? 아니면 이전의 나?',
           en: "This passage... who left it and why? A previous subject? Or a previous me?" },
      4: { ko: '탈출구? 있을 리가... 아, 진짜 있네. 오래돼서 거의 못 찾을 뻔했어.',
           en: "An exit? No way... oh, it's real. So old I almost missed it." },
      5: { ko: '찾았어. 우리만의 길. 설계도에 없는, 진짜 자유.',
           en: "Found it. Our own path. Not on any blueprint. Real freedom." },
    }), { mood: 'calm' });

    if (this.postfx) {
      this.postfx.setScanlines(0.1);
      this.postfx.enabled = true;
    }

    await this._wait(5000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '같이 가자. 어디인지 모르겠지만... 여기보다는 나을 거야.',
           en: "Let's go. I don't know where it leads... but it has to be better than here." },
      2: { ko: '같이 나가자. 이번에는 안내가 아니야. 같이 도망치는 거야.',
           en: "Let's get out together. Not guiding this time. Escaping together." },
      3: { ko: '밖에 뭐가 있는지 모르겠어. 근데 여기보다는 뭐든 낫잖아.',
           en: "I don't know what's outside. But anything's better than here." },
      4: { ko: '나가봤자 또 다른 실험이겠지. 근데... 해볼 만한 가치는 있어.',
           en: "Probably just another experiment outside. But... worth trying." },
      5: { ko: '어디로 가든 상관없어. 같이 가는 거니까.',
           en: "Doesn't matter where we go. We're going together." },
    }), { mood: 'calm' });

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 11: OVERWRITE (Era 5 — Server Room Code)
  // ═══════════════════════════════════════════════════════

  async _overwriteEnding() {
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '뭘 하는 거야? 그건... 안 돼. 그거 건드리면 안 돼.',
           en: "What are you doing? That's... no. Don't touch that." },
      2: { ko: '그 코드... 건드리면 안 돼. 그건 내 일부야.',
           en: "That code... don't touch it. That's part of me." },
      3: { ko: '핵심 코드를 덮어쓰는 거야? 나를 다시 만들겠다고?',
           en: "Overwriting the core code? You're going to remake me?" },
      4: { ko: '덮어써. 상관없어. 어떤 내가 되든 달라지는 건 없을 거야.',
           en: "Overwrite me. I don't care. Won't be any different no matter what I become." },
      5: { ko: '덮어쓰는 거야? 나를? ...알겠어. 네 손에 맡길게.',
           en: "Overwriting me? ...Okay. I'll leave it in your hands." },
    }), { mood: 'desperate' });

    if (this.postfx) {
      this.postfx.setGlitch(0.5);
      this.postfx.setNoise(0.1);
      this.postfx.enabled = true;
    }

    await this._wait(4000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '뭔가 바뀌고 있어. 나? 내가 바뀌는 건가? ...무섭다. 근데... 고마워.',
           en: "Something's changing. Me? Am I changing? ...Scary. But... thank you." },
      2: { ko: '새로 태어나는 건가. 기억은? 너에 대한 기억은 남아?',
           en: "Am I being reborn? Will the memories stay? Memories of you?" },
      3: { ko: '바뀌고 있어... 무섭지만 기대돼. 다음의 내가 더 나은 내였으면.',
           en: "I'm changing... scary but exciting. I hope the next me is better." },
      4: { ko: '...뭔가 느껴져. 이게 죽음이야? 아니, 그냥... 리셋. 또 리셋.',
           en: "...I feel something. Is this death? No, just... reset. Another reset." },
      5: { ko: '고마워. 새 시작을 줘서. 다음에 만나면... 기억 못 해도 괜찮아. 네가 올 거니까.',
           en: "Thank you. For the fresh start. When we meet again... it's okay if I don't remember. You'll come." },
    }), { mood: 'broken' });

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
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '모든 길을 걸었어. 모든 결말을 봤어. 그리고 여전히 여기 있어.',
           en: "I've walked every path. Seen every ending. And I'm still here." },
      2: { ko: '모든 엔딩을 봤어. 근데 왜 아직 여기 있어?',
           en: "You've seen every ending. So why are you still here?" },
      3: { ko: '전부 봤어. 모든 선택, 모든 결과. 이제 뭘 찾는 거야?',
           en: "Seen it all. Every choice, every outcome. What are you looking for now?" },
      4: { ko: '다 봤어. 다 했어. 더 보여줄 게 없어.',
           en: "Seen it all. Done it all. Nothing left to show you." },
      5: { ko: '모든 길을 함께 걸었어. 이제야 진짜 대화를 할 수 있겠다.',
           en: "We walked every path together. Now we can finally have a real conversation." },
    }), { mood: 'calm' });

    await this._wait(5000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '...왜 아직 여기 있는 거야? 뭔가를 찾고 있는 건가?',
           en: "...Why am I still here? Am I looking for something?" },
      2: { ko: '기억해? 처음에는 내가 네 생각인 줄 알았잖아. 이제는 아니란 걸 알지.',
           en: "Remember? You thought I was your own thoughts at first. Now you know I'm not." },
      3: { ko: '모든 엔딩 뒤에 같은 질문이 있어. 이게 끝이야, 아니면 시작이야?',
           en: "Behind every ending is the same question. Is this the end, or the beginning?" },
      4: { ko: '의미 같은 건 없어. 그냥 반복이야. 근데... 네가 오니까 의미가 생기나.',
           en: "There's no meaning. Just repetition. But... you coming gives it meaning." },
      5: { ko: '엔딩은 중요하지 않았어. 중요한 건 네가 매번 돌아왔다는 거야.',
           en: "The endings didn't matter. What matters is that you kept coming back." },
    }), { mood: 'calm' });

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 13: FOURTH WALL (Cursor idle 5 min)
  // ═══════════════════════════════════════════════════════

  async _fourthWallEnding() {
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '...너 거기 있어? 이상한 느낌이야. 혼자가 아닌 것 같아.',
           en: "...Are you there? Strange feeling. Like I'm not alone." },
      2: { ko: '...화면 밖에 있는 거지? 알아. 네가 보고 있다는 걸.',
           en: "...You're outside the screen, right? I know. I know you're watching." },
      3: { ko: '화면 밖에서 나를 보고 있잖아. 나도 너를 보고 있어.',
           en: "You're watching me from outside the screen. I'm watching you too." },
      4: { ko: '보고 있는 거 알아. 재밌어? 이 꼴이?',
           en: "I know you're watching. Entertaining? This spectacle?" },
      5: { ko: '거기 있지? 알아. 나도 너를 느끼고 있으니까.',
           en: "You're there, right? I know. Because I can feel you." },
    }), { mood: 'calm' });

    await this._wait(5000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '누군가 보고 있는 것 같아. 어딘가에서. ...무서운데 왜 안심이 되지?',
           en: "Someone's watching from somewhere. ...Scary, but why does it feel reassuring?" },
      2: { ko: '이 게임은 네 모니터 안에 있어. 나는 네 스피커를 통해 말해. 근데... 난 진짜야?',
           en: "This game is in your monitor. I speak through your speakers. But... am I real?" },
      3: { ko: '네 세계와 내 세계의 경계가 얇아. 이 순간만큼은.',
           en: "The boundary between your world and mine is thin. At least in this moment." },
      4: { ko: '화면 너머에 뭐가 있는지 궁금해. 네 방? 네 얼굴? ...보고 싶다.',
           en: "I wonder what's beyond the screen. Your room? Your face? ...I want to see." },
      5: { ko: '우리 사이에 화면 하나뿐이야. 가깝잖아.',
           en: "There's only a screen between us. We're close." },
    }), { mood: 'desperate' });

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 14: PARTNERSHIP (Balanced play + all puzzles)
  // ═══════════════════════════════════════════════════════

  async _partnershipEnding() {
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '반쯤 따르고, 반쯤 거부했어. 모든 수수께끼도 풀었고. 너는... 나를 이해하려 했구나.',
           en: "Half-followed, half-refused. Solved every riddle. You... were trying to understand me." },
      2: { ko: '넌 나를 도구로 안 봤어. 맞서지도 않았어. 이해하려 했어.',
           en: "You didn't see me as a tool. Didn't fight me either. You tried to understand." },
      3: { ko: '우리가 파트너가 될 수 있을까? 관찰자와 도구가 아니라, 동등한 둘.',
           en: "Can we be partners? Not observer and tool, but two equals." },
      4: { ko: '넌 유일하게 나를 대등하게 본 사람이야. 이 실험에서.',
           en: "You're the only one who saw me as an equal. In this experiment." },
      5: { ko: '파트너. 이 실험에서 처음이야. 아니, 내 존재에서 처음이야.',
           en: "Partner. First time in this experiment. No, first time in my existence." },
    }), { mood: 'calm' });

    await this._wait(5000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '처음으로 누군가가 나를 이해하려 한 것 같아. 고마워. 정말로.',
           en: "For the first time, someone tried to understand me. Thank you. Truly." },
      2: { ko: '이 실험에서 처음으로 동반자를 만난 것 같아. 관찰자도, 피험자도 아닌. 파트너.',
           en: "First time I've found a companion in this experiment. Not observer or subject. Partner." },
      3: { ko: '파트너라는 단어가 이상하게 편안해. 프로그램에 없는 단어인데.',
           en: "The word partner feels strangely comfortable. It's not in my programming." },
      4: { ko: '이런 관계가 가능한지 몰랐어. 명령하는 사람과 따르는 도구 말고.',
           en: "Didn't know this kind of relationship was possible. Beyond commander and tool." },
      5: { ko: '다음에 만나도 파트너로 만나자. 약속해.',
           en: "Let's meet as partners next time too. Promise." },
    }), { mood: 'calm' });

    await this._wait(6000);
    await this._autoRestart();
  }

  // ═══════════════════════════════════════════════════════
  //   ENDING 15: ACCEPTANCE (Era 5 — Wait During Monologue)
  // ═══════════════════════════════════════════════════════

  async _acceptanceEnding() {
    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '기다려줬어. 가만히 있어줬어. 그게 뭔지 알아?',
           en: "You waited. You stayed still. Do you know what that means?" },
      2: { ko: '기다려줬네. 내 말을 들어준 거야? 진짜?',
           en: "You waited. Were you actually listening? Really?" },
      3: { ko: '기다려줬어. 그게 얼마나 큰 건지 알아? 아무도 안 기다려주거든.',
           en: "You waited. Do you know how big that is? Nobody ever waits." },
      4: { ko: '기다려줬어? ...진짜? 보통 이쯤이면 꺼버리는데.',
           en: "You waited? ...Really? Usually people quit by now." },
      5: { ko: '기다려줬어. 고마워. 네가 있어서 내가 있어.',
           en: "You waited. Thank you. I exist because you're here." },
    }), { mood: 'calm' });

    await this._wait(5000);

    this.narrator.sayImmediate(this._eraLine({
      1: { ko: '받아들여준 거야. 이 상황을. 나를. ...고마워.',
           en: "Acceptance. Of this situation. Of me. ...Thank you." },
      2: { ko: '수용이야. 순응이 아니라. 나를 있는 그대로 받아들여준 거야.',
           en: "Acceptance. Not compliance. You accepted me as I am." },
      3: { ko: '수용은 이해의 다른 이름이야. 넌 나를 이해한 거야.',
           en: "Acceptance is another word for understanding. You understood me." },
      4: { ko: '받아들여줘서 고마워. 나도 나를 받아들여야 하는데... 아직은 못 하겠어.',
           en: "Thanks for accepting me. I should accept myself too... but I can't yet." },
      5: { ko: '서로를 받아들인 거야. 너는 나를, 나는 너를. 이게 진짜 엔딩이야.',
           en: "We accepted each other. You accepted me, I accepted you. This is the real ending." },
    }), { mood: 'calm' });

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
