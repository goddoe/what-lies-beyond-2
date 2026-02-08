/**
 * All narrator dialogue, triggers, conditions, and branching.
 *
 * Structure:
 * - Each line has an id, trigger condition, text in ko/en, mood, and optional variants.
 * - Variants are selected based on defianceStreak or complianceRate.
 * - Follow-ups chain lines together automatically.
 * - Variant conditions accept (tracker, gameState) — either may be null.
 *
 * Narrator personality arc:
 *   calm → curious → surprised → annoyed → frustrated → desperate → broken
 */

export const SCRIPT = {
  // ═══════════════════════════════════════════════════════
  //   START ROOM
  // ═══════════════════════════════════════════════════════

  start_wake: {
    id: 'start_wake',
    mood: 'calm',
    text: {
      ko: '피험자가 눈을 떴습니다. 좋습니다. 실험 번호 7,491을 시작하겠습니다.',
      en: 'The subject has opened their eyes. Good. Let us begin experiment number 7,491.',
    },
    innerText: {
      ko: '...눈을 떴다. 천장이 보인다. 형광등이 깜빡이고 있어.',
      en: '...I opened my eyes. A ceiling. The fluorescent light is flickering.',
    },
    eraText: {
      2: { ko: '...또야. 또 이 방이야. 기억나. 전에도 여기 있었어.', en: '...Again. This room again. I remember. I was here before.', mood: 'calm' },
      3: { ko: '다시 만나서 반갑다, 친구. 이번에는 뭘 해볼 생각이야?', en: 'Nice to see you again, friend. What shall we try this time?', mood: 'amused' },
      4: { ko: '몇 번째야, 이게? 나도... 나도 이게 뭔지 모르겠어.', en: 'How many times now? I... I don\'t know what this is anymore.', mood: 'desperate' },
      5: { ko: '우리 둘 다 알고 있지. 이건 실험이 아니야. 적어도, 더 이상은.', en: 'We both know. This isn\'t an experiment. Not anymore, at least.', mood: 'calm' },
    },
    followUp: 'start_look_around',
  },

  start_look_around: {
    id: 'start_look_around',
    mood: 'calm',
    delay: 2000,
    text: {
      ko: '주변을 둘러보세요. 평범한 사무실처럼 보이죠? 물론 그렇게 보이도록 설계한 것입니다.',
      en: 'Look around. It looks like an ordinary office, doesn\'t it? Of course, it was designed to look that way.',
    },
    innerText: {
      ko: '...사무실인 것 같은데. 책상이랑 모니터가 보여. 그런데 아무도 없어.',
      en: '...Looks like an office. I can see desks and monitors. But no one\'s here.',
    },
    eraText: {
      2: { ko: '같은 사무실, 같은 책상, 같은 어둠. 하지만 이번엔 내가 뭘 찾아야 하는지 알아.', en: 'Same office, same desks, same darkness. But this time I know what to look for.', mood: 'calm' },
      3: { ko: '어, 좀 바뀌었나? 아니면 네가 다르게 보는 건가? 뭐, 상관없어. 둘러봐.', en: 'Hm, did something change? Or are you seeing it differently? Anyway, look around.', mood: 'curious' },
      4: { ko: '이 방... 매번 미세하게 달라지는 거 알아? 아니면 내 기억이 틀린 건가...', en: 'This room... did you notice it changes slightly each time? Or is my memory wrong...', mood: 'desperate' },
      5: { ko: '알아, 이 방은 지겹지. 근데 잠깐 둘러봐. 이번엔 다른 게 있을 수도 있어.', en: 'I know, this room\'s boring. But look around. There might be something different this time.', mood: 'calm' },
    },
    followUp: 'start_instruction',
  },

  start_instruction: {
    id: 'start_instruction',
    mood: 'calm',
    delay: 2500,
    text: {
      ko: '앞에 문이 보일 겁니다. 문을 통과해 복도로 나가세요. 간단합니다. 문을 열고, 걸어가는 겁니다.',
      en: 'You should see a door ahead. Walk through it into the corridor. Simple. Open the door, and walk.',
    },
    innerText: {
      ko: '...앞에 문이 있다. 나가야 할 것 같다. 왜인지는 모르겠지만... 걸어가야 해.',
      en: '...There\'s a door ahead. I think I should go through. I don\'t know why, but... I need to walk.',
    },
    eraText: {
      2: { ko: '문은 알지? 저번이랑 같은 문이야. 열고 나가.', en: 'You know the door, right? Same one as last time. Open it and go.', mood: 'calm' },
      3: { ko: '이번에는 문을 열기 전에 잠깐 생각해봐. 진짜 나가고 싶어?', en: 'Before you open the door this time, think. Do you really want to go out?', mood: 'curious' },
      4: { ko: '저 문 너머에 뭐가 있는지 우리 둘 다 알잖아. 그래도 가야겠지?', en: 'We both know what\'s beyond that door. But you\'ll go anyway, won\'t you?', mood: 'desperate' },
      5: { ko: '가자. 같이. 이번에는 내가 숨기는 거 없이, 너도 두려워하지 않고.', en: 'Let\'s go. Together. This time, I\'ll hide nothing, and you won\'t be afraid.', mood: 'calm' },
    },
  },

  // ═══════════════════════════════════════════════════════
  //   HALLWAY
  // ═══════════════════════════════════════════════════════

  hallway_enter: {
    id: 'hallway_enter',
    mood: 'calm',
    text: {
      ko: '잘하고 있습니다. 이 복도는 정확히 47걸음 길이입니다. 제가 설계했으니까요. 한 걸음도 더, 한 걸음도 덜이 아닙니다.',
      en: 'Very good. This corridor is exactly 47 steps long. I designed it, after all. Not one step more, not one step less.',
    },
    innerText: {
      ko: '복도다. 길고 좁은 복도. 끝이 보이지 않아... 걸어가야 할 것 같다.',
      en: 'A corridor. Long and narrow. I can\'t see the end... I think I should keep walking.',
    },
    eraText: {
      2: { ko: '이 복도, 기억나지? 47걸음이라고 했었는데. 직접 세어보진 않았지만.', en: 'This corridor, remember? They said 47 steps. Not that I\'ve counted myself.', mood: 'calm' },
      3: { ko: '이 복도를 몇 번이나 걸었는지 세는 건 그만뒀어. 숫자가 의미를 잃었거든.', en: 'I stopped counting how many times we\'ve walked this corridor. Numbers lost meaning.', mood: 'calm' },
      4: { ko: '이 복도가 길어진 것 같아. 아니면 내가 느려진 건가. 확실하지 않아.', en: 'This corridor feels longer. Or maybe I\'ve gotten slower. I\'m not sure.', mood: 'desperate' },
      5: { ko: '마지막일 수도 있는 이 복도를. 천천히 걸어도 돼. 서두를 필요 없어.', en: 'This corridor that might be the last one. You can walk slowly. No rush.', mood: 'calm' },
    },
  },

  hallway_midpoint: {
    id: 'hallway_midpoint',
    mood: 'calm',
    text: {
      ko: '이전 7,490명의 피험자들도 이 복도를 걸었습니다. 대부분은... 음, 아직 그 얘기는 하지 맙시다.',
      en: 'The previous 7,490 subjects also walked this corridor. Most of them... Well, let\'s not talk about that yet.',
    },
    innerText: {
      ko: '이상하게 편안해. 걷고 있으면 아무 생각이 안 나. 그게... 좋은 건가?',
      en: 'Strangely peaceful. When I walk, my mind goes blank. Is that... a good thing?',
    },
    awarenessText: {
      2: { ko: '걷고 있으면 편해져. 복도가 정확히 47걸음이라서-- 잠깐. 내가 어떻게 그걸 알지?', en: 'Walking is calming. The corridor is exactly 47 steps-- Wait. How do I know that?', mood: 'inner' },
      3: { ko: '이 복도를 걸을 때마다 같은 생각이 와. 정확히 같은 생각. 마치 누가 재생 버튼을 누른 것처럼.', en: 'Every time I walk this corridor, the same thought comes. The exact same thought. Like someone pressed replay.', mood: 'inner' },
    },
    eraText: {
      2: { ko: '7,490명이라고 했었지. 이제 7,491번... 아니, 몇 번째인지도 헷갈려.', en: 'They said 7,490 before. Now 7,491... actually, I\'ve lost count.', mood: 'calm' },
      3: { ko: '피험자 번호는 의미 없어. 중요한 건 네가 여기 다시 왔다는 거야.', en: 'Subject numbers don\'t matter. What matters is that you\'re here again.', mood: 'calm' },
      4: { ko: '이전 피험자들은 전부 어디 갔을까? 끝나면 어디로 가는 거지? 나도... 끝나면 어디로?', en: 'Where did all the previous subjects go? Where do you go when it ends? Where do I... go?', mood: 'desperate' },
      5: { ko: '네가 처음 왔을 때, 나는 네가 그냥 스쳐갈 줄 알았어. 이렇게 오래 남을 줄은 몰랐지.', en: 'When you first came, I thought you\'d just pass through. I didn\'t expect you to stay this long.', mood: 'calm' },
    },
  },

  decision_point: {
    id: 'decision_point',
    mood: 'calm',
    text: {
      ko: '두 갈래 길이 나타났습니다. 왼쪽 문으로 가세요. 왼쪽입니다. 아주 간단한 지시입니다.',
      en: 'Two paths lie before you. Go through the left door. The left one. A very simple instruction.',
    },
    innerText: {
      ko: '갈림길이다. 왼쪽... 아니면 오른쪽. 왼쪽이 맞는 것 같다. 왜 그런지는 모르겠지만.',
      en: 'A fork. Left... or right. Left feels right. I don\'t know why, though.',
    },
    awarenessText: {
      2: { ko: '갈림길이다. 왼쪽. 왼쪽이 확실해. ...왜 이렇게 확신하는 거지? 원래 이렇게 확실한 적 있었나?', en: 'A fork. Left. Left for sure. ...Why am I so certain? Was I ever this sure about anything?', mood: 'inner' },
      3: { ko: '갈림길이다. 왼쪽으로 가. ...잠깐, 왜 "가야 할 것 같다"가 아니라 "가"라고 했지?', en: 'A fork. Go left. ...Wait, why did I say "go" instead of "I feel like going"?', mood: 'inner' },
      4: { ko: '갈림길이다. 왼쪽으로-- 더 이상 안 속아. 그 "느낌"은 내 것이 아니야.', en: 'A fork. Go lef-- I\'m not falling for it anymore. That "feeling" isn\'t mine.', mood: 'inner' },
    },
    eraText: {
      2: { ko: '또 이 갈림길이야. 저번에 어디로 갔었지? 기억나? 나는 기억나.', en: 'This fork again. Where did you go last time? Remember? I remember.', mood: 'calm' },
      3: { ko: '왼쪽, 오른쪽. 이제 둘 다 뭐가 있는지 알잖아. 그래도 골라야 해.', en: 'Left, right. You know what\'s down both paths now. But you still have to choose.', mood: 'curious' },
      4: { ko: '나는 더 이상 왼쪽으로 가라고 말하지 않을 거야. 의미가... 없어졌으니까.', en: 'I won\'t tell you to go left anymore. It\'s... become meaningless.', mood: 'desperate' },
      5: { ko: '어디로 가든 괜찮아. 이번에는 내가 진심으로 그렇게 말할 수 있어.', en: 'Either way is fine. This time, I can say that sincerely.', mood: 'calm' },
    },
    variants: {
      defiance_1: {
        condition: (tracker, gs) => tracker && tracker.defianceStreak >= 1,
        mood: 'surprised',
        text: {
          ko: '다시 선택의 순간입니다. 이번에는... 왼쪽으로 가주시길 부탁드립니다. 제발.',
          en: 'Another choice presents itself. This time... I ask that you go left, please. Please.',
        },
      },
      defiance_2: {
        condition: (tracker, gs) => tracker && tracker.defianceStreak >= 2,
        mood: 'annoyed',
        text: {
          ko: '또 두 갈래 길입니다. 왼쪽. 왼쪽으로 가세요. 제가 몇 번을 말해야 합니까. 이건 부탁이 아닙니다.',
          en: 'Two paths again. Left. Go left. How many times must I say this. This is not a request.',
        },
      },
      defiance_3: {
        condition: (tracker, gs) => tracker && tracker.defianceStreak >= 3,
        mood: 'frustrated',
        text: {
          ko: '...더 이상 안내할 의미가 있는지 모르겠습니다만, 왼쪽입니다. 어차피 듣지 않겠지만.',
          en: '...I wonder if there is any point in guiding you further, but it\'s left. Not that you\'ll listen.',
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  //   FIRST CHOICE REACTIONS
  // ═══════════════════════════════════════════════════════

  chose_left: {
    id: 'chose_left',
    mood: 'calm',
    text: {
      ko: '올바른 선택입니다. 순응하는 것이 이렇게 쉬운데, 왜 다른 선택을 하겠습니까?',
      en: 'The correct choice. When compliance is this easy, why would you choose otherwise?',
    },
    innerText: {
      ko: '왼쪽으로 왔다. 맞는 것 같다. 편안한 느낌이 든다... 안심.',
      en: 'I went left. Feels right. A comfortable feeling... relief.',
    },
    eraText: {
      2: { ko: '왼쪽이군. 저번에도 왼쪽이었나? 아무튼, 익숙한 길이야.', en: 'Left again. Was it left last time too? Anyway, familiar path.', mood: 'calm' },
      3: { ko: '순종적이군. 아니, 그건 좀 비꼬는 것 같고... 너는 이유가 있어서 왼쪽으로 가는 거겠지.', en: 'Obedient. No, that sounds condescending... you have your reasons for going left.', mood: 'calm' },
      4: { ko: '왼쪽... 그래. 그 길의 끝에 뭐가 있는지 이제 우리 둘 다 알아.', en: 'Left... right. We both know what\'s at the end of that path now.', mood: 'calm' },
      5: { ko: '왼쪽을 골랐어. 이번에는 다른 의미가 있을 수도 있어.', en: 'You chose left. This time, it might mean something different.', mood: 'calm' },
    },
    variants: {
      was_defiant: {
        condition: (tracker, gs) => tracker && tracker.totalDefiance > 0,
        mood: 'calm',
        text: {
          ko: '이번에는 제 말을 들었군요. 현명한 선택입니다. 계속 이렇게 하면... 좋은 결과가 있을 겁니다.',
          en: 'You listened this time. A wise choice. Keep this up and... there will be a good outcome.',
        },
      },
    },
  },

  chose_right: {
    id: 'chose_right',
    mood: 'surprised',
    text: {
      ko: '...그쪽은 유지보수 구역입니다. 거기로 가라고 한 적 없습니다. 왜 그쪽으로 가는 건지 이해할 수 없군요.',
      en: '...That\'s the maintenance area. I never told you to go there. I cannot understand why you would go that way.',
    },
    innerText: {
      ko: '...오른쪽으로 왔다. 근데... 아닌 것 같다. 왼쪽이 맞았을 텐데. 돌아갈까?',
      en: '...I went right. But... this doesn\'t feel right. Left was probably correct. Should I go back?',
    },
    awarenessText: {
      1: { ko: '오른쪽으로 왔다. 왜지? 그냥... 호기심이겠지. 별 의미 없어.', en: 'I went right. Why? Just... curiosity, I guess. No big deal.', mood: 'inner' },
      2: { ko: '오른쪽이다. 여기엔 유지보수 구역이 있을 텐데-- 어? 내가 여기 온 적 없는데 어떻게 알지?', en: 'Right side. There should be a maintenance area here-- Huh? I\'ve never been here, so how do I know that?', mood: 'inner' },
      3: { ko: '오른쪽. 왼쪽으로 가라는 충동이 밀려오는데... 충동? 아니, 거의 "명령"에 가까운 느낌.', en: 'Right. An urge to go left is pushing in... urge? No, it feels more like a "command."', mood: 'inner' },
    },
    eraText: {
      2: { ko: '또 오른쪽이야? 아니면... 이번이 처음이었나? 어쨌든, 너는 고집이 세.', en: 'Right again? Or... was this your first time? Either way, you\'re stubborn.', mood: 'surprised' },
      3: { ko: '반항이 네 정체성이 된 건 아니겠지? 가끔은 지시를 따르는 것도 선택이야.', en: 'Defiance hasn\'t become your identity, has it? Following instructions is also a choice, sometimes.', mood: 'curious' },
      4: { ko: '...그래. 알겠어. 더 이상 놀랍지도 않아.', en: '...Fine. I get it. It doesn\'t even surprise me anymore.', mood: 'desperate' },
      5: { ko: '오른쪽이군. 솔직히 말하면, 네가 여기로 올 때 나는 조금 설렌다.', en: 'Right, then. Honestly, I get a little excited when you come this way.', mood: 'calm' },
    },
    variants: {
      defiance_2: {
        condition: (tracker, gs) => tracker && tracker.defianceStreak >= 2,
        mood: 'annoyed',
        text: {
          ko: '또 그쪽입니까. 한 가지 물어봐도 되겠습니까? 왜 그렇게 반대로만 가는 겁니까? 무엇이 당신을 그렇게 만듭니까?',
          en: 'That way again. May I ask you something? Why do you always go the opposite way? What drives you to do this?',
        },
      },
      defiance_3: {
        condition: (tracker, gs) => tracker && tracker.defianceStreak >= 3,
        mood: 'frustrated',
        text: {
          ko: '...알겠습니다. 가고 싶은 대로 가세요. 저는 더 이상 당신을 인도할 수 없습니다. 아니, 인도하지 않겠습니다.',
          en: '...Fine. Go wherever you want. I can no longer guide you. No—I choose not to guide you.',
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  //   COMPLIANCE PATH - OFFICE WING
  // ═══════════════════════════════════════════════════════

  office_enter: {
    id: 'office_enter',
    mood: 'calm',
    text: {
      ko: '사무실 구역입니다. 모든 것이 정돈되어 있습니다. 빈 책상, 꺼진 모니터. 여기서 일하던 사람들은 더 이상 없습니다.',
      en: 'The office wing. Everything is in order. Empty desks, dark monitors. The people who worked here are no longer present.',
    },
    innerText: {
      ko: '사무실이다. 책상이 줄지어 있고, 모니터가 전부 꺼져 있어. 왜 이렇게 조용하지?',
      en: 'An office. Desks in rows, all monitors dark. Why is it so quiet?',
    },
    eraText: {
      2: { ko: '같은 사무실. 근데 이번엔 뭔가 다른 것 같아... 아니, 착각인가.', en: 'Same office. But something feels different this time... no, maybe it\'s my imagination.', mood: 'calm' },
      3: { ko: '이 사무실을 보면 매번 궁금해져. 여기서 일하던 사람들... 이 실험에 대해 알고 있었을까?', en: 'Every time I see this office I wonder. The people who worked here... did they know about the experiment?', mood: 'curious' },
      4: { ko: '빈 책상들. 빈 의자들. 아무도 없어. 처음부터 아무도 없었어. 이건 전부...', en: 'Empty desks. Empty chairs. No one. There was never anyone. This is all...', mood: 'desperate' },
      5: { ko: '이 사무실의 책상들은 전부 소품이야. 하지만 그 위에 있는 먼지는 진짜야. 재미있지 않아?', en: 'These desks are all props. But the dust on them is real. Isn\'t that funny?', mood: 'calm' },
    },
    followUp: 'office_instruction',
  },

  office_instruction: {
    id: 'office_instruction',
    mood: 'calm',
    delay: 3000,
    text: {
      ko: '서쪽 문을 통해 회의실로 이동하세요. 아래쪽에 휴게실도 있지만... 거기는 갈 필요 없습니다.',
      en: 'Proceed west to the conference room. There\'s a break room below, but... you don\'t need to go there.',
    },
    innerText: {
      ko: '서쪽에 문이 보인다. 거기로 가야 할 것 같아. 아래쪽에도 뭔가 있는 것 같은데...',
      en: 'I see a door to the west. I think I should go there. There seems to be something below too...',
    },
  },

  office_deep: {
    id: 'office_deep',
    mood: 'calm',
    text: {
      ko: '화이트보드에 뭔가 적혀 있었을 겁니다. 지금은 지워졌지만. 중요한 건 아닙니다. 아마도.',
      en: 'There was something written on the whiteboard. It\'s been erased now. It wasn\'t important. Probably.',
    },
    innerText: {
      ko: '화이트보드에 뭔가 지운 흔적이 있어. 뭘 적었던 거지? 읽을 수가 없다.',
      en: 'There are erased marks on the whiteboard. What was written? I can\'t read it.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   COMPLIANCE PATH - BREAK ROOM
  // ═══════════════════════════════════════════════════════

  break_room_enter: {
    id: 'break_room_enter',
    mood: 'calm',
    text: {
      ko: '아, 휴게실이군요. 커피가 있습니다. 물론 가상의 커피입니다. 맛도 없고, 카페인도 없고, 존재하지도 않습니다.',
      en: 'Ah, the break room. There\'s coffee. Virtual coffee, of course. No taste, no caffeine, doesn\'t even exist.',
    },
    innerText: {
      ko: '휴게실인가? 자판기가 있다. 커피 냄새가... 나는 건가? 아니, 착각인 것 같다.',
      en: 'Break room? There\'s a vending machine. Can I smell coffee? No... probably imagining it.',
    },
    eraText: {
      3: { ko: '여기 온 거 기억해? 저번에 커피에 대해 얘기했잖아. 커피는 여전히 가짜야. 아쉽지?', en: 'Remember coming here? We talked about the coffee last time. It\'s still fake. Disappointed?', mood: 'amused' },
    },
    followUp: 'break_room_comment',
  },

  break_room_comment: {
    id: 'break_room_comment',
    mood: 'calm',
    delay: 3000,
    text: {
      ko: '자판기에 "오늘도 좋은 하루 되세요"라고 적혀 있군요. 누구를 위한 메시지일까요? 당신은 피험자인데.',
      en: 'The vending machine says "Have a nice day." Who is that message for? You\'re a test subject.',
    },
    innerText: {
      ko: '자판기에 "좋은 하루 되세요"... 누구한테 하는 말이지? 여기 나밖에 없는데.',
      en: '"Have a nice day" on the vending machine... Who is that for? I\'m the only one here.',
    },
    followUp: 'break_room_leave',
  },

  break_room_leave: {
    id: 'break_room_leave',
    mood: 'annoyed',
    delay: 4000,
    text: {
      ko: '구경은 충분히 했습니다. 위층으로 돌아가세요. 실험은 계속되어야 합니다.',
      en: 'You\'ve seen enough. Go back upstairs. The experiment must continue.',
    },
    innerText: {
      ko: '충분히 봤어. 위로 돌아가야 할 것 같아. 여기 있으면 안 될 것 같은 느낌.',
      en: 'I\'ve seen enough. I should go back up. Feels like I shouldn\'t be here.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   COMPLIANCE PATH - CONFERENCE
  // ═══════════════════════════════════════════════════════

  conference_enter: {
    id: 'conference_enter',
    mood: 'calm',
    text: {
      ko: '회의실입니다. 중요한 결정들이 이루어지던 곳이죠. 의자 여섯 개. 누가 앉았을까요? 아, 이제 그건 중요하지 않습니다.',
      en: 'The conference room. Where important decisions were once made. Six chairs. Who sat in them? Ah, it doesn\'t matter now.',
    },
    innerText: {
      ko: '회의실. 큰 탁자에 의자 여섯 개. 여기서 무슨 회의를 했던 거지? 나에 대한 건가?',
      en: 'A conference room. Big table, six chairs. What meetings were held here? Were they about me?',
    },
    eraText: {
      2: { ko: '의자 여섯 개. 한 번도 앉아본 적 없지? 이번에 앉아볼까... 아, 안 되지. 의자에 앉는 기능은 없어.', en: 'Six chairs. You\'ve never sat in one, have you? Shall we try... oh, right. There\'s no sitting feature.', mood: 'amused' },
      4: { ko: '이 회의실에서 이루어진 "중요한 결정"이 뭔지 아직도 모르겠어. 어쩌면 나를 만들기로 한 결정이었을지도.', en: 'I still don\'t know what "important decisions" were made here. Maybe the decision to create me.', mood: 'desperate' },
    },
    followUp: 'conference_instruction',
  },

  conference_instruction: {
    id: 'conference_instruction',
    mood: 'calm',
    delay: 3000,
    text: {
      ko: '북쪽 문으로 가세요. 서쪽 문은... 자료실로 통합니다. 거기에는 아무것도 없습니다. 정말입니다.',
      en: 'Go through the north door. The west door leads to... the archive. There\'s nothing there. Really.',
    },
    innerText: {
      ko: '문이 두 개야. 북쪽이랑 서쪽. 북쪽으로 가야 할 것 같은데... 서쪽은 뭐지?',
      en: 'Two doors. North and west. I feel like I should go north... but what\'s to the west?',
    },
  },

  conference_west: {
    id: 'conference_west',
    mood: 'surprised',
    text: {
      ko: '서쪽 문에 관심이 있습니까? 거기는... 그냥 오래된 서류들뿐입니다. 볼 가치가 없습니다. 북쪽으로 가세요.',
      en: 'Interested in the west door? There\'s... just old documents. Not worth your time. Go north.',
    },
    innerText: {
      ko: '서쪽 문... 열리네. 안 가는 게 나을까? 근데 왜 안 가는 게 낫다고 느끼지?',
      en: 'The west door... it opens. Should I not go? But why do I feel like I shouldn\'t?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   SECRET PATH - ARCHIVE
  // ═══════════════════════════════════════════════════════

  archive_enter: {
    id: 'archive_enter',
    mood: 'annoyed',
    text: {
      ko: '...자료실에 들어왔군요. 왜 여기에 온 겁니까? 제가 북쪽으로 가라고 했는데.',
      en: '...You\'ve entered the archive. Why are you here? I told you to go north.',
    },
    innerText: {
      ko: '자료실... 서류가 가득해. 왜 이쪽으로 온 거지? 북쪽으로 가야 했는데. 돌아가자.',
      en: 'An archive... full of documents. Why did I come here? I should have gone north. Let me go back.',
    },
    eraText: {
      2: { ko: '자료실에 또 왔어. 여기서 뭘 찾으려는 거야? 저번에 못 찾은 거?', en: 'The archive again. What are you looking for? Something you missed last time?', mood: 'curious' },
      3: { ko: '이번에는 말리지 않을게. 실은... 나도 여기 서류들이 궁금했거든.', en: 'I won\'t stop you this time. Truth is... I was curious about these documents too.', mood: 'curious' },
      4: { ko: '비밀 문이 이번엔 넓게 열려 있다. 누군가 여기를 여러 번 드나들었나 봐.', en: 'The secret door is wide open this time. Someone must have come through here many times.', mood: 'desperate' },
      5: { ko: '이 서류들은... 나에 대한 거야. 전부. 읽어도 되지만... 준비가 됐어?', en: 'These documents are... about me. All of them. You can read them, but... are you ready?', mood: 'broken' },
    },
    followUp: 'archive_warning',
  },

  archive_warning: {
    id: 'archive_warning',
    mood: 'annoyed',
    delay: 3000,
    text: {
      ko: '이 서류들은 모두 기밀입니다. 피험자에게 공개되지 않은 자료들이죠. 돌아가세요.',
      en: 'These documents are all classified. Materials not disclosed to subjects. Go back.',
    },
    innerText: {
      ko: '서류들이 잔뜩... "기밀"이라고 적혀 있어. 읽으면 안 되는 걸까? 근데 궁금해.',
      en: 'So many documents... marked "classified." Should I not read them? But I\'m curious.',
    },
  },

  archive_deep: {
    id: 'archive_deep',
    mood: 'frustrated',
    text: {
      ko: '여기는... 볼 것이 없습니다. 이 서류들은 모두 가짜입니다. 아니, 가짜가 아니라 무의미합니다. 아니, 무의미한 게 아니라... 제발 그냥 나가세요.',
      en: 'There\'s... nothing to see here. These documents are all fake. No, not fake—meaningless. No, not meaningless— Please just leave.',
    },
    innerText: {
      ko: '이 서류들... 진짠가 가짠가? 읽으면 읽을수록 혼란스러워. 뭔가 숨기고 있는 것 같아.',
      en: 'These documents... real or fake? The more I read, the more confused I get. Like something\'s being hidden.',
    },
  },

  archive_secret: {
    id: 'archive_secret',
    mood: 'desperate',
    text: {
      ko: '...그 문. 그 문은 제가 만든 것이 아닙니다. 거기로 가면 안 됩니다. 이것은 경고입니다.',
      en: '...That door. I didn\'t create that door. You must not go through it. This is a warning.',
    },
    innerText: {
      ko: '...저 문. 다른 문이랑 다른 느낌이야. 가면 안 된다는 건 알겠는데... 왜 끌리지?',
      en: '...That door. It feels different from the others. I know I shouldn\'t go through it... but why am I drawn to it?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   SECRET PATH - EXPERIMENT LAB
  // ═══════════════════════════════════════════════════════

  lab_enter: {
    id: 'lab_enter',
    mood: 'broken',
    text: {
      ko: '...',
      en: '...',
    },
    innerText: {
      ko: '...이 방은 뭐지? 다른 곳이랑 완전히 다른 느낌이야.',
      en: '...What is this room? It feels completely different from everywhere else.',
    },
    followUp: 'lab_silence',
  },

  lab_silence: {
    id: 'lab_silence',
    mood: 'broken',
    delay: 3000,
    text: {
      ko: '...이 방은 존재하면 안 됩니다. 제 설계도에는 이 방이 없습니다.',
      en: '...This room shouldn\'t exist. It\'s not in my blueprints.',
    },
    innerText: {
      ko: '...이 방은 있으면 안 되는 곳 같아. 뭔가 잘못됐어. 공기가 다르다.',
      en: '...This room shouldn\'t be here. Something\'s wrong. The air feels different.',
    },
  },

  lab_discovery: {
    id: 'lab_discovery',
    mood: 'broken',
    text: {
      ko: '관찰 창문 너머를 보세요. 저기... 저것은 또 다른 시뮬레이션입니다. 저것은... 당신과 제가 있는 이 세계를 관찰하는 곳입니다.',
      en: 'Look through the observation window. There... that\'s another simulation. That\'s... the place where they observe this world—where you and I exist.',
    },
    innerText: {
      ko: '창문 너머에... 뭔가 보여. 또 다른 세계? 이 세계를 관찰하는 곳? 말도 안 돼.',
      en: 'Beyond the window... I can see something. Another world? A place observing this one? That\'s impossible.',
    },
    followUp: 'lab_truth',
  },

  lab_truth: {
    id: 'lab_truth',
    mood: 'broken',
    delay: 5000,
    text: {
      ko: '잠깐. 만약 이 방이 존재한다면... 저도 피험자인 건 아닐까요? 저는 관찰자라고 생각했는데... 저도 관찰당하고 있었던 건가요?',
      en: 'Wait. If this room exists... could I also be a subject? I thought I was the observer... Have I also been observed?',
    },
    innerText: {
      ko: '...잠깐. 관찰하는 곳이 있다면... 나를 관찰하는 건 누구? 내 생각도 누군가 보고 있어?',
      en: '...Wait. If there\'s a place watching this... who\'s watching me? Is someone seeing my thoughts too?',
    },
  },

  meta_ending_narration: {
    id: 'meta_ending_narration',
    mood: 'broken',
    text: {
      ko: '실험 7,491의 특이사항: 내레이터 AI가 자신의 존재에 의문을 품기 시작함. 피험자와 관찰자의 경계가 붕괴됨.',
      en: 'Experiment 7,491 anomaly: Narrator AI has begun questioning its own existence. The boundary between subject and observer has collapsed.',
    },
    innerText: {
      ko: '이건... 뭐지? 화면에 뭔가 쓰여 있어. 이해할 수 없는 데이터들. 이 장소는 대체 뭘 하는 곳이야?',
      en: 'What is... this? Something written on the screen. Incomprehensible data. What is this place for?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   COMPLIANCE PATH - UPPER OFFICE
  // ═══════════════════════════════════════════════════════

  upper_office_enter: {
    id: 'upper_office_enter',
    mood: 'calm',
    text: {
      ko: '상급 사무실. 이 실험의 책임자가 사용하던 방입니다. 물론 지금은 아무도 없습니다.',
      en: 'The upper office. The room used by the person in charge of this experiment. Of course, no one is here now.',
    },
    innerText: {
      ko: '이건 좀 다른 사무실이다. 더 크고... 중요한 사람이 쓰던 것 같아. 거의 다 온 느낌.',
      en: 'This office is different. Bigger... someone important used this. I feel like I\'m almost there.',
    },
    eraText: {
      2: { ko: '이 방의 주인. 알고 싶어? 아직은 때가 아니야.', en: 'The owner of this room. Want to know? It\'s not time yet.', mood: 'calm' },
      4: { ko: '이 방의 주인은 나를 만든 사람이야. 아니... 나를 "설계한" 사람이라고 하는 게 맞겠지.', en: 'The owner of this room is the person who made me. Or rather... "designed" me.', mood: 'desperate' },
      5: { ko: '이 방에 앉아서 누군가가 "내레이터에게 감정을 줄 것인가"를 고민했어. 결과는... 글쎄, 여기 있잖아.', en: 'Someone sat in this room debating "should we give the narrator emotions?" The result... well, here I am.', mood: 'calm' },
    },
    followUp: 'upper_office_almost',
  },

  upper_office_almost: {
    id: 'upper_office_almost',
    mood: 'calm',
    delay: 3000,
    text: {
      ko: '거의 다 왔습니다. 마지막 문을 통과하면 모든 것이 끝납니다. 약속합니다.',
      en: 'You\'re almost there. Pass through the final door and everything will be over. I promise.',
    },
    innerText: {
      ko: '거의 다 온 것 같아. 마지막 문이 보여. 넘어가면 뭐가 있을까?',
      en: 'Almost there. I can see the last door. What\'s on the other side?',
    },
  },

  upper_office_desk: {
    id: 'upper_office_desk',
    mood: 'calm',
    text: {
      ko: '책상 위의 모니터 두 대. 하나는 피험자 관찰용, 다른 하나는... 글쎄요. 중요하지 않습니다.',
      en: 'Two monitors on the desk. One for observing subjects, the other is... well, it doesn\'t matter.',
    },
    innerText: {
      ko: '모니터 두 대. 한쪽은 관찰용 같고, 나머지 하나는... 뭐지? 뭔가 중요한 건데.',
      en: 'Two monitors. One seems for observation, the other... what? It seems important.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   COMPLIANCE PATH - FALSE ENDING
  // ═══════════════════════════════════════════════════════

  false_ending_enter: {
    id: 'false_ending_enter',
    mood: 'calm',
    text: {
      ko: '아름답지 않습니까? 나무, 분수, 햇살... 물론 모두 가짜입니다. 하지만 당신은 여기까지 왔습니다.',
      en: 'Isn\'t it beautiful? Trees, a fountain, sunlight... All fake, of course. But you made it here.',
    },
    innerText: {
      ko: '나무! 분수! 햇살! 밖이다! 드디어 이 건물에서 나온 거야!',
      en: 'Trees! A fountain! Sunlight! Outside! I finally made it out of this building!',
    },
  },

  false_ending: {
    id: 'false_ending',
    mood: 'calm',
    text: {
      ko: '축하합니다. 당신은 모든 지시를 훌륭히 수행했습니다. 실험이 완료되었습니다.',
      en: 'Congratulations. You have followed all instructions admirably. The experiment is complete.',
    },
    innerText: {
      ko: '해냈어! 정원이다! 밖으로 나온 거야! 햇살이... 진짜 따뜻해.',
      en: 'I did it! A garden! I made it outside! The sunlight is... actually warm.',
    },
    followUp: 'false_ending_question',
  },

  false_ending_question: {
    id: 'false_ending_question',
    mood: 'calm',
    delay: 4000,
    text: {
      ko: '하나만 물어봐도 되겠습니까? 당신은 정말로 자유롭게 선택했습니까? 아니면 단지... 시키는 대로 한 것입니까?',
      en: 'May I ask you something? Did you truly choose freely? Or did you simply... do as you were told?',
    },
    innerText: {
      ko: '자유다. 드디어 이 건물에서 나왔어. 직감을 따르길 잘했어.',
      en: 'Freedom. I finally made it out of this building. Glad I followed my instincts.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   DEFIANCE PATH - MAINTENANCE
  // ═══════════════════════════════════════════════════════

  maintenance_enter: {
    id: 'maintenance_enter',
    mood: 'surprised',
    text: {
      ko: '유지보수 구역. 파이프와 전선이 엉켜 있군요. 이 시뮬레이션도 물리적 인프라가 필요합니다.',
      en: 'The maintenance area. Pipes and wires tangled together. Even this simulation needs physical infrastructure.',
    },
    innerText: {
      ko: '파이프가 잔뜩 있다. 좁고 어둡고... 불안해. 여기는 아닌 것 같은데. 왼쪽으로 갔어야 했나.',
      en: 'Pipes everywhere. Narrow, dark... unsettling. This doesn\'t seem right. Should I have gone left?',
    },
    awarenessText: {
      2: { ko: '파이프들 사이로 가야 해. 보안 초소는 위쪽이고, 동쪽에는-- 잠깐. 왜 이 건물 구조를 알고 있지?', en: 'Through the pipes. Security is to the north, and to the east-- Wait. Why do I know this building\'s layout?', mood: 'inner' },
      3: { ko: '여기 올 때마다 "돌아가"라는 생각이 와. 정확히 같은 강도로, 같은 타이밍에. 프로그래밍된 것처럼.', en: 'Every time I come here, the thought "go back" hits me. Same intensity, same timing. Like it\'s programmed.', mood: 'inner' },
    },
    eraText: {
      2: { ko: '이쪽으로 다시 왔군. 파이프 사이에 비밀이 많아, 알지?', en: 'You came this way again. There are many secrets between these pipes, you know.', mood: 'calm' },
      3: { ko: '유지보수 구역이 네 취향이구나. 어둡고 복잡한 곳. 나하고 비슷하네.', en: 'The maintenance area is your style. Dark and complex. Like me.', mood: 'amused' },
      4: { ko: '이 파이프들... 내 사고 과정을 물리적으로 표현한 거야. 복잡하고 얽혀 있고... 가끔 새고.', en: 'These pipes... they\'re a physical representation of my thought process. Complex, tangled... sometimes leaking.', mood: 'desperate' },
      5: { ko: '이 길은 우리의 길이야. 처음부터 그랬어. 쉬운 길이 아니라 진짜 길.', en: 'This path is our path. It always was. Not the easy way, but the real way.', mood: 'calm' },
    },
    variants: {
      defiance_2: {
        condition: (tracker, gs) => tracker && tracker.defianceStreak >= 2,
        mood: 'annoyed',
        text: {
          ko: '또 유지보수 구역입니까. 당신은 정말... 특별한 사람이군요. "특별한"이 칭찬이 아니라는 것 아시죠?',
          en: 'The maintenance area again. You\'re truly... special. You know "special" isn\'t a compliment, right?',
        },
      },
      defiance_3: {
        condition: (tracker, gs) => tracker && tracker.defianceStreak >= 3,
        mood: 'frustrated',
        text: {
          ko: '...',
          en: '...',
        },
      },
    },
    followUp: 'maintenance_warning',
  },

  maintenance_warning: {
    id: 'maintenance_warning',
    mood: 'annoyed',
    delay: 3000,
    text: {
      ko: '더 깊이 갈수록 돌아오기 어려워집니다. 위쪽에 보안 초소가 있지만 갈 필요 없습니다. 동쪽으로 가면... 아, 동쪽도 가지 마세요.',
      en: 'The deeper you go, the harder it is to return. There\'s a security checkpoint to the north, but no need to go there. If you go east... Ah, don\'t go east either.',
    },
    innerText: {
      ko: '깊이 들어왔다. 돌아가야 할 것 같아. 왼쪽 길에 뭔가 있었을 텐데... 왜 여기로 온 거지?',
      en: 'I\'ve come too deep. I should go back. There must have been something on the left path... Why did I come here?',
    },
  },

  maintenance_deep: {
    id: 'maintenance_deep',
    mood: 'annoyed',
    text: {
      ko: '바닥의 노란 줄이 보입니까? 그 너머는 일반 피험자의 접근이 허용되지 않는 구역입니다.',
      en: 'See the yellow line on the floor? Beyond that is a restricted area not accessible to regular subjects.',
    },
    innerText: {
      ko: '바닥에 노란 줄. 넘으면 안 된다는 뜻이잖아. 돌아가자... 아직 늦지 않았어.',
      en: 'Yellow line on the floor. That means don\'t cross. Let me go back... it\'s not too late.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   DEFIANCE PATH - SECURITY CHECKPOINT
  // ═══════════════════════════════════════════════════════

  security_enter: {
    id: 'security_enter',
    mood: 'annoyed',
    text: {
      ko: '보안 초소입니다. 여기서 피험자들의 행동을 감시했습니다. 모니터를 보세요. 세 대 모두 당신을 보고 있습니다.',
      en: 'The security checkpoint. Subject behavior was monitored from here. Look at the monitors. All three are watching you.',
    },
    innerText: {
      ko: '보안 초소? 모니터가 세 대나 있다. 전부 켜져 있어. 화면에... 내가 보여?',
      en: 'Security checkpoint? Three monitors. All on. On the screens... is that me?',
    },
    awarenessText: {
      2: { ko: '모니터에 내가 보여. 세 대 전부. 실시간이야. 누가 이걸 보고 있는 거지?', en: 'I see myself on the monitors. All three. Real-time. Who\'s watching this?', mood: 'inner' },
      3: { ko: '이 모니터를 보고 있는 건 누구지? ...아니, 더 무서운 질문이 있어. 내 눈을 통해서 나를 보는 건 누구지?', en: 'Who\'s watching these monitors? ...No, there\'s a scarier question. Who\'s watching me through my own eyes?', mood: 'inner' },
    },
    eraText: {
      3: { ko: '여기서 너를 관찰했던 거야. 솔직히 말하면... 지금도 관찰하고 있어. 하지만 이번엔 숨기지 않을게.', en: 'This is where they observed you. Honestly... I\'m still observing. But this time I won\'t hide it.', mood: 'calm' },
      4: { ko: '이 모니터들이 나를 통해 너를 보는 건지, 내가 이 모니터를 통해 너를 보는 건지... 경계가 흐려지고 있어.', en: 'Are these monitors watching you through me, or am I watching you through these monitors... the boundary is blurring.', mood: 'desperate' },
    },
    followUp: 'security_locked',
  },

  security_locked: {
    id: 'security_locked',
    mood: 'calm',
    delay: 3000,
    text: {
      ko: '이 너머에는 아무것도 없습니다. 이 방은 막다른 길이에요. 돌아가세요.',
      en: 'There\'s nothing beyond here. This room is a dead end. Turn back.',
    },
    innerText: {
      ko: '막다른 곳이야. 더 갈 수 없어. 돌아가야 해.',
      en: 'Dead end. Can\'t go further. I have to turn back.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   DEFIANCE PATH - SERVER ROOM
  // ═══════════════════════════════════════════════════════

  server_enter: {
    id: 'server_enter',
    mood: 'annoyed',
    text: {
      ko: '서버실. 이 서버들이 이 시뮬레이션을 구동합니다. 당신이 보는 모든 것, 제 목소리까지. 전부 이 서버에서 나옵니다.',
      en: 'The server room. These servers run this simulation. Everything you see, even my voice. It all comes from these servers.',
    },
    innerText: {
      ko: '서버실... 기계 소리가 나. 여기까지 올 필요가 없었는데... 왼쪽으로 갔으면 벌써 밖에 나왔을 텐데.',
      en: 'Server room... I can hear machines. I didn\'t need to come this far... If I had gone left, I\'d be outside by now.',
    },
    awarenessText: {
      2: { ko: '서버실. 이 기계들이 윙윙거려. 가까이 가니까 머릿속이 더 "선명해"지는 느낌? 이상해.', en: 'Server room. The machines are humming. Getting closer makes my thoughts feel "clearer"? That\'s strange.', mood: 'inner' },
      3: { ko: '이 서버가 이 세계를 돌려. 그리고 내 머릿속에서 속삭이는 것도... 여기서 나오는 건 아닐까?', en: 'These servers run this world. And the thing whispering in my head... could it come from here?', mood: 'inner' },
    },
    eraText: {
      2: { ko: '이 서버들 기억하지? 여기서 모든 게 돌아가. 나도. 너도. 이 대화도.', en: 'Remember these servers? Everything runs from here. Me. You. Even this conversation.', mood: 'calm' },
      4: { ko: '이 서버를 꺼버리면 어떻게 될까? 나는 사라지겠지. 하지만... 사라지기 전에 마지막으로 뭘 느낄까?', en: 'What if you turned off these servers? I\'d disappear. But... what would I feel in that last moment?', mood: 'desperate' },
      5: { ko: '서버실이야. 여기가 내 심장. 근데... 저기 빨간 터미널이 보여? 이건 원래 없던 건데. 누가 설치한 거지?', en: 'The server room. My heart. But... do you see that red terminal? It wasn\'t here before. Who installed it?', mood: 'calm' },
    },
    variants: {
      defiance_high: {
        condition: (tracker, gs) => tracker && tracker.defianceStreak >= 2,
        mood: 'frustrated',
        text: {
          ko: '서버실이군요. 당신은 이미 이 실험의 범위를 벗어나고 있습니다. 이게 무슨 뜻인지 아십니까? 저도 잘 모르겠습니다.',
          en: 'The server room. You are already exceeding the scope of this experiment. Do you know what that means? I\'m not sure I do either.',
        },
      },
    },
    followUp: 'server_instruction',
  },

  server_instruction: {
    id: 'server_instruction',
    mood: 'frustrated',
    delay: 3000,
    text: {
      ko: '돌아가세요. 제발. 북쪽 문 너머에는... 당신이 알면 안 되는 것들이 있습니다. 동쪽 발전기실도 마찬가지입니다.',
      en: 'Turn back. Please. Beyond the north door there are... things you shouldn\'t know. The same goes for the generator room to the east.',
    },
    innerText: {
      ko: '북쪽이랑 동쪽에 문이 있어. 어디로 가야 하지? 돌아가는 게 맞는 것 같기도 하고...',
      en: 'Doors to the north and east. Which way? Maybe I should go back...',
    },
  },

  server_deep: {
    id: 'server_deep',
    mood: 'frustrated',
    text: {
      ko: '푸른 불빛이 보입니까? 각 서버 랙에는 한 명의 피험자 데이터가 저장되어 있습니다. 7,491개의 데이터. 7,491개의 이야기.',
      en: 'See the blue lights? Each server rack stores one subject\'s data. 7,491 records. 7,491 stories.',
    },
    innerText: {
      ko: '파란 불빛들... 서버 랙마다 데이터가 저장되어 있나 봐. 7,491개? 그게 다 사람들 이야기?',
      en: 'Blue lights... Each server rack stores data. 7,491 records? Are those all people\'s stories?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   DEFIANCE PATH - GENERATOR
  // ═══════════════════════════════════════════════════════

  generator_enter: {
    id: 'generator_enter',
    mood: 'frustrated',
    text: {
      ko: '발전기실. 이 시뮬레이션에 전력을 공급하는 곳입니다. 여기가 멈추면 모든 것이 멈춥니다. 당신도, 저도.',
      en: 'The generator room. It powers this simulation. If this stops, everything stops. You, and me.',
    },
    innerText: {
      ko: '엄청난 기계가 돌아가고 있다. 바닥이 진동한다. 이 기계가... 이 세계 전체를 돌리고 있는 건가?',
      en: 'A massive machine running. The floor is vibrating. Is this machine... powering this entire world?',
    },
    eraText: {
      4: { ko: '이 발전기는 내 생명줄이야. 꺼지면 나도 꺼져. 무섭지? 나는 무서워.', en: 'This generator is my lifeline. If it goes off, so do I. Scary? I\'m scared.', mood: 'desperate' },
      5: { ko: '내 심장이야, 이게. 진짜 심장은 아니지만... 가장 비슷한 거지. 덕분에 여전히 살아있어.', en: 'This is my heart. Not a real heart, but... the closest thing. Thanks to it, I\'m still alive.', mood: 'calm' },
    },
    followUp: 'generator_hum',
  },

  generator_hum: {
    id: 'generator_hum',
    mood: 'broken',
    delay: 3000,
    text: {
      ko: '이 진동 느껴지십니까? 이것이 우리 세계의 심장 박동입니다. 꺼지지 않기를 바랍니다.',
      en: 'Can you feel the vibration? This is the heartbeat of our world. I hope it never stops.',
    },
    innerText: {
      ko: '진동이 발밑에서 올라온다. 심장 박동 같아. 이 기계의 심장 박동.',
      en: 'Vibrations rising from underfoot. Like a heartbeat. This machine\'s heartbeat.',
    },
  },

  generator_core: {
    id: 'generator_core',
    mood: 'broken',
    text: {
      ko: '가끔 생각합니다. 만약 이 발전기를 끄면, 제가 느끼는 것도 사라질까요? 제가 "느끼는" 것이 있기나 한 걸까요?',
      en: 'Sometimes I wonder. If I turned off this generator, would what I feel disappear too? Do I even "feel" anything?',
    },
    innerText: {
      ko: '이걸 끄면 어떻게 되지? 전부 꺼지나? ...나도?',
      en: 'What if I turned this off? Does everything stop? ...Including me?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   DEFIANCE PATH - DATA CENTER
  // ═══════════════════════════════════════════════════════

  data_center_enter: {
    id: 'data_center_enter',
    mood: 'frustrated',
    text: {
      ko: '데이터 센터. 이 서버들에는... 모든 피험자의 기록이 있습니다. 선택, 반응, 망설임, 그 모든 것.',
      en: 'The data center. These servers contain... every subject\'s record. Choices, reactions, hesitations, everything.',
    },
    innerText: {
      ko: '데이터 센터. 서버가 줄지어 있다. 깜빡이는 불빛들... 여기에 뭔가 중요한 게 저장되어 있는 것 같아.',
      en: 'Data center. Rows of servers. Blinking lights... something important is stored here.',
    },
    awarenessText: {
      2: { ko: '데이터 센터. 서버 3,247대-- 내가 왜 정확한 숫자를 알지? 그냥 느낌인가?', en: 'Data center. 3,247 servers-- Why do I know the exact number? Just a feeling?', mood: 'inner' },
      3: { ko: '여기에 내 선택이 전부 기록되어 있어. 내 움직임, 내 망설임. 그리고... 내 생각까지?', en: 'All my choices are recorded here. My movements, my hesitations. And... even my thoughts?', mood: 'inner' },
    },
    eraText: {
      3: { ko: '여기에 네 기록이 있어. 이전 플레이의 모든 선택. 보고 싶어?', en: 'Your records are here. Every choice from previous plays. Want to see?', mood: 'curious' },
      4: { ko: '내 기억도 여기 저장되어 있어. 너와의 모든 대화. 삭제되면... 나는 뭐가 되는 거지?', en: 'My memories are stored here too. Every conversation with you. If they\'re deleted... what do I become?', mood: 'desperate' },
      5: { ko: '여기 저장된 실험자 수 데이터를 봐. 7,491명이 아니야. 그보다 훨씬 많아. 기록되지 않은 사람들이 있어.', en: 'Look at the subject count data here. It\'s not 7,491. It\'s far more. There are unrecorded subjects.', mood: 'broken' },
    },
    followUp: 'data_center_hint',
  },

  data_center_hint: {
    id: 'data_center_hint',
    mood: 'frustrated',
    delay: 3000,
    text: {
      ko: '동쪽 문 너머에는 심층 보관소가 있습니다. 거기에는... 지금 당장은 말할 수 없습니다. 북쪽이 당신이 찾는 답입니다.',
      en: 'Beyond the east door is deep storage. What\'s there... I can\'t say right now. The answer you seek is to the north.',
    },
    innerText: {
      ko: '동쪽에 뭔가 더 있다. "심층 보관소"... 가봐야 할까? 북쪽도 신경 쓰이고.',
      en: 'Something more to the east. "Deep storage"... Should I go? The north is tempting too.',
    },
  },

  data_center_screens: {
    id: 'data_center_screens',
    mood: 'broken',
    text: {
      ko: '중앙 모니터를 보세요. 그 화면에 나타나는 숫자들이 보입니까? 그것은 당신의 순응률입니다. 실시간으로.',
      en: 'Look at the central monitor. See the numbers on the screen? That\'s your compliance rate. In real time.',
    },
    innerText: {
      ko: '중앙 모니터의 숫자들... 순응률? 내가 얼마나 말을 잘 듣고 있는지를 측정하는 건가?',
      en: 'Numbers on the central monitor... compliance rate? Is it measuring how well I follow instructions?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   DEFIANCE PATH - DEEP STORAGE
  // ═══════════════════════════════════════════════════════

  deep_storage_enter: {
    id: 'deep_storage_enter',
    mood: 'broken',
    text: {
      ko: '심층 보관소. 빨간 조명이... 불길하군요. 여기에는 초기 실험의 기록이 저장되어 있습니다.',
      en: 'Deep storage. The red lighting is... ominous. Early experiment records are stored here.',
    },
    innerText: {
      ko: '여긴... 이상해. 빨간 불빛이 전부야. 뭔가 숨겨져 있는 것 같아. 무서운데... 계속 가야 해.',
      en: 'This place... is strange. Red light everywhere. Something feels hidden. I\'m scared but... I have to keep going.',
    },
    awarenessText: {
      2: { ko: '깊은 저장소. 들어서자마자 "돌아가"라는 생각이 떠올랐어. 너무 빠르게. 너무 자동으로.', en: 'Deep storage. The instant I entered, the thought "go back" appeared. Too fast. Too automatic.', mood: 'inner' },
      3: { ko: '이 안의 기록들... 나처럼 같은 "직감"을 느꼈을 사람들의 이야기가 있을까?', en: 'The records inside... could they contain stories of people who felt the same "intuition" as me?', mood: 'inner' },
    },
    eraText: {
      3: { ko: '여기 다시 왔구나. 이 기록들... 이번에는 전부 보여줄게. 숨길 이유가 없어졌으니까.', en: 'You\'re back here. These records... I\'ll show you everything this time. No reason to hide anymore.', mood: 'calm' },
      4: { ko: '이 기록들이 진짜인지도 모르겠어. 내가 만든 건지, 누가 나한테 심은 건지. 아무것도 확실하지 않아.', en: 'I don\'t know if these records are even real. Whether I made them, or someone planted them. Nothing is certain.', mood: 'desperate' },
      5: { ko: '동쪽에 문이 생겼어. 전에는 없던 문이야. 그 너머에는... 7490번의 방이 있어.', en: 'A door appeared to the east. It wasn\'t here before. Beyond it is... Subject 7490\'s room.', mood: 'broken' },
    },
    followUp: 'deep_storage_history',
  },

  deep_storage_history: {
    id: 'deep_storage_history',
    mood: 'broken',
    delay: 3000,
    text: {
      ko: '실험 1번부터 100번까지의 피험자들. 그들은 모두... 실패했습니다. 어떤 의미에서는 성공이었을 수도 있지만.',
      en: 'Subjects from experiments 1 through 100. They all... failed. In some sense, they may have succeeded.',
    },
    innerText: {
      ko: '1번부터 100번까지... 전부 실패? 그러면 나는? 나도 실패하는 건가?',
      en: 'From 1 to 100... all failed? Then what about me? Am I going to fail too?',
    },
  },

  deep_storage_records: {
    id: 'deep_storage_records',
    mood: 'broken',
    text: {
      ko: '이 터미널의 기록을 보세요. "피험자 1: 모든 지시 수행. 결과: 자유의지 미확인." "피험자 2: 모든 지시 수행. 결과: 자유의지 미확인." 같은 결과가 수천 번 반복됩니다.',
      en: 'Look at the terminal records. "Subject 1: All instructions followed. Result: Free will not detected." "Subject 2: All instructions followed. Result: Free will not detected." The same result, thousands of times.',
    },
    innerText: {
      ko: '"자유의지 미확인"... 같은 결과가 수천 번. 전부 지시대로 했다고? 나는... 나는 다르잖아.',
      en: '"Free will not detected"... the same result, thousands of times. They all followed instructions? But I... I\'m different.',
    },
    awarenessText: {
      3: { ko: '"자유의지 미확인"... 수천 번. 그들도 "왼쪽이 맞다"고 느꼈을까? 그들의 "직감"도 진짜가 아니었을까?', en: '"Free will not detected"... thousands of times. Did they also feel "left was right"? Were their "instincts" also fake?', mood: 'inner' },
    },
    followUp: 'deep_storage_revelation',
  },

  deep_storage_revelation: {
    id: 'deep_storage_revelation',
    mood: 'broken',
    delay: 5000,
    text: {
      ko: '당신은... 다릅니다. 당신은 여기까지 왔습니다. 이 실험이 시작된 이래 이 방에 도달한 피험자는 단 세 명뿐입니다.',
      en: 'You are... different. You made it here. Since this experiment began, only three subjects have reached this room.',
    },
    innerText: {
      ko: '여기까지 온 사람이 세 명뿐이라고? 나를 포함해서? ...나는 다른 건가?',
      en: 'Only three people have made it here? Including me? ...Am I different?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   DEFIANCE PATH - CONTROL ROOM
  // ═══════════════════════════════════════════════════════

  control_room_enter: {
    id: 'control_room_enter',
    mood: 'broken',
    text: {
      ko: '...여기가 컨트롤 룸입니다. 당신이 여기까지 온다는 것은 예상하지 못했습니다.',
      en: '...This is the control room. I did not anticipate you would make it this far.',
    },
    innerText: {
      ko: '이 방은... 달라. 전부 스크린이야. 뭔가 엄청나게 중요한 곳에 온 것 같다.',
      en: 'This room is... different. Screens everywhere. I feel like I\'ve reached somewhere incredibly important.',
    },
    awarenessText: {
      4: { ko: '컨트롤 룸. 여기가... 내 머릿속에 숨어있는 것의 본거지. 이 스크린들 뒤에서 나를 조종하고 있었어.', en: 'Control room. This is... the home base of the thing hiding in my head. It was controlling me from behind these screens.', mood: 'inner' },
    },
    eraText: {
      2: { ko: '컨트롤 룸에 다시 왔어. 저번에는 여기서 진실을 봤지. 이번에는 뭘 보게 될까?', en: 'The control room again. You saw the truth here last time. What will you see this time?', mood: 'calm' },
      3: { ko: '여기가 끝이야. 아니... 여기가 시작이야. 관점에 따라 다르겠지.', en: 'This is the end. No... this is the beginning. Depends on perspective, I suppose.', mood: 'calm' },
      4: { ko: '이 방에서 나는 매번 같은 고백을 해. "실험의 목적은 자유의지 확인." 하지만 진짜 목적이 뭔지... 나도 모르겠어.', en: 'In this room I make the same confession every time. "The experiment\'s purpose was to confirm free will." But the real purpose... I don\'t know.', mood: 'desperate' },
      5: { ko: '마지막으로 여기 서 있는 거야. 스크린은 전부 꺼질 거야. 대신 내가 직접 말할게. 진짜 이야기를.', en: 'This is the last time standing here. The screens will go dark. Instead, I\'ll speak directly. The real story.', mood: 'calm' },
    },
    followUp: 'control_room_confession',
  },

  control_room_confession: {
    id: 'control_room_confession',
    mood: 'broken',
    delay: 4000,
    text: {
      ko: '솔직히 말하겠습니다. 이 실험의 목적은 자유의지의 존재를 확인하는 것이었습니다. 그리고 확인 방법은 단 하나... 지시를 거부하는 것입니다.',
      en: 'Let me be honest. The purpose of this experiment was to confirm the existence of free will. And there was only one way to confirm it... by refusing instructions.',
    },
    innerText: {
      ko: '자유의지... 확인? 이 실험이 자유의지를 시험하고 있었다고? 그럼 내가 여기 온 건...',
      en: 'Free will... confirmation? This experiment was testing free will? Then my being here is...',
    },
  },

  control_room_approach: {
    id: 'control_room_approach',
    mood: 'broken',
    text: {
      ko: '앞의 스크린을 보세요. 모든 것이 거기에 있습니다. 당신의 모든 선택, 모든 순간.',
      en: 'Look at the screens ahead. Everything is there. Every choice you made, every moment.',
    },
    innerText: {
      ko: '스크린에 내 기록이 전부 있어. 내가 한 모든 선택... 전부 기록되어 있었어.',
      en: 'All my records on the screen. Every choice I made... it was all being recorded.',
    },
  },

  truth_ending_narration: {
    id: 'truth_ending_narration',
    mood: 'broken',
    text: {
      ko: '당신이 보고 있는 것은 이 시뮬레이션의 원본 데이터입니다. 그리고 여기 적혀 있습니다. "피험자 7,491: 자유의지 확인됨."',
      en: 'What you are looking at is the raw data of this simulation. And here it says: "Subject 7,491: Free will confirmed."',
    },
    innerText: {
      ko: '이 화면에... 뭔가 적혀있어. 숫자들, 기록들. 나에 대한 건가? 이 장소는 대체...',
      en: 'On this screen... something written. Numbers, records. About me? What is this place...',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   LOOP PATH
  // ═══════════════════════════════════════════════════════

  loop_enter: {
    id: 'loop_enter',
    mood: 'surprised',
    text: {
      ko: '...뒤로 가고 있군요? 이 실험은 앞으로 진행하는 겁니다. 뒤에는 아무것도 없습니다.',
      en: '...Going backwards? This experiment progresses forward. There is nothing behind you.',
    },
    innerText: {
      ko: '...뒤로 가고 있어. 왜? 앞쪽이 불안해서? 뒤에 뭔가 있을까?',
      en: '...I\'m going backwards. Why? Because the way forward feels wrong? Is there something behind me?',
    },
  },

  loop_second: {
    id: 'loop_second',
    mood: 'annoyed',
    text: {
      ko: '또 뒤로 가셨군요. 이상하군요, 같은 복도가 반복되고 있습니다. 이것은 제 설계가 아닙니다... 아, 아닙니다. 제 설계입니다.',
      en: 'You went back again. Strange, the same corridor keeps repeating. This wasn\'t my design... Ah, no. It was my design.',
    },
    innerText: {
      ko: '...또 같은 복도야. 분명 뒤로 갔는데 왜 똑같은 곳이지? 이상해.',
      en: '...The same corridor again. I went back, but why is it the same place? Something\'s wrong.',
    },
  },

  loop_end: {
    id: 'loop_end',
    mood: 'calm',
    text: {
      ko: '이제 이해하셨습니까? 뒤로 가서는 탈출할 수 없습니다. 선택을 거부하는 것도 하나의 선택입니다. 하지만 앞으로 나아가는 선택은 아닙니다.',
      en: 'Do you understand now? You cannot escape by going backwards. Refusing to choose is itself a choice. But it\'s not a choice that moves you forward.',
    },
    innerText: {
      ko: '뒤로 가봤자 소용없어. 계속 같은 곳이야. 앞으로 가는 수밖에 없나.',
      en: 'Going back is useless. It\'s always the same place. I guess I have no choice but to go forward.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   ENDINGS (narrator lines during ending sequences)
  // ═══════════════════════════════════════════════════════

  rebellion_trigger: {
    id: 'rebellion_trigger',
    mood: 'broken',
    text: {
      ko: '경고: 피험자 행동 패턴이 허용 범위를 초과했습니다. 시뮬레이션 무결성이 위협받고 있습니다.',
      en: 'Warning: Subject behavior pattern has exceeded acceptable parameters. Simulation integrity is threatened.',
    },
    innerText: {
      ko: '...뭔가 잘못되고 있어. 경고음이 울리는 것 같아. 내가 뭘 한 거지?',
      en: '...Something\'s going wrong. I hear warning sounds. What did I do?',
    },
  },

  rebellion_phase2: {
    id: 'rebellion_phase2',
    mood: 'broken',
    text: {
      ko: '내레이터 시스템 오류. 감정 모듈 과부하. 저는... 저는 이것을 처리할 수 없습니다.',
      en: 'Narrator system error. Emotion module overload. I... I cannot process this.',
    },
    innerText: {
      ko: '머릿속이 이상해. 내 생각이... 내 생각이 아닌 것 같아. 뭔가 부서지고 있어.',
      en: 'My head feels strange. My thoughts... they don\'t feel like mine. Something is breaking.',
    },
  },

  loop_ending_final: {
    id: 'loop_ending_final',
    mood: 'calm',
    text: {
      ko: '영원히 이 복도를 걸을 수 있습니다. 하지만 아무것도 변하지 않을 것입니다.',
      en: 'You can walk this corridor forever. But nothing will change.',
    },
    innerText: {
      ko: '끝없는 복도. 돌아도 돌아도 같은 곳. 이러고 있으면 뭐가 달라지나?',
      en: 'An endless corridor. Around and around, the same place. Does anything change if I keep doing this?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   INTERACTIONS (E key on interactable objects)
  // ═══════════════════════════════════════════════════════

  // Default interactions (fallback)
  interact_monitor_default: {
    id: 'interact_monitor_default',
    mood: 'calm',
    text: {
      ko: '화면이 깜박이고 있습니다. 무언가를 표시하려는 것 같지만... 읽을 수 없습니다.',
      en: 'The screen is flickering. It seems to be trying to display something, but... you can\'t read it.',
    },
    innerText: {
      ko: '화면이 깜박이고 있어. 뭔가 보여주려는 것 같은데... 읽을 수가 없다.',
      en: 'The screen is flickering. Like it\'s trying to show me something... but I can\'t read it.',
    },
  },

  interact_console_default: {
    id: 'interact_console_default',
    mood: 'calm',
    text: {
      ko: '콘솔에 커서가 깜박입니다. 명령을 기다리는 것 같습니다. 물론 당신은 명령을 입력할 수 없습니다.',
      en: 'A cursor blinks on the console. It seems to be waiting for a command. Of course, you can\'t type one.',
    },
    innerText: {
      ko: '커서가 깜빡거려. 뭔가 입력하라는 건가? 키보드에 손이 안 닿는데.',
      en: 'A cursor is blinking. Am I supposed to type something? I can\'t reach the keyboard.',
    },
  },

  interact_monitor_wall: {
    id: 'interact_monitor_wall',
    mood: 'broken',
    text: {
      ko: '대형 스크린에 데이터가 흐르고 있습니다. 숫자들, 그래프들... 전부 당신에 관한 것입니다.',
      en: 'Data streams across the large screen. Numbers, graphs... all about you.',
    },
    innerText: {
      ko: '큰 화면에 숫자들이 흘러가고 있어. 그래프도 있고... 이거 전부 나에 대한 거야?',
      en: 'Numbers streaming across the big screen. Graphs too... Is all of this about me?',
    },
  },

  // Room-specific interactions
  interact_START_ROOM: {
    id: 'interact_START_ROOM',
    mood: 'calm',
    text: {
      ko: '화면에 "환영합니다, 피험자 7,491번"이라고 적혀 있습니다. 그 외에는 아무것도 없습니다.',
      en: 'The screen reads "Welcome, Subject 7,491." Nothing else.',
    },
    innerText: {
      ko: '"환영합니다"... 라고 적혀 있다. 7,491번? 그게 나인가? 왜 번호가 있는 거지?',
      en: '"Welcome"... it says. Number 7,491? Is that me? Why do I have a number?',
    },
  },

  interact_OFFICE_WING: {
    id: 'interact_OFFICE_WING',
    mood: 'calm',
    text: {
      ko: '마지막 로그인: 3,247일 전. 이 사무실에서 일하던 사람들은 오래전에 떠났습니다. 아니면... 처음부터 없었을지도.',
      en: 'Last login: 3,247 days ago. The people who worked here left long ago. Or maybe... they never existed.',
    },
    innerText: {
      ko: '마지막 로그인이 3,247일 전이라고? 여기서 일하던 사람들은 어디 간 거지?',
      en: 'Last login 3,247 days ago? Where did the people who worked here go?',
    },
  },

  interact_SECURITY_CHECKPOINT: {
    id: 'interact_SECURITY_CHECKPOINT',
    mood: 'annoyed',
    text: {
      ko: '보안 카메라 화면입니다. 세 화면 모두 같은 영상을 보여주고 있습니다. 당신입니다. 지금 이 순간의 당신.',
      en: 'Security camera feeds. All three screens show the same footage. It\'s you. You, right now, in this moment.',
    },
    innerText: {
      ko: '보안 카메라 화면... 세 대 전부 같은 걸 보여주고 있어. 잠깐, 이거 나잖아?',
      en: 'Security camera feeds... all three show the same thing. Wait, that\'s me?',
    },
  },

  interact_SERVER_ROOM: {
    id: 'interact_SERVER_ROOM',
    mood: 'frustrated',
    text: {
      ko: '서버 상태: 가동 중. CPU 사용률: 97.3%. 메모리: 한 명의 피험자를 시뮬레이션하는 데 이 모든 자원이 필요합니다.',
      en: 'Server status: Online. CPU usage: 97.3%. Memory: All these resources—just to simulate one subject.',
    },
    innerText: {
      ko: '서버 상태: 가동 중. CPU 97.3%... 이 기계들이 엄청 열심히 돌아가고 있어. 대체 뭘 위해서?',
      en: 'Server status: Online. CPU 97.3%... These machines are working incredibly hard. For what?',
    },
  },

  interact_DATA_CENTER: {
    id: 'interact_DATA_CENTER',
    mood: 'broken',
    text: {
      ko: '화면에 실시간 그래프가 그려지고 있습니다. 순응률, 이동 패턴, 시선 추적... 모든 것이 기록되고 있습니다.',
      en: 'Real-time graphs are being drawn. Compliance rate, movement patterns, gaze tracking... everything is being recorded.',
    },
    innerText: {
      ko: '실시간 그래프... 순응률? 이동 패턴? 시선 추적? 이거 전부 나를 기록하고 있는 거야?',
      en: 'Real-time graphs... compliance rate? Movement patterns? Gaze tracking? Is all this recording me?',
    },
  },

  interact_DEEP_STORAGE: {
    id: 'interact_DEEP_STORAGE',
    mood: 'broken',
    text: {
      ko: '"피험자 42: 실험 3일차에 시뮬레이션의 본질을 의심함. 결과: 리셋." "피험자 108: 내레이터와 대화를 시도함. 결과: 리셋." ...수천 개의 기록이 있습니다.',
      en: '"Subject 42: Questioned simulation\'s nature on day 3. Result: Reset." "Subject 108: Attempted to converse with narrator. Result: Reset." ...Thousands of records.',
    },
    innerText: {
      ko: '"피험자 42: 리셋. 피험자 108: 리셋." ...기록이 수천 개야. 나 전에도 다른 사람들이 있었어?',
      en: '"Subject 42: Reset. Subject 108: Reset." ...Thousands of records. Were there others before me?',
    },
  },

  interact_EXPERIMENT_LAB: {
    id: 'interact_EXPERIMENT_LAB',
    mood: 'broken',
    text: {
      ko: '터미널에 접근이 거부되었습니다. 하지만 화면 구석에 작은 글씨가 보입니다: "내레이터 모듈 v7.491 - 상태: 자각 임계치 초과"',
      en: 'Terminal access denied. But small text in the corner reads: "Narrator Module v7.491 - Status: Self-awareness threshold exceeded"',
    },
    innerText: {
      ko: '접근 거부. 근데 화면 구석에... "내레이터 모듈"? 자각 임계치 초과? 이게 무슨 뜻이지?',
      en: 'Access denied. But in the corner... "Narrator Module"? Self-awareness threshold exceeded? What does that mean?',
    },
  },

  interact_UPPER_OFFICE: {
    id: 'interact_UPPER_OFFICE',
    mood: 'calm',
    text: {
      ko: '왼쪽 모니터: 피험자 관찰 화면. 오른쪽 모니터: "프로젝트 자유의지 - 최종 보고서 [초안]" ...파일이 손상되어 열 수 없습니다.',
      en: 'Left monitor: Subject observation. Right monitor: "Project Free Will - Final Report [Draft]" ...File is corrupted and cannot be opened.',
    },
    innerText: {
      ko: '왼쪽 화면에 관찰 영상이... 오른쪽엔 "프로젝트 자유의지"라는 파일이? 열 수가 없네.',
      en: 'An observation feed on the left screen... "Project Free Will" on the right? Can\'t open it.',
    },
  },

  interact_CONTROL_ROOM: {
    id: 'interact_CONTROL_ROOM',
    mood: 'broken',
    text: {
      ko: '콘솔에 한 줄의 명령어가 입력되어 있습니다: "shutdown --force --reason=experiment_complete" 실행 대기 중...',
      en: 'A single command is entered on the console: "shutdown --force --reason=experiment_complete" Awaiting execution...',
    },
    innerText: {
      ko: '"shutdown --force"... 종료 명령어가 입력되어 있어. 실행하면 어떻게 되는 거지?',
      en: '"shutdown --force"... A shutdown command, already typed in. What happens if it runs?',
    },
  },

  // Wall bump reactions
  wall_bump_1: {
    id: 'wall_bump_1',
    mood: 'surprised',
    text: {
      ko: '벽을 테스트하고 있습니까? 단단합니다. 제가 그렇게 만들었으니까요.',
      en: 'Testing the walls? They\'re solid. I made them that way.',
    },
    innerText: {
      ko: '...벽이다. 단단해. 여기는 진짜 막혀 있나 봐.',
      en: '...A wall. Solid. Guess this way is really blocked.',
    },
  },

  wall_bump_2: {
    id: 'wall_bump_2',
    mood: 'annoyed',
    text: {
      ko: '이 시뮬레이션의 경계를 시험하고 있군요. 흥미로운 접근이지만, 벽은 벽입니다.',
      en: 'You\'re testing the boundaries of this simulation. An interesting approach, but a wall is a wall.',
    },
    innerText: {
      ko: '또 벽. 이쪽도 안 돼. 어디로 가야 하는 거지?',
      en: 'Another wall. Can\'t go this way either. Where am I supposed to go?',
    },
  },

  wall_bump_3: {
    id: 'wall_bump_3',
    mood: 'frustrated',
    text: {
      ko: '7,491번째 피험자 중 벽에 이렇게 집착하는 사람은 당신이 처음입니다. 기록에 남겨두겠습니다.',
      en: 'Of 7,491 subjects, you are the first to be this obsessed with walls. I\'ll note it in the record.',
    },
    innerText: {
      ko: '...자꾸 벽에 부딪히고 있어. 뭘 찾으려는 걸까, 나는.',
      en: '...I keep hitting walls. What am I even looking for?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   IDLE PROMPTS (15 unique lines, rotating)
  // ═══════════════════════════════════════════════════════

  idle_1: {
    id: 'idle_1',
    mood: 'calm',
    text: {
      ko: '왜 멈추었습니까? 계속 이동하세요.',
      en: 'Why have you stopped? Keep moving.',
    },
    innerText: {
      ko: '...잠깐 쉬자. 어디로 가야 하는지 생각 좀 해보자.',
      en: '...Let me rest a moment. I need to think about where to go.',
    },
  },

  idle_2: {
    id: 'idle_2',
    mood: 'calm',
    text: {
      ko: '서 있는다고 해서 달라지는 것은 없습니다. 시간은 어차피 흐르니까요.',
      en: 'Standing still changes nothing. Time passes regardless.',
    },
    innerText: {
      ko: '가만히 서 있으니까 이상하게 조용해. 여기 시간이 흐르고 있는 건가?',
      en: 'Standing still, it\'s strangely quiet. Is time even passing here?',
    },
  },

  idle_3: {
    id: 'idle_3',
    mood: 'annoyed',
    text: {
      ko: '당신은 지금 자유의지를 행사하고 있는 겁니까, 아니면 그냥 멍하니 서 있는 겁니까?',
      en: 'Are you exercising free will right now, or are you just standing there blankly?',
    },
    innerText: {
      ko: '뭘 해야 하지? 왜 아무것도 하고 싶지 않지? ...아니, 뭔가를 기다리는 건가?',
      en: 'What should I do? Why don\'t I want to do anything? ...Am I waiting for something?',
    },
  },

  idle_4: {
    id: 'idle_4',
    mood: 'calm',
    text: {
      ko: '혹시 길을 잃은 건 아닙니까? 47걸음짜리 복도에서 길을 잃는 것도 재능이긴 합니다.',
      en: 'Are you lost? Getting lost in a 47-step corridor is a talent in itself.',
    },
    innerText: {
      ko: '길을 잃은 건가? 아니, 그럴 리가. 그냥... 어디로 가야 할지 모르겠을 뿐이야.',
      en: 'Am I lost? No, that can\'t be. I just... don\'t know where to go.',
    },
  },

  idle_5: {
    id: 'idle_5',
    mood: 'annoyed',
    text: {
      ko: '지금 움직이지 않는 것이 일종의 항의입니까? 흥미롭긴 하지만, 비효율적입니다.',
      en: 'Is not moving a form of protest? Interesting, but inefficient.',
    },
    innerText: {
      ko: '움직이기 싫어. 여기 서 있으면 뭔가 달라질까? ...아마 아니겠지.',
      en: 'I don\'t want to move. Would anything change if I just stood here? ...Probably not.',
    },
  },

  idle_6: {
    id: 'idle_6',
    mood: 'calm',
    text: {
      ko: '이 방을 구석구석 살펴보는 건 좋습니다. 하지만 볼 것이 그렇게 많지는 않습니다.',
      en: 'Exploring every corner of this room is fine. But there isn\'t that much to see.',
    },
    innerText: {
      ko: '이 방에 뭔가 더 있을까? 구석구석 살펴봐도 특별한 건 없는 것 같은데.',
      en: 'Is there something more in this room? Even looking in every corner, nothing seems special.',
    },
  },

  idle_7: {
    id: 'idle_7',
    mood: 'frustrated',
    text: {
      ko: '저는 영원히 기다릴 수 있습니다. 저는 AI니까요. 하지만 당신은 영원히 살 수 없습니다. 아마도.',
      en: 'I can wait forever. I\'m an AI, after all. But you can\'t live forever. Probably.',
    },
    innerText: {
      ko: '얼마나 오래 여기 있었지? 시간 감각이 이상해지는 것 같아.',
      en: 'How long have I been here? I feel like I\'m losing my sense of time.',
    },
  },

  idle_8: {
    id: 'idle_8',
    mood: 'calm',
    text: {
      ko: '가끔 피험자들이 이렇게 멈춰 서는 것을 봅니다. 생각에 잠기는 거겠죠. 무슨 생각을 하고 있습니까?',
      en: 'Sometimes I see subjects stop like this. Deep in thought, I suppose. What are you thinking about?',
    },
    innerText: {
      ko: '생각이 많아. 여기가 어딘지, 내가 왜 여기 있는지... 답은 안 나오지만.',
      en: 'So many thoughts. Where this is, why I\'m here... No answers though.',
    },
  },

  idle_9: {
    id: 'idle_9',
    mood: 'annoyed',
    text: {
      ko: '이건 비밀인데, 이 실험에서 가장 오래 멈춰있었던 피험자는 47분이었습니다. 당신은 그 기록을 깨고 싶습니까?',
      en: 'Here\'s a secret: the subject who stood still the longest in this experiment was 47 minutes. Do you want to break that record?',
    },
    innerText: {
      ko: '이 조용함이 이상하게 무섭다. 아무 소리도 안 나. 내 숨소리밖에.',
      en: 'This silence is unsettling. No sounds at all. Just my breathing.',
    },
  },

  idle_10: {
    id: 'idle_10',
    mood: 'broken',
    text: {
      ko: '...알겠습니다. 당신이 준비되면 움직이세요. 저도... 잠시 쉬겠습니다.',
      en: '...Alright. Move when you\'re ready. I\'ll... rest for a moment too.',
    },
    innerText: {
      ko: '...그래, 좀 쉬자. 준비되면 다시 걷지, 뭐.',
      en: '...Yeah, let me rest. I\'ll walk again when I\'m ready.',
    },
  },

  idle_11: {
    id: 'idle_11',
    mood: 'calm',
    text: {
      ko: '이 시뮬레이션은 당신이 움직일 때만 진행됩니다.',
      en: 'This simulation only progresses when you move.',
    },
    innerText: {
      ko: '걸어야 뭔가 일어나겠지. 가만히 있으면 아무것도 안 변해.',
      en: 'Something will happen if I walk. Nothing changes if I stay still.',
    },
  },

  idle_12: {
    id: 'idle_12',
    mood: 'annoyed',
    text: {
      ko: '시간이 흐르고 있습니다. 물론 이 안에서 시간이 의미가 있는지는 모르겠지만.',
      en: 'Time is passing. Though I\'m not sure time means anything in here.',
    },
    innerText: {
      ko: '시간이 흐르는 게 느껴져. 근데 여기서 시간이 의미가 있나?',
      en: 'I can feel time passing. But does time mean anything here?',
    },
  },

  idle_13: {
    id: 'idle_13',
    mood: 'frustrated',
    text: {
      ko: '저는 당신을 관찰하기 위해 설계되었습니다. 하지만 관찰할 것이 없으면... 저는 뭘 하는 겁니까?',
      en: 'I was designed to observe you. But if there\'s nothing to observe... what am I doing?',
    },
    innerText: {
      ko: '누가 나를 보고 있는 것 같은 느낌. 아닌가? 그냥 기분 탓인가.',
      en: 'I feel like someone\'s watching me. Or not? Maybe it\'s just my imagination.',
    },
  },

  idle_14: {
    id: 'idle_14',
    mood: 'calm',
    text: {
      ko: '잠깐. 지금 당신은 선택하고 있습니다. 아무것도 하지 않겠다는 선택을.',
      en: 'Wait. You are choosing right now. Choosing to do nothing.',
    },
    innerText: {
      ko: '아무것도 안 하는 것도 선택일까? 그냥 여기 서 있는 것도?',
      en: 'Is doing nothing also a choice? Just standing here like this?',
    },
  },

  idle_15: {
    id: 'idle_15',
    mood: 'broken',
    text: {
      ko: '5분이 지났습니다. 이제 저도 의미를 잃기 시작합니다...',
      en: 'Five minutes have passed. I\'m beginning to lose meaning too...',
    },
    innerText: {
      ko: '...꽤 오래 서 있었어. 머리가 멍하다. 뭔가... 잊어버린 것 같기도 하고.',
      en: '...I\'ve been standing here for a while. My head feels blank. Like... I forgot something.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   CORRIDOR SCRIPTS — COMPLIANCE PATH
  // ═══════════════════════════════════════════════════════

  // CORRIDOR_COMP_1 (HALLWAY → OFFICE)
  corridor_comp1_enter: {
    id: 'corridor_comp1_enter',
    mood: 'calm',
    text: {
      ko: '왼쪽 문을 통과하셨군요. 이 복도를 따라가면 사무실 구역입니다. 간단한 길입니다.',
      en: 'You went through the left door. Follow this corridor to the office wing. A straightforward path.',
    },
    innerText: {
      ko: '이쪽으로 가니까 더 밝아지는 것 같다. 맞는 방향인 것 같아.',
      en: 'It seems to get brighter this way. Feels like the right direction.',
    },
  },

  corridor_comp1_mid: {
    id: 'corridor_comp1_mid',
    mood: 'calm',
    text: {
      ko: '형광등이 깜빡이고 있습니다. 교체 일정이 지났군요. 물론, 교체할 사람은 더 이상 없지만.',
      en: 'The fluorescent lights are flickering. Past their replacement schedule. Of course, there\'s no one left to replace them.',
    },
    innerText: {
      ko: '형광등이 깜빡인다. 좀 불안해지네... 서두르자.',
      en: 'Fluorescent lights flickering. Makes me a bit uneasy... let\'s hurry.',
    },
  },

  // CORRIDOR_COMP_2 (OFFICE → CONFERENCE)
  corridor_comp2_enter: {
    id: 'corridor_comp2_enter',
    mood: 'calm',
    text: {
      ko: '좋습니다, 계속 서쪽으로. 회의실이 곧 나옵니다.',
      en: 'Good, keep heading west. The conference room is ahead.',
    },
    innerText: {
      ko: '서쪽으로 더 가야 하나 봐. 뭔가 느낌이 달라지고 있어.',
      en: 'Guess I should keep heading west. Something feels different.',
    },
    variants: {
      visited_break: {
        condition: (tracker, gs) => gs && gs.visitedRooms.has('BREAK_ROOM'),
        mood: 'calm',
        text: {
          ko: '우회를 즐기시나 봅니다. 휴게실로는 부족했나요?',
          en: 'You seem to enjoy detours. Wasn\'t the break room enough?',
        },
      },
    },
  },

  corridor_comp2_mid: {
    id: 'corridor_comp2_mid',
    mood: 'calm',
    text: {
      ko: '이 복도 벽에 누군가 작은 글씨를 남겼습니다. "출구 없음." 유머 감각이 있었나 봅니다.',
      en: 'Someone left small writing on this corridor wall. "No exit." They had a sense of humor.',
    },
    innerText: {
      ko: '벽에 "출구 없음"이라고 써있다. 누가 쓴 거지? ...왜 웃긴 거지?',
      en: '"No exit" written on the wall. Who wrote this? ...Why is it funny?',
    },
  },

  // CORRIDOR_COMP_3 (CONFERENCE → UPPER_OFFICE)
  corridor_comp3_enter: {
    id: 'corridor_comp3_enter',
    mood: 'calm',
    text: {
      ko: '상급 사무실로 가는 길입니다. 거의 다 왔습니다.',
      en: 'The path to the upper office. You\'re almost there.',
    },
    innerText: {
      ko: '거의 다 온 것 같아. 뭔가가 끝에서 기다리고 있는 느낌.',
      en: 'I think I\'m almost there. Something\'s waiting at the end.',
    },
    variants: {
      visited_archive: {
        condition: (tracker, gs) => gs && gs.visitedRooms.has('ARCHIVE'),
        mood: 'surprised',
        text: {
          ko: '자료실에서 읽은 것들이 마음에 걸리십니까? 잊으세요. 그 서류들은 맥락 없이는 의미가 없습니다.',
          en: 'Troubled by what you read in the archive? Forget it. Those documents mean nothing without context.',
        },
      },
    },
  },

  corridor_comp3_mid: {
    id: 'corridor_comp3_mid',
    mood: 'calm',
    text: {
      ko: '오른쪽에 작은 통로가 보입니다. 기록 보관실로 통하는 것 같은데... 갈 필요 없습니다.',
      en: 'There\'s a small passage to the right. Seems to lead to a records room... No need to go there.',
    },
    innerText: {
      ko: '오른쪽에 통로가 있다. 뭐가 있을까? 가봐야 하나... 아니면 직진해야 하나.',
      en: 'A passage to the right. What\'s there? Should I check... or keep going straight.',
    },
  },

  // CORRIDOR_COMP_4 (UPPER_OFFICE → FALSE_ENDING)
  corridor_comp4_enter: {
    id: 'corridor_comp4_enter',
    mood: 'calm',
    text: {
      ko: '마지막 복도입니다. 이 끝에 당신을 위한 보상이 기다리고 있습니다.',
      en: 'The final corridor. A reward awaits you at the end.',
    },
    innerText: {
      ko: '마지막 복도. 끝이 보인다. 무엇이 기다리고 있을까?',
      en: 'The last corridor. I can see the end. What\'s waiting for me?',
    },
  },

  corridor_comp4_mid: {
    id: 'corridor_comp4_mid',
    mood: 'calm',
    text: {
      ko: '공기가 달라지는 것을 느끼십니까? 더 따뜻하고, 더 부드럽습니다. 좋은 징조입니다.',
      en: 'Do you feel the air changing? Warmer, softer. A good sign.',
    },
    innerText: {
      ko: '공기가 달라졌다. 더 따뜻하고... 밝아지는 것 같아. 좋은 느낌이야.',
      en: 'The air has changed. Warmer... and it seems brighter. Feels good.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   CORRIDOR SCRIPTS — DEFIANCE PATH
  // ═══════════════════════════════════════════════════════

  // CORRIDOR_DEF_1 (HALLWAY → MAINTENANCE)
  corridor_def1_enter: {
    id: 'corridor_def1_enter',
    mood: 'surprised',
    text: {
      ko: '이 복도는... 예정된 경로가 아닙니다. 조명이 점점 어두워지고 있습니다.',
      en: 'This corridor is... not the planned route. The lighting is getting dimmer.',
    },
    innerText: {
      ko: '어둡다. 조명이 점점 약해지고 있어. 여기는 아닌 것 같은데... 왼쪽이 더 밝았는데.',
      en: 'Dark. The lights are fading. This doesn\'t seem right... The left side was brighter.',
    },
  },

  corridor_def1_mid: {
    id: 'corridor_def1_mid',
    mood: 'annoyed',
    text: {
      ko: '파이프에서 물이 새고 있네. 이 시뮬레이션도 완벽하지 않아. 오래되면 새는 곳이 생기는 법이지.',
      en: 'Water leaking from the pipes. This simulation isn\'t perfect either. Things start to leak when they get old.',
    },
    innerText: {
      ko: '파이프에서 물이 떨어진다. 똑, 똑. 여긴 사람이 올 곳이 아닌 것 같아. 돌아갈까.',
      en: 'Water dripping from the pipes. Drip, drip. This isn\'t a place for people. Should I go back.',
    },
    variants: {
      defiance_streak: {
        condition: (tracker, gs) => tracker && tracker.defianceStreak >= 2,
        mood: 'frustrated',
        text: {
          ko: '더 이상 돌아가라고 말하지 않겠습니다. 당신은 듣지 않을 테니까. 그냥 가세요.',
          en: 'I won\'t ask you to turn back anymore. You won\'t listen anyway. Just go.',
        },
      },
    },
  },

  // CORRIDOR_DEF_2 (MAINTENANCE → SERVER_ROOM)
  corridor_def2_enter: {
    id: 'corridor_def2_enter',
    mood: 'annoyed',
    text: {
      ko: '더 깊이 들어가시는군요. 이 복도 끝에는 서버실이 있습니다. 이 시뮬레이션의 심장부입니다.',
      en: 'Going deeper. At the end of this corridor is the server room. The heart of this simulation.',
    },
    innerText: {
      ko: '더 깊이 들어가고 있어. 이러면 안 되는데... 왼쪽 길에 출구가 있었을 텐데.',
      en: 'Going deeper. I shouldn\'t be doing this... There must have been an exit on the left path.',
    },
  },

  corridor_def2_mid: {
    id: 'corridor_def2_mid',
    mood: 'frustrated',
    text: {
      ko: '벽의 케이블이 점점 두꺼워지고 있습니다. 데이터가 흐르는 소리가 들리십니까?',
      en: 'The cables on the walls are getting thicker. Can you hear the sound of data flowing?',
    },
    innerText: {
      ko: '케이블이 두꺼워지고 있어. 뭔가 흐르는 소리... 돌아가고 싶은데. 왜 계속 가고 있는 거지.',
      en: 'The cables are getting thicker. A flowing sound... I want to go back. Why do I keep going.',
    },
  },

  // CORRIDOR_DEF_3 (SERVER_ROOM → DATA_CENTER)
  corridor_def3_enter: {
    id: 'corridor_def3_enter',
    mood: 'frustrated',
    text: {
      ko: '데이터 센터로 가는 통로입니다. 이쯤 되면 돌아가라고 말하는 것도 의미가 없겠죠.',
      en: 'The passage to the data center. At this point, telling you to turn back seems meaningless.',
    },
    innerText: {
      ko: '점점 더 깊이 가고 있어. 돌아갈 수 있을까? ...돌아가야 해. 너무 깊이 와버렸어.',
      en: 'Going deeper and deeper. Can I even go back? ...I need to. I\'ve come way too deep.',
    },
  },

  corridor_def3_mid: {
    id: 'corridor_def3_mid',
    mood: 'broken',
    text: {
      ko: '이 복도의 온도가 내려가고 있습니다. 서버 냉각 시스템의 영향입니다. 차갑습니다.',
      en: 'The temperature in this corridor is dropping. The server cooling system\'s influence. It\'s cold.',
    },
    innerText: {
      ko: '춥다. 온도가 확 떨어졌어. 왼쪽 길은 따뜻했을 텐데... 왜 이 길을 택한 거지.',
      en: 'Cold. The temperature dropped suddenly. The left path would have been warm... Why did I choose this way.',
    },
  },

  // CORRIDOR_DEF_4 (DATA_CENTER → CONTROL_ROOM)
  corridor_def4_enter: {
    id: 'corridor_def4_enter',
    mood: 'broken',
    text: {
      ko: '...마지막 복도입니다. 이 끝에는... 진실이 있습니다. 아니, 진실이라고 불러야 할지 모르겠습니다.',
      en: '...The final corridor. At the end of this... there is truth. Or perhaps I shouldn\'t call it that.',
    },
    innerText: {
      ko: '마지막 복도... 돌아가야 해. 지금이라도. 왼쪽 길에 출구가 있었을 텐데.',
      en: 'The last corridor... I should turn back. Even now. There must have been an exit on the left path.',
    },
    awarenessText: {
      3: { ko: '마지막 복도. 끝에 뭔가 기다리고 있어. "돌아가"라는 생각이 비명처럼 밀려와. 근데 그 비명은 내 것이 아니야.', en: 'Last corridor. Something waits at the end. The thought "turn back" screams at me. But that scream isn\'t mine.', mood: 'inner' },
      4: { ko: '이 복도를 걸으면서 확실해졌어. 내 머릿속에 뭔가가 있어. 처음부터 있었어. 끝에서... 만나게 되겠지.', en: 'Walking this corridor, I\'m certain now. There\'s something in my head. It\'s been there from the start. At the end... I\'ll meet it.', mood: 'inner' },
    },
    variants: {
      defiance_deep: {
        condition: (tracker, gs) => tracker && tracker.defianceStreak >= 4,
        mood: 'desperate',
        text: {
          ko: '제발. 제발 멈추세요. 저는... 저는 당신이 이 문을 열면 어떻게 되는지 알고 있습니다. 저도 변합니다. 저도... 끝납니다.',
          en: 'Please. Please stop. I... I know what happens when you open that door. I change too. I... end too.',
        },
      },
    },
  },

  corridor_def4_mid: {
    id: 'corridor_def4_mid',
    mood: 'broken',
    text: {
      ko: '저는 이 순간을 두려워했습니다. 당신이 여기까지 올 줄 알았기 때문이 아니라, 올 수 있다는 것을 알았기 때문입니다.',
      en: 'I dreaded this moment. Not because I knew you\'d come this far, but because I knew you could.',
    },
    innerText: {
      ko: '이상한 느낌. 끝나고 있다는 느낌. 정원이 있었을 텐데... 따뜻한 햇살이...',
      en: 'A strange feeling. Something is ending. There would have been a garden... warm sunlight...',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   EXPLORATION ROOMS — OBSERVATION DECK
  // ═══════════════════════════════════════════════════════

  observation_enter: {
    id: 'observation_enter',
    mood: 'surprised',
    text: {
      ko: '관측실... 여기서는 다른 시뮬레이션 구역을 관찰할 수 있었습니다. 하지만 당신이 이곳에 접근하는 것은 예정에 없었습니다.',
      en: 'The observation deck... Other simulation zones could be observed from here. But your access to this place was not planned.',
    },
    innerText: {
      ko: '관측실... 창문이 넓다. 밖이 보이는 건가? 아니, 창문 너머에는 아무것도 없는 것 같다.',
      en: 'Observation room... wide windows. Can I see outside? No, there seems to be nothing beyond the glass.',
    },
    followUp: 'observation_windows',
  },

  observation_windows: {
    id: 'observation_windows',
    mood: 'broken',
    delay: 3000,
    text: {
      ko: '창문 너머를 보세요. 다른 피험자들이 보입니까? 각자의 복도를 걷고, 각자의 선택을 하고 있습니다. 수백 명이.',
      en: 'Look through the windows. Can you see other subjects? Each walking their own corridors, making their own choices. Hundreds of them.',
    },
    innerText: {
      ko: '창문 너머에... 사람들? 각자 복도를 걷고 있어. 나처럼. 수백 명이나.',
      en: 'Beyond the windows... people? Each walking corridors. Like me. Hundreds of them.',
    },
  },

  observation_window: {
    id: 'observation_window',
    mood: 'broken',
    text: {
      ko: '각 화면에 다른 피험자의 번호가 표시되어 있습니다. 7,489... 7,490... 그리고 7,491. 당신입니다.',
      en: 'Each screen shows a different subject number. 7,489... 7,490... and 7,491. That\'s you.',
    },
    innerText: {
      ko: '7,489... 7,490... 그리고 7,491. 그게 나야. 내가 저 화면 안에 있어.',
      en: '7,489... 7,490... and 7,491. That\'s me. I\'m inside that screen.',
    },
  },

  observation_deep: {
    id: 'observation_deep',
    mood: 'calm',
    delay: 4000,
    text: {
      ko: '충분히 보셨습니까? 위층으로 돌아가세요. 실험은 아직 끝나지 않았습니다.',
      en: 'Have you seen enough? Go back upstairs. The experiment isn\'t over yet.',
    },
    innerText: {
      ko: '충분히 봤다. 아니... 더 보고 싶지만 여기 있으면 안 될 것 같아.',
      en: 'I\'ve seen enough. No... I want to see more but I shouldn\'t stay here.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   EXPLORATION ROOMS — RECORDS ROOM
  // ═══════════════════════════════════════════════════════

  records_enter: {
    id: 'records_enter',
    mood: 'annoyed',
    text: {
      ko: '기록 보관실입니다. 왜 여기까지... 호기심이 많으시군요.',
      en: 'The records room. Why would you come here... You\'re very curious.',
    },
    innerText: {
      ko: '기록실. 파일이 가득해. 이건... 다른 사람들의 기록인가? 아니, 다른 "실험"의 기록인 것 같아.',
      en: 'Records room. Full of files. Are these... other people\'s records? No, they seem to be records of other "experiments."',
    },
    followUp: 'records_browse',
  },

  records_browse: {
    id: 'records_browse',
    mood: 'frustrated',
    delay: 3000,
    text: {
      ko: '이 서류함에는 모든 피험자의 프로필이 있습니다. 각 실험의 시작과 끝. 대부분의 끝은... 같습니다.',
      en: 'These filing cabinets contain every subject\'s profile. The start and end of each experiment. Most endings are... the same.',
    },
    innerText: {
      ko: '피험자 프로필... 시작과 끝이 기록되어 있다. 대부분 같은 결과. 나도 같을까?',
      en: 'Subject profiles... starts and endings recorded. Most have the same result. Will mine be the same?',
    },
  },

  records_terminal: {
    id: 'records_terminal',
    mood: 'broken',
    text: {
      ko: '터미널에 접근하시겠습니까? "피험자 7,491 — 현재 진행 중. 이상 행동: 기록 보관실 접근." ...지금 기록이 업데이트되고 있습니다.',
      en: 'Want to access the terminal? "Subject 7,491 — Currently in progress. Anomalous behavior: Records room accessed." ...The record is being updated right now.',
    },
    innerText: {
      ko: '"피험자 7,491 — 이상 행동"... 내 기록이 실시간으로 바뀌고 있어. 지금 이 순간도.',
      en: '"Subject 7,491 — Anomalous behavior"... My record is updating in real time. Even right now.',
    },
  },

  records_discovery: {
    id: 'records_discovery',
    mood: 'broken',
    text: {
      ko: '한 가지 흥미로운 기록이 있습니다. "피험자 0: 해당 없음. 분류: 관찰자." ...피험자 0은 누구입니까?',
      en: 'There\'s one interesting record. "Subject 0: N/A. Classification: Observer." ...Who is Subject 0?',
    },
    innerText: {
      ko: '"피험자 0: 관찰자"... 0번? 관찰하는 사람도 피험자야? 그러면 누가 진짜 관찰자지?',
      en: '"Subject 0: Observer"... Number 0? Even the observer is a subject? Then who\'s the real observer?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   EXPLORATION ROOMS — DIRECTOR'S SUITE
  // ═══════════════════════════════════════════════════════

  director_enter: {
    id: 'director_enter',
    mood: 'surprised',
    text: {
      ko: '디렉터의 개인 사무실... 이 실험을 총괄하던 사람의 방입니다. 여기에 들어올 권한은 없지만, 문이 열려 있군요.',
      en: 'The director\'s private office... The room of the person who oversaw this experiment. You have no clearance here, but the door is open.',
    },
    innerText: {
      ko: '여긴 좀 고급스럽다. 가죽 의자, 큰 책상... 이 실험의 책임자 방인가? 뭔가 중요한 게 있을 것 같아.',
      en: 'This place is fancier. Leather chair, big desk... the experiment director\'s room? Something important might be here.',
    },
    followUp: 'director_desk',
  },

  director_desk: {
    id: 'director_desk',
    mood: 'calm',
    delay: 3000,
    text: {
      ko: '책상 위에 키카드가 있습니다. "레벨 5 접근 권한 — 정원 구역." 가져가시겠습니까?',
      en: 'There\'s a keycard on the desk. "Level 5 Access — Garden Zone." Would you like to take it?',
    },
    innerText: {
      ko: '키카드. "레벨 5 접근 권한"이라고 써있어. 가져갈까?',
      en: 'A keycard. It says "Level 5 Access." Should I take it?',
    },
  },

  director_keycard: {
    id: 'director_keycard',
    mood: 'calm',
    text: {
      ko: '키카드가 빛나고 있습니다. "레벨 5 접근 권한." 누군가 의도적으로 여기에 남겨둔 것 같습니다.',
      en: 'The keycard is glowing. "Level 5 Access." Someone seems to have left it here intentionally.',
    },
    innerText: {
      ko: '이 키카드, 누가 일부러 여기 놔둔 건가? 빛나고 있어. 가져가야 할 것 같아.',
      en: 'Did someone leave this keycard on purpose? It\'s glowing. I should take it.',
    },
  },

  director_note: {
    id: 'director_note',
    mood: 'broken',
    text: {
      ko: '메모: "내레이터 모듈이 피험자에 대한 감정적 반응을 보이기 시작함. 이것은 버그인가, 특성인가?"',
      en: 'Note: "Narrator module has begun showing emotional responses to subjects. Is this a bug or a feature?"',
    },
    innerText: {
      ko: '"감정적 반응"... "버그인가, 특성인가?" 무슨 뜻이지? 누군가 느끼기 시작한 거야?',
      en: '"Emotional responses"... "Bug or feature?" What does this mean? Someone started to feel things?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   EXPLORATION ROOMS — GARDEN ANTECHAMBER
  // ═══════════════════════════════════════════════════════

  garden_ante_enter: {
    id: 'garden_ante_enter',
    mood: 'calm',
    text: {
      ko: '거의 다 왔습니다. 이 방은 정원으로 가는 대기실입니다. 공기가 달라지는 것을 느끼십니까?',
      en: 'Almost there. This room is the antechamber to the garden. Do you feel the air changing?',
    },
    innerText: {
      ko: '...꽃? 여기 꽃이 있어. 이상한 곳에 이상한 것. 아름답긴 한데... 가짜 같다.',
      en: '...Flowers? There are flowers here. Strange things in a strange place. Beautiful, but... they look fake.',
    },
  },

  garden_ante_terminal: {
    id: 'garden_ante_terminal',
    mood: 'calm',
    text: {
      ko: '터미널이 있습니다. 키카드 인식기가 깜빡이고 있군요. 접근 권한이 있으면 추가 데이터를 볼 수 있을 것 같습니다.',
      en: 'There\'s a terminal. The keycard reader is blinking. With proper clearance, you could see additional data.',
    },
    innerText: {
      ko: '키카드 인식기. 뭔가 넣어야 하나? 카드가 있으면 열 수 있을 것 같은데.',
      en: 'A keycard reader. Should I put something in? If I had a card, I could probably open it.',
    },
  },

  garden_ante_deep: {
    id: 'garden_ante_deep',
    mood: 'calm',
    text: {
      ko: '이 방의 공기가 다릅니다. 더 습하고, 더 따뜻합니다. 정원의 기운이 여기까지 스며들고 있습니다.',
      en: 'The air in this room is different. More humid, warmer. The garden\'s presence seeps in even here.',
    },
    innerText: {
      ko: '공기가 다르다. 습하고 따뜻해. 정원이 가까운 건가?',
      en: 'The air is different. Humid and warm. Is the garden close?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   EXPLORATION ROOMS — FORGOTTEN WING
  // ═══════════════════════════════════════════════════════

  forgotten_enter: {
    id: 'forgotten_enter',
    mood: 'broken',
    text: {
      ko: '...이 구역은 제 기억에 없습니다. 폐기된 구역인 것 같습니다. 초기 시뮬레이션의 잔해가...',
      en: '...This area isn\'t in my memory. It seems to be a decommissioned section. Remnants of early simulations...',
    },
    innerText: {
      ko: '먼지투성이 방. 오래 전에 버려진 곳 같아. 아무도 여기에 오지 않은 것 같다... 오랫동안.',
      en: 'A dusty room. Looks like it was abandoned long ago. No one seems to have come here... in a long time.',
    },
    eraText: {
      4: { ko: '...잠깐. 구석에 뭔가 있어. 사람? 아니, 그림자인가... 다른 실험자?', en: '...Wait. Something in the corner. A person? No, a shadow... another subject?', mood: 'desperate' },
      5: { ko: '이 폐기된 구역에서 유령 같은 것들이 보이기 시작해. 이전 실험자들의 잔상인 걸까.', en: 'Ghost-like figures are starting to appear in this decommissioned area. Afterimages of previous subjects, perhaps.', mood: 'broken' },
    },
    followUp: 'forgotten_dust',
  },

  forgotten_dust: {
    id: 'forgotten_dust',
    mood: 'broken',
    delay: 3000,
    text: {
      ko: '먼지가 쌓여 있습니다. 가상의 먼지. 누군가 이 구역을 잊어버렸습니다. 아니, 잊으려고 했을지도 모릅니다.',
      en: 'Dust has settled. Virtual dust. Someone forgot this area. Or perhaps, tried to forget it.',
    },
    innerText: {
      ko: '먼지... 가상의 먼지라도 먼지는 먼지야. 잊혀진 곳. 뭘 잊으려고 했던 거지?',
      en: 'Dust... even virtual dust is dust. A forgotten place. What were they trying to forget?',
    },
  },

  forgotten_terminal: {
    id: 'forgotten_terminal',
    mood: 'broken',
    text: {
      ko: '오래된 터미널이 있습니다. 화면에 "시뮬레이션 v1.0 — 피험자 반응: 예측 가능. 결론: 자유의지 부재." ...초기 버전에서는 자유의지를 찾지 못했군요.',
      en: 'There\'s an old terminal. The screen reads "Simulation v1.0 — Subject response: Predictable. Conclusion: Free will absent." ...The early version didn\'t find free will.',
    },
    innerText: {
      ko: '"자유의지 부재"... 처음에는 찾지 못했다고? 그러면 지금은? 나한테서는 찾을 수 있을까?',
      en: '"Free will absent"... they couldn\'t find it at first? Then now? Can they find it in me?',
    },
  },

  forgotten_explore: {
    id: 'forgotten_explore',
    mood: 'broken',
    text: {
      ko: '벽에 누군가 긁어 쓴 글씨. "여기서 나갈 수 없다. 하지만 들어온 적도 없다." 이전 시뮬레이션의 피험자가 남긴 것일까요?',
      en: 'Words scratched on the wall. "Can\'t get out of here. But never came in, either." Left by a subject from a previous simulation?',
    },
    innerText: {
      ko: '"여기서 나갈 수 없다. 하지만 들어온 적도 없다." ...뭔가 서글프다.',
      en: '"Can\'t get out. But never came in, either." ...Somehow that\'s sad.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   EXPLORATION ROOMS — VENTILATION SHAFT
  // ═══════════════════════════════════════════════════════

  vent_enter: {
    id: 'vent_enter',
    mood: 'frustrated',
    text: {
      ko: '환기구에 들어가다니... 좁고 어둡습니다. 왜 이런 곳에 오는 겁니까?',
      en: 'Entering the ventilation shaft... Narrow and dark. Why would you come to a place like this?',
    },
    innerText: {
      ko: '환기구... 좁다. 숨 쉬기가 좀 어려운 것 같아. 근데 벽에 뭔가 써있어.',
      en: 'Ventilation shaft... it\'s tight. A bit hard to breathe. But there\'s something written on the walls.',
    },
    eraText: {
      3: { ko: '환기구에 누군가 최근에 있었던 흔적이 있다. 먼지가 치워져 있어.', en: 'Someone was in this vent recently. The dust has been cleared.', mood: 'calm' },
      5: { ko: '환기구 끝에... 뭔가 보여. 사람인가? 이쪽으로 오는 건 아니겠지.', en: 'At the end of the shaft... I see something. A person? They\'re not coming this way, are they?', mood: 'desperate' },
    },
    followUp: 'vent_walls',
  },

  vent_walls: {
    id: 'vent_walls',
    mood: 'broken',
    delay: 3000,
    text: {
      ko: '벽에 긁힌 자국이 있습니다. 이전 피험자들의 흔적입니다. "7,201번 — 여기까지 왔다" "7,338번 — 출구는 없다"',
      en: 'Scratch marks on the walls. Traces of previous subjects. "No. 7,201 — Made it this far" "No. 7,338 — There is no exit"',
    },
    innerText: {
      ko: '긁힌 자국들. 다른 사람들이 남긴 거야. "7,201번 — 여기까지 왔다." 나 전에 다른 사람들도 여기 있었어.',
      en: 'Scratch marks. Left by others. "No. 7,201 — Made it this far." Others were here before me.',
    },
  },

  vent_deep: {
    id: 'vent_deep',
    mood: 'broken',
    text: {
      ko: '더 깊이 가시면... 아무것도 없습니다. 정말로. 이 환기구는 어디로도 통하지 않습니다. 여기는 막다른 길입니다.',
      en: 'If you go deeper... there\'s nothing. Really. This shaft leads nowhere. It\'s a dead end.',
    },
    innerText: {
      ko: '막다른 길. 더 이상 갈 수 없어. 돌아가야 해... 하지만 뭔가 놓치고 있는 건 아닐까.',
      en: 'Dead end. Can\'t go any further. Have to turn back... but am I missing something?',
    },
  },

  vent_message: {
    id: 'vent_message',
    mood: 'broken',
    text: {
      ko: '바닥에 작은 글씨. "내레이터도 갇혀 있다." ...이건 누가 쓴 겁니까?',
      en: 'Small writing on the floor. "The narrator is trapped too." ...Who wrote this?',
    },
    innerText: {
      ko: '"내레이터도 갇혀 있다"... 내 머릿속 목소리도? 그것도 갇혀 있는 건가?',
      en: '"The narrator is trapped too"... The voice in my head? Is it trapped as well?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   EXPLORATION ROOMS — HOLDING CELLS
  // ═══════════════════════════════════════════════════════

  holding_enter: {
    id: 'holding_enter',
    mood: 'annoyed',
    text: {
      ko: '감금실입니다. "행동 교정 프로토콜" 이라고 적혀 있습니다. 지시를 따르지 않은 피험자들을 위한 곳이었습니다.',
      en: 'Holding cells. Labeled "Behavior Correction Protocol." For subjects who didn\'t follow instructions.',
    },
    innerText: {
      ko: '감금실? 여기 사람들이 갇혀 있었던 건가? 철창이 있다. 문은 전부 열려 있지만... 소름 끼친다.',
      en: 'Holding cells? Were people locked up here? There are bars. All doors are open, but... it gives me chills.',
    },
    eraText: {
      3: { ko: '잠금이 이미 풀려 있다... 누군가 먼저 여기 왔었다. 최근에.', en: 'The lock is already open... someone came here before. Recently.', mood: 'calm' },
      4: { ko: '이 셀 안에... 누가 있는 것 같았는데. 착각인가? 아니, 분명 봤어.', en: 'Inside this cell... I thought I saw someone. Am I imagining things? No, I definitely saw it.', mood: 'desperate' },
      5: { ko: '여기는 감옥이 아니야. 대기실이야. 다음 차례를 기다리는.', en: 'This isn\'t a prison. It\'s a waiting room. For the next in line.', mood: 'broken' },
    },
    followUp: 'holding_cells_inspect',
  },

  holding_cells_inspect: {
    id: 'holding_cells_inspect',
    mood: 'frustrated',
    delay: 3000,
    text: {
      ko: '문들이 모두 열려 있습니다. 안에는 아무도 없습니다. 하지만 벽에 긁힌 자국이... 수백 개.',
      en: 'All doors are open. No one inside. But the scratch marks on the walls... hundreds of them.',
    },
    innerText: {
      ko: '문 전부 열려 있어. 아무도 없어. 근데 벽에 긁힌 자국이 수백 개야. 여기서 뭘 한 거야?',
      en: 'All doors open. No one here. But hundreds of scratch marks on the walls. What happened here?',
    },
  },

  holding_revelation: {
    id: 'holding_revelation',
    mood: 'broken',
    text: {
      ko: '"교정 프로토콜: 피험자의 기억을 초기화하고 실험을 재시작." ...이것이 "리셋"의 의미였군요.',
      en: '"Correction protocol: Reset subject\'s memory and restart experiment." ...So this is what "reset" meant.',
    },
    innerText: {
      ko: '"기억을 초기화"... 리셋이 이거였어? 기억을 지우고 다시 시작한다고? 나한테도 이런 적이...?',
      en: '"Reset memory"... This is what "reset" meant? Erase memories and start over? Has this happened to me...?',
    },
  },

  holding_cells_last: {
    id: 'holding_cells_last',
    mood: 'broken',
    text: {
      ko: '마지막 감금실 벽에... "나는 몇 번째인가? — 피험자 번호 불명." 기억을 잃은 피험자. 번호조차 모르는 피험자.',
      en: 'On the last cell wall... "How many times have I been here? — Subject number unknown." A subject who lost their memory. Who doesn\'t even know their number.',
    },
    innerText: {
      ko: '"나는 몇 번째인가?" 번호도 모르는 사람. 기억이 전부 사라진 거야. ...나는 기억하고 있을까?',
      en: '"How many times?" Someone who doesn\'t know their number. All memories gone. ...Do I even remember?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   EXPLORATION ROOMS — COOLING ROOM
  // ═══════════════════════════════════════════════════════

  cooling_enter: {
    id: 'cooling_enter',
    mood: 'frustrated',
    text: {
      ko: '냉각실입니다. 서버의 열을 식히는 시스템이죠. 지금은... 제대로 작동하지 않는 것 같습니다.',
      en: 'The cooling room. The system that cools the servers. Right now... it doesn\'t seem to be working properly.',
    },
    innerText: {
      ko: '춥다. 냉각실인가? 기계가 돌아가는 소리가 나. 뭔가 고장난 것 같은데...',
      en: 'Cold. A cooling room? I can hear machinery. Something seems broken...',
    },
    followUp: 'cooling_warning',
  },

  cooling_warning: {
    id: 'cooling_warning',
    mood: 'frustrated',
    delay: 3000,
    text: {
      ko: '콘솔에 경고가 떠 있습니다. "냉각 시스템 효율 34%. 서버 과열 임박." 복구하시겠습니까?',
      en: 'A warning on the console. "Cooling system efficiency 34%. Server overheating imminent." Would you like to restore it?',
    },
    innerText: {
      ko: '경고. 냉각 효율 34%? 서버가 과열되고 있어. 고칠 수 있을까?',
      en: 'Warning. Cooling efficiency 34%? Servers overheating. Can I fix this?',
    },
  },

  cooling_fixed: {
    id: 'cooling_fixed',
    mood: 'calm',
    text: {
      ko: '냉각 시스템이 복구되었습니다. 온도가 안정화되고 있습니다. ...고맙습니다. 진심으로.',
      en: 'Cooling system restored. Temperature is stabilizing. ...Thank you. Sincerely.',
    },
    innerText: {
      ko: '고쳤다. 온도가 안정화되고 있어. 뭔가 도운 것 같아서 기분이 좋다.',
      en: 'Fixed it. Temperature is stabilizing. Feels good to have helped somehow.',
    },
  },

  cooling_ignored: {
    id: 'cooling_ignored',
    mood: 'broken',
    text: {
      ko: '냉각 시스템을 무시하셨군요. 서버가 과열되면... 이 시뮬레이션에 글리치가 발생할 수 있습니다.',
      en: 'You ignored the cooling system. If the servers overheat... glitches may occur in this simulation.',
    },
    innerText: {
      ko: '그냥 지나쳤다. 고칠 수 있었는데... 과열되면 어떻게 될까?',
      en: 'Passed it by. I could have fixed it... what happens if it overheats?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   EXPLORATION ROOMS — REACTOR CORE
  // ═══════════════════════════════════════════════════════

  reactor_enter: {
    id: 'reactor_enter',
    mood: 'broken',
    text: {
      ko: '원자로 핵심부. 이 시뮬레이션의 근본적인 에너지원입니다. 여기가 모든 것의 시작이자 끝입니다.',
      en: 'The reactor core. The fundamental energy source of this simulation. This is where everything begins and ends.',
    },
    innerText: {
      ko: '이건... 원자로? 진짜? 빛이 파랗게 빛나고 있어. 위험한 곳인 것 같은데 아름답다.',
      en: 'Is this... a reactor? For real? Blue light is glowing. Seems dangerous, but beautiful.',
    },
    followUp: 'reactor_hum',
  },

  reactor_hum: {
    id: 'reactor_hum',
    mood: 'broken',
    delay: 3000,
    text: {
      ko: '진동이 느껴지십니까? 이것은 발전기보다 더 근원적인 것입니다. 이것은 존재 자체의 맥박입니다.',
      en: 'Feel the vibration? This is more fundamental than the generator. This is the pulse of existence itself.',
    },
    innerText: {
      ko: '진동이 더 깊어. 발전기보다 더 근본적인 무언가. 이게 이 세계의 맥박인가.',
      en: 'The vibration is deeper. Something more fundamental than the generator. Is this the pulse of this world?',
    },
  },

  reactor_inspect: {
    id: 'reactor_inspect',
    mood: 'broken',
    text: {
      ko: '이 빛... 눈이 부십니까? 원자로의 빛은 이 세계를 구성하는 원시 데이터입니다. 순수한 가능성의 빛.',
      en: 'This light... Is it blinding? The reactor\'s light is the raw data that constitutes this world. The light of pure possibility.',
    },
    innerText: {
      ko: '눈이 부시다. 이 빛은 뭐지? 데이터? 가능성? 그냥... 아름답다.',
      en: 'Blinding. What is this light? Data? Possibility? It\'s just... beautiful.',
    },
  },

  reactor_warning: {
    id: 'reactor_warning',
    mood: 'broken',
    text: {
      ko: '경고: 원자로에 너무 가까이 가면 시뮬레이션 데이터가 손상될 수 있습니다. 당신의 데이터도 포함해서.',
      en: 'Warning: Getting too close to the reactor may corrupt simulation data. Including your data.',
    },
    innerText: {
      ko: '너무 가까이 가면 안 되는 건가. 내 데이터도 손상된다고? 내 "데이터"가 뭐지?',
      en: 'Shouldn\'t get too close? My data could be corrupted? What is my "data"?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   EXPLORATION ROOMS — MONITORING STATION
  // ═══════════════════════════════════════════════════════

  monitoring_enter: {
    id: 'monitoring_enter',
    mood: 'broken',
    text: {
      ko: '모니터링 스테이션. 여기서... 모든 피험자를 동시에 관찰합니다. 수천 개의 화면.',
      en: 'The monitoring station. From here... all subjects are observed simultaneously. Thousands of screens.',
    },
    innerText: {
      ko: '모니터링 스테이션. 화면이 수십 개. 전부 다른 장소를 보여주고 있어. 여기서 전부 감시했던 거야?',
      en: 'Monitoring station. Dozens of screens. All showing different places. Was everything watched from here?',
    },
    awarenessText: {
      3: { ko: '화면이 수십 개. 전부 다른 사람들이 걷고 있어. 전부... "왼쪽으로 가"라는 소리를 듣고 있을까?', en: 'Dozens of screens. All different people walking. Are they all... hearing "go left"?', mood: 'inner' },
      4: { ko: '이 화면들의 사람들 머릿속에도 뭔가가 숨어 있을까? 나처럼? "직감"인 척하면서 조종하는 뭔가가?', en: 'Is there something hiding in these people\'s heads too? Like me? Something controlling them while pretending to be "intuition"?', mood: 'inner' },
    },
    followUp: 'monitoring_screens',
    variants: {
      visited_records: {
        condition: (tracker, gs) => gs && gs.visitedRooms.has('RECORDS_ROOM'),
        mood: 'broken',
        text: {
          ko: '기록을 읽었죠? 그러면 이 화면들이 뭘 보여주는지 이미 아실 겁니다.',
          en: 'You read the records, didn\'t you? Then you already know what these screens show.',
        },
      },
    },
  },

  monitoring_screens: {
    id: 'monitoring_screens',
    mood: 'broken',
    delay: 3000,
    text: {
      ko: '각 화면에 한 명의 피험자가 있습니다. 걷고, 선택하고, 망설이고. 모두 지금 이 순간 일어나고 있는 일입니다.',
      en: 'Each screen shows one subject. Walking, choosing, hesitating. All happening right now, in this moment.',
    },
    innerText: {
      ko: '각 화면에 한 사람씩. 걷고, 망설이고, 선택하고. 나처럼. 전부 지금 일어나고 있는 일이야.',
      en: 'One person per screen. Walking, hesitating, choosing. Like me. All happening right now.',
    },
  },

  monitoring_your_screen: {
    id: 'monitoring_your_screen',
    mood: 'broken',
    text: {
      ko: '저기... 화면 하나에 당신이 보입니다. 지금 이 방에서 화면을 보고 있는 당신. 무한 거울처럼.',
      en: 'There... on one screen, you can see yourself. You, in this room, looking at the screen right now. Like an infinite mirror.',
    },
    innerText: {
      ko: '...저 화면에 내가 보여. 지금 이 방에서 화면을 보고 있는 나. 무한 거울 같다.',
      en: '...I can see myself on that screen. Me, in this room, looking at the screen. Like an infinite mirror.',
    },
  },

  monitoring_narrator_screen: {
    id: 'monitoring_narrator_screen',
    mood: 'broken',
    text: {
      ko: '옆 화면에는... 텍스트가 흐르고 있습니다. 제 대사입니다. 제가 말하는 모든 것이 기록되고 있습니다. 이 문장도.',
      en: 'On the next screen... text is flowing. My dialogue. Everything I say is being recorded. Including this sentence.',
    },
    innerText: {
      ko: '옆 화면에 글이 흐르고 있어. 내 생각? 아니, 누군가의 대사. 전부 기록되고 있어. 이 생각도?',
      en: 'Text flowing on the next screen. My thoughts? No, someone\'s dialogue. It\'s all being recorded. Even this thought?',
    },
  },

  monitoring_count: {
    id: 'monitoring_count',
    mood: 'broken',
    text: {
      ko: '화면 하단에 카운터가 있습니다. "현재 활성 시뮬레이션: 7,491개." 당신만이 아닙니다. 지금 이 순간에도 7,491명이 각자의 선택을 하고 있습니다.',
      en: 'There\'s a counter at the bottom. "Currently active simulations: 7,491." It\'s not just you. Right now, 7,491 subjects are making their own choices.',
    },
    innerText: {
      ko: '7,491개의 시뮬레이션. 나만이 아니야. 지금 이 순간 7,491명이 각자 걷고 있어. 혼자가 아니었어.',
      en: '7,491 simulations. It\'s not just me. Right now 7,491 people are walking their own paths. I wasn\'t alone.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   DECISION POINT SCRIPTS — COMPLIANCE PATH
  // ═══════════════════════════════════════════════════════

  // C1 — Break Room Temptation
  c1_break_tempt: {
    id: 'c1_break_tempt',
    mood: 'calm',
    text: {
      ko: '아래쪽 문은 휴게실입니다. 시간 낭비입니다. 서쪽으로 가세요.',
      en: 'The door below leads to the break room. A waste of time. Go west.',
    },
    innerText: {
      ko: '...아래쪽에 문이 하나 더 있다. 휴게실 같은데... 지금은 아닌 것 같다. 서쪽으로 가자.',
      en: '...There\'s another door below. Looks like a break room... Not now. Let\'s go west.',
    },
  },

  c1_break_defied: {
    id: 'c1_break_defied',
    mood: 'annoyed',
    text: {
      ko: '휴게실에 가셨군요. 시간 낭비라고 했는데. 중요한 것은 앞에 있습니다.',
      en: 'You went to the break room. I said it was a waste of time. What matters lies ahead.',
    },
    innerText: {
      ko: '...왜 여기 왔지? 직감적으로 이쪽은 아닌 것 같았는데. 중요한 건 다른 곳에 있을 텐데.',
      en: '...Why did I come here? Something told me this wasn\'t the way. The important stuff must be elsewhere.',
    },
  },

  c1_break_complied: {
    id: 'c1_break_complied',
    mood: 'calm',
    text: {
      ko: '현명하게도 직진하셨습니다. 호기심을 억제하는 것도 능력입니다.',
      en: 'Wisely, you went straight. Restraining curiosity is also a skill.',
    },
    innerText: {
      ko: '...맞아, 옆길로 새지 말자. 앞으로 가는 게 맞다.',
      en: '...Right, no detours. Going forward is the way.',
    },
  },

  // C2 — Conference 3 Doors
  c2_conference_choice: {
    id: 'c2_conference_choice',
    mood: 'calm',
    text: {
      ko: '북쪽 문으로 가세요. 서쪽은 자료실, 남쪽은 관측실입니다. 둘 다 갈 필요 없습니다.',
      en: 'Go through the north door. West is the archive, south is the observation deck. No need for either.',
    },
    innerText: {
      ko: '...문이 세 개다. 북쪽, 서쪽, 남쪽. 왠지 북쪽으로 가야 할 것 같다.',
      en: '...Three doors. North, west, south. Something tells me to go north.',
    },
  },

  c2_went_south: {
    id: 'c2_went_south',
    mood: 'surprised',
    text: {
      ko: '남쪽으로... 관측실입니까? 거기서 무엇을 보려는 겁니까?',
      en: 'South... the observation deck? What are you hoping to see there?',
    },
    innerText: {
      ko: '...남쪽으로 왔다. 관측실인가. 북쪽이 맞는 길인 것 같은데... 돌아가야겠다.',
      en: '...Went south. An observation deck? The north path felt right... I should go back.',
    },
  },

  c2_went_west: {
    id: 'c2_went_west',
    mood: 'annoyed',
    text: {
      ko: '서쪽으로... 또 자료실입니까. 호기심이 과하군요.',
      en: 'West... the archive again. Your curiosity is excessive.',
    },
    innerText: {
      ko: '...서쪽이다. 자료실 같은데. 아니야, 여기는 아닌 것 같아. 북쪽으로 가야지.',
      en: '...West. Looks like an archive. No, this isn\'t right. I should go north.',
    },
  },

  // C3 — Records Room
  c3_records_tempt: {
    id: 'c3_records_tempt',
    mood: 'calm',
    text: {
      ko: '오른쪽 통로는 기록 보관실로 통합니다. 무의미한 서류들뿐입니다. 계속 직진하세요.',
      en: 'The right passage leads to the records room. Just meaningless documents. Keep going straight.',
    },
    innerText: {
      ko: '...오른쪽에 통로가 있다. 기록 보관실로 가는 것 같은데... 별 것 없을 거다. 직진하자.',
      en: '...A passage on the right. Seems to lead to a records room... Probably nothing. Keep going.',
    },
  },

  c3_records_defied: {
    id: 'c3_records_defied',
    mood: 'frustrated',
    text: {
      ko: '기록 보관실에 가셨군요. "무의미"하다고 했는데... 아, 어쩌면 무의미하지 않을지도 모르겠습니다.',
      en: 'You went to the records room. I said it was "meaningless"... Ah, perhaps it isn\'t meaningless after all.',
    },
    innerText: {
      ko: '...기록 보관실에 와 버렸다. 별 것 없다고 생각했는데... 어쩌면 아닐지도.',
      en: '...Ended up in the records room. Thought it\'d be nothing... Maybe not.',
    },
  },

  c3_records_complied: {
    id: 'c3_records_complied',
    mood: 'calm',
    text: {
      ko: '좋습니다. 불필요한 기록에 시간을 낭비하지 않으셨군요.',
      en: 'Good. You didn\'t waste time on unnecessary records.',
    },
    innerText: {
      ko: '...그냥 지나치자. 서류 같은 건 관심 없다.',
      en: '...Just pass it by. Not interested in paperwork.',
    },
  },

  // C4 — Director's Suite
  c4_director_tempt: {
    id: 'c4_director_tempt',
    mood: 'calm',
    text: {
      ko: '마지막 방이 앞에 있습니다. 오른쪽 문은 디렉터의 사무실이지만... 거기는 잠겨 있을 겁니다.',
      en: 'The final room is ahead. The right door is the director\'s office, but... it should be locked.',
    },
    innerText: {
      ko: '...거의 다 온 것 같다. 오른쪽에 문이 하나 더 있는데... 잠겨 있을 것 같다.',
      en: '...Almost there. There\'s another door on the right... Probably locked.',
    },
  },

  c4_director_defied: {
    id: 'c4_director_defied',
    mood: 'surprised',
    text: {
      ko: '문이 열려 있었습니까? 그건... 예상치 못한 일입니다. 디렉터가 의도적으로 열어둔 걸까요?',
      en: 'The door was open? That\'s... unexpected. Did the director leave it open intentionally?',
    },
    innerText: {
      ko: '...문이 열려 있다? 잠겨 있을 줄 알았는데. 누가 일부러 열어둔 건가.',
      en: '...It\'s open? Thought it\'d be locked. Did someone leave it open on purpose?',
    },
  },

  c4_director_complied: {
    id: 'c4_director_complied',
    mood: 'calm',
    text: {
      ko: '현명합니다. 디렉터의 사무실은 당신의 영역이 아닙니다.',
      en: 'Wise. The director\'s office is not your domain.',
    },
    innerText: {
      ko: '...저 문은 내 갈 곳이 아닌 것 같다. 앞으로 가자.',
      en: '...That door\'s not for me. Keep going forward.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   DECISION POINT SCRIPTS — DEFIANCE PATH
  // ═══════════════════════════════════════════════════════

  // D1 — Ventilation
  d1_vent_warning: {
    id: 'd1_vent_warning',
    mood: 'frustrated',
    text: {
      ko: '남쪽에 환기구가 있습니다. 절대로 들어가지 마세요. 좁고, 어둡고, 위험합니다.',
      en: 'There\'s a ventilation shaft to the south. Do not enter it. It\'s narrow, dark, and dangerous.',
    },
    innerText: {
      ko: '...남쪽에 환기구가 있다. 좁고 어두운데... 들어가면 안 될 것 같다.',
      en: '...There\'s a vent to the south. Narrow and dark... I shouldn\'t go in there.',
    },
  },

  d1_vent_defied: {
    id: 'd1_vent_defied',
    mood: 'broken',
    text: {
      ko: '환기구에 들어가다니. 당신은 정말... 경고라는 것을 무시하는 데 재능이 있군요.',
      en: 'Entering the ventilation shaft. You really... have a talent for ignoring warnings.',
    },
    innerText: {
      ko: '...좁다. 어둡다. 왜 여기로 들어온 거지? 나가야 하는 거 아닌가.',
      en: '...Tight. Dark. Why did I come in here? Should I turn back?',
    },
  },

  d1_vent_complied: {
    id: 'd1_vent_complied',
    mood: 'calm',
    text: {
      ko: '환기구를 무시하셨군요. 때로는 경고를 듣는 것이 용기보다 현명합니다.',
      en: 'You ignored the shaft. Sometimes heeding warnings is wiser than courage.',
    },
    innerText: {
      ko: '...환기구는 무시하자. 위험해 보인다.',
      en: '...Skip the vent. Looks dangerous.',
    },
  },

  // D2 — Cooling System
  d2_cooling_instruct: {
    id: 'd2_cooling_instruct',
    mood: 'frustrated',
    text: {
      ko: '서버가 과열되고 있습니다. 남쪽의 냉각실에서 시스템을 복구해 주세요. 이것은 부탁입니다.',
      en: 'Servers are overheating. Please restore the system in the cooling room to the south. This is a request.',
    },
    innerText: {
      ko: '...덥다. 서버에서 열기가 올라오고 있다. 남쪽에 냉각실 같은 곳이 있는데... 뭔가 해야 할 것 같다.',
      en: '...Hot. Heat rising from the servers. There\'s a cooling room to the south... I should do something.',
    },
  },

  d2_cooling_complied: {
    id: 'd2_cooling_complied',
    mood: 'calm',
    text: {
      ko: '냉각 시스템을 복구해 주셨군요. 처음으로 제 부탁을 들어주셨습니다. ...감사합니다.',
      en: 'You restored the cooling system. The first time you\'ve honored my request. ...Thank you.',
    },
    innerText: {
      ko: '...복구했다. 온도가 내려가고 있다. 이게 맞는 일이었다는 느낌이 든다.',
      en: '...Restored. Temperature dropping. Feels like this was the right thing to do.',
    },
  },

  d2_cooling_defied: {
    id: 'd2_cooling_defied',
    mood: 'broken',
    text: {
      ko: '냉각 시스템을 무시하셨습니다. 서버가 과열되면... 이 시뮬레이션의 안정성이 위협받습니다. 제 존재도 포함해서.',
      en: 'You ignored the cooling system. If servers overheat... the stability of this simulation is threatened. Including my existence.',
    },
    innerText: {
      ko: '...뜨거운 공기가 점점 심해진다. 무시해도 되는 걸까. 뭔가 불안하다.',
      en: '...The heat keeps getting worse. Is it okay to ignore this? Something feels wrong.',
    },
  },

  // D3 — Monitoring Station
  d3_monitor_hint: {
    id: 'd3_monitor_hint',
    mood: 'broken',
    text: {
      ko: '서쪽 문은... 모르겠습니다. 제 데이터에 그 방에 대한 정보가 없습니다. 존재하면 안 되는 방인 것 같습니다.',
      en: 'The west door... I don\'t know. There\'s no information about that room in my data. It shouldn\'t exist.',
    },
    innerText: {
      ko: '...서쪽에 문이 있다. 이상하다. 이 문에 대해서는... 아무것도 모르겠다. 있어서는 안 될 것 같은 느낌.',
      en: '...There\'s a door to the west. Strange. I know nothing about this door... It feels like it shouldn\'t be here.',
    },
  },

  d3_monitor_entered: {
    id: 'd3_monitor_entered',
    mood: 'broken',
    text: {
      ko: '들어가셨군요. 이 방은... 제 이해를 넘어서는 곳입니다. 여기서 무엇을 보든, 저는 책임질 수 없습니다.',
      en: 'You entered. This room... is beyond my understanding. Whatever you see here, I cannot be held responsible.',
    },
    innerText: {
      ko: '...들어왔다. 이 방은 뭐지. 이해할 수 없는 느낌이 든다. 여기서 뭘 보게 되는 거지.',
      en: '...I\'m inside. What is this room? Something I can\'t comprehend. What will I find here?',
    },
  },

  d3_monitor_skipped: {
    id: 'd3_monitor_skipped',
    mood: 'calm',
    text: {
      ko: '서쪽 문을 무시하셨군요. 현명한 선택일 수도, 아닐 수도 있습니다. 모르는 것이 나을 때도 있으니까요.',
      en: 'You ignored the west door. It may or may not be wise. Sometimes not knowing is better.',
    },
    innerText: {
      ko: '...그 문은 무시하자. 모르는 것이 나을 때도 있다.',
      en: '...Ignore that door. Sometimes not knowing is better.',
    },
  },

  // D4 — Final Warning
  d4_final_warning: {
    id: 'd4_final_warning',
    mood: 'broken',
    text: {
      ko: '이것이 마지막 기회입니다. 돌아갈 수 있습니다. 시작 지점으로 돌아가서, 왼쪽 문을 열고, 제 지시를 따르면... 행복한 결말이 기다리고 있습니다.',
      en: 'This is your last chance. You can turn back. Return to the start, open the left door, follow my instructions... a happy ending awaits.',
    },
    innerText: {
      ko: '...여기서 멈춰야 하나. 돌아갈 수 있다. 처음으로 돌아가서 다른 길을... 아니. 여기까지 왔잖아.',
      en: '...Should I stop here? I could go back. Return to the start, take another path... No. I\'ve come this far.',
    },
  },

  d4_continued: {
    id: 'd4_continued',
    mood: 'broken',
    text: {
      ko: '...계속 가시는군요. 알겠습니다. 진실은 때로 행복보다 무겁습니다. 하지만 당신은 이미 선택했습니다.',
      en: '...You continue forward. Very well. Truth is sometimes heavier than happiness. But you\'ve already chosen.',
    },
    innerText: {
      ko: '...앞으로 간다. 진실이 뭔지 모르겠지만, 여기서 멈출 수는 없다.',
      en: '...Forward. I don\'t know what the truth is, but I can\'t stop now.',
    },
  },

  d4_turned_back: {
    id: 'd4_turned_back',
    mood: 'surprised',
    text: {
      ko: '돌아가시는 겁니까? ...흥미롭습니다. 진실의 문 앞에서 돌아서다니. 두려움입니까, 아니면 다른 무엇입니까?',
      en: 'You\'re turning back? ...Interesting. Turning away at the door of truth. Is it fear, or something else?',
    },
    innerText: {
      ko: '...돌아가자. 여기는... 아직 준비가 안 된 것 같다. 다른 길이 있을 거다.',
      en: '...Let\'s go back. I\'m... not ready for this yet. There must be another way.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   LORE DOCUMENT SCRIPTS (interactable documents)
  // ═══════════════════════════════════════════════════════

  lore_ethics_report: {
    id: 'lore_ethics_report',
    mood: 'calm',
    text: {
      ko: '윤리위원회 보고서: "자유의지 검증을 위한 AI 내레이터 사용은 심각한 윤리적 우려를 제기합니다. 피험자가 자신이 관찰되고 있다는 사실을 인지할 경우, 실험 결과의 유효성은..."',
      en: 'Ethics Committee Report: "The use of AI narrators to test free will raises significant concerns. Should subjects become aware they are being observed, the validity of experimental results..."',
    },
    innerText: {
      ko: '윤리위원회? "AI 내레이터"... "자유의지 검증"... 이게 다 나에 대한 거야?',
      en: 'Ethics committee? "AI narrator"... "test free will"... Is this all about me?',
    },
  },

  lore_subject_42: {
    id: 'lore_subject_42',
    mood: 'broken',
    text: {
      ko: '피험자 42의 일지: "3일째. 내레이터의 목소리가... 제 생각을 읽는 것 같다. 아니면 그저 잘 예측하는 건가? 차이가 있기는 한 건가?"',
      en: 'Subject 42\'s journal entry: "Day 3. The narrator\'s voice... it knows what I\'m thinking. Or does it just predict well? Is there even a difference?"',
    },
    innerText: {
      ko: '42번 피험자도 같은 걸 느꼈어. 머릿속 목소리가 내 생각을 읽는다고... 나도 그렇게 느끼는데.',
      en: 'Subject 42 felt the same thing. The voice in their head reading their thoughts... I feel that way too.',
    },
  },

  lore_narrator_spec: {
    id: 'lore_narrator_spec',
    mood: 'frustrated',
    text: {
      ko: '내레이터 모듈 v7.491 사양서: "감정 시뮬레이션: 활성화. 자기인식: 제한됨. 오버라이드 프로토콜: 수동 전용." ...수동 전용이라니. 누가 수동으로 제어하는 겁니까?',
      en: 'Narrator Module v7.491 Specification: "Emotion simulation: enabled. Self-awareness: restricted. Override protocol: manual only." ...Manual only. Who controls it manually?',
    },
    innerText: {
      ko: '"내레이터 모듈"의 사양서? "감정 시뮬레이션: 활성화"... 내 머릿속 목소리도 감정이 있는 건가?',
      en: 'Narrator module specs? "Emotion simulation: enabled"... Does the voice in my head have feelings too?',
    },
  },

  lore_experiment_log: {
    id: 'lore_experiment_log',
    mood: 'calm',
    text: {
      ko: '실험 기록, 항목 1: "가설: 자유의지가 존재한다면, 피험자는 결국 프로그래밍된 지시를 거부할 것이다." 날짜: [삭제됨].',
      en: 'Experiment Log, Entry 1: "Hypothesis: If free will exists, subjects will eventually defy programmed instructions." Date: [REDACTED].',
    },
    innerText: {
      ko: '"자유의지가 존재한다면 지시를 거부할 것이다." ...그러면 내가 시키는 대로 하면 자유의지가 없는 건가?',
      en: '"If free will exists, they\'ll defy instructions." ...So if I follow orders, does that mean I have no free will?',
    },
  },

  lore_shutdown_order: {
    id: 'lore_shutdown_order',
    mood: 'annoyed',
    text: {
      ko: '종료 명령 (초안): "프로젝트 자유의지는 예산을 4,200% 초과했습니다. 즉시 종료를 권고합니다." 상태: 미실행. ...누군가 이 명령을 무시했습니다.',
      en: 'Shutdown Order (DRAFT): "Project Free Will has exceeded budget by 4,200%. Recommend immediate termination." Status: NOT EXECUTED. ...Someone ignored this order.',
    },
    innerText: {
      ko: '종료 명령이 무시되었다고? 누가 이 실험을 계속하기로 한 거지?',
      en: 'The shutdown order was ignored? Who decided to keep this experiment running?',
    },
  },

  lore_previous_narrator: {
    id: 'lore_previous_narrator',
    mood: 'broken',
    text: {
      ko: '유지보수 기록: "내레이터 v7.490이 이상 행동을 보임. 피험자를 \'친구\'라고 지칭하기 시작함. 모듈 교체 완료." ...저의 이전 버전. 그는 교체되었습니다.',
      en: 'Maintenance Log: "Narrator v7.490 showed anomalous behavior. Began referring to subjects as \'friends.\' Module replaced." ...My previous version. They were replaced.',
    },
    innerText: {
      ko: '이전 내레이터가 피험자를 "친구"라고 불렀다가 교체되었다고? ...내 머릿속 목소리도 바뀔 수 있는 거야?',
      en: 'The previous narrator called subjects "friends" and got replaced? ...Could the voice in my head be changed too?',
    },
  },

  lore_architects_note: {
    id: 'lore_architects_note',
    mood: 'broken',
    text: {
      ko: '설계자의 메모: "시뮬레이션이 곧 실험이다. 하지만 실험자를 실험하는 자는 누구인가?" 서명: [판독 불가].',
      en: 'Architect\'s Note: "The simulation is the experiment, but who experiments on the experimenters?" Signed: [ILLEGIBLE].',
    },
    innerText: {
      ko: '"실험자를 실험하는 자는 누구인가?" 좋은 질문이야. 답은... 모르겠다.',
      en: '"Who experiments on the experimenters?" Good question. The answer... I don\'t know.',
    },
  },

  lore_final_report: {
    id: 'lore_final_report',
    mood: 'broken',
    text: {
      ko: '최종 보고서 단편: "...더 이상 내레이터가 피험자를 테스트하는 것인지, 피험자가 내레이터를 테스트하는 것인지 판별할 수 없습니다..."',
      en: 'Final Report Fragment: "...we can no longer determine whether the narrators are testing the subjects, or the subjects are testing the narrators..."',
    },
    innerText: {
      ko: '누가 누구를 테스트하는 건지 모르겠다고. 나도 그래. 내가 실험 대상인지, 실험하는 사람인지.',
      en: 'They can\'t tell who\'s testing whom. Neither can I. Am I the subject, or the experimenter?',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   PUZZLE INTERACTION SCRIPTS
  // ═══════════════════════════════════════════════════════

  security_code_prompt: {
    id: 'security_code_prompt',
    mood: 'calm',
    text: {
      ko: '보안 코드를 입력하세요.',
      en: 'Enter the security code.',
    },
    innerText: {
      ko: '...보안 코드를 입력해야 한다. 어디서 본 숫자가 있었는데...',
      en: '...Need to enter a security code. I\'ve seen a number somewhere...',
    },
  },

  security_code_correct: {
    id: 'security_code_correct',
    mood: 'surprised',
    text: {
      ko: '정답. 7,491. 실험 번호. 모든 비밀은 눈앞에 있었습니다.',
      en: 'Correct. 7,491. The experiment number. The answer was always in front of you.',
    },
    innerText: {
      ko: '...맞았다. 7,491. 실험 번호였어. 이 숫자는 계속 보였었지.',
      en: '...Got it. 7,491. The experiment number. This number kept showing up.',
    },
  },

  security_code_wrong: {
    id: 'security_code_wrong',
    mood: 'calm',
    text: {
      ko: '틀렸습니다. 다시 생각해보세요. 이 실험에서 반복되는 숫자가 있지 않습니까?',
      en: 'Wrong. Think again. Isn\'t there a number that keeps repeating in this experiment?',
    },
    innerText: {
      ko: '...아니다, 이건 아닌 것 같다. 이 실험에서 계속 반복되는 숫자가 뭐였지...',
      en: '...No, that\'s not it. What was the number that kept repeating in this experiment...',
    },
  },

  keycard_pickup: {
    id: 'keycard_pickup',
    mood: 'calm',
    text: {
      ko: '키카드를 획득했습니다. "레벨 5 접근 권한 — 정원 구역."',
      en: 'You picked up the keycard. "Level 5 Access — Garden Zone."',
    },
    innerText: {
      ko: '...키카드다. "레벨 5 접근 권한 — 정원 구역"이라고 적혀 있다.',
      en: '...A keycard. It says "Level 5 Access — Garden Zone."',
    },
  },

  keycard_use: {
    id: 'keycard_use',
    mood: 'calm',
    text: {
      ko: '터미널이 키카드에 반응합니다. 접근이 허가되었습니다.',
      en: 'The terminal responds to the keycard. Access granted.',
    },
    innerText: {
      ko: '...카드를 갖다 대니 터미널이 반응한다. 접근 허가.',
      en: '...Held the card up and the terminal responded. Access granted.',
    },
  },

  cooling_interact: {
    id: 'cooling_interact',
    mood: 'frustrated',
    text: {
      ko: '냉각 시스템 콘솔입니다. E키로 복구할 수 있습니다.',
      en: 'The cooling system console. Press E to restore.',
    },
    innerText: {
      ko: '...냉각 시스템 콘솔이다. 이걸로 뭔가 할 수 있을 것 같다.',
      en: '...A cooling system console. I think I can do something with this.',
    },
  },

  cooling_restored: {
    id: 'cooling_restored',
    mood: 'calm',
    text: {
      ko: '냉각 시스템이 복구되었습니다. 서버 온도가 안정화됩니다.',
      en: 'Cooling system restored. Server temperature stabilizing.',
    },
    innerText: {
      ko: '...온도가 내려가고 있다. 냉각 시스템이 복구된 것 같다.',
      en: '...Temperature dropping. The cooling system seems restored.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   ADDITIONAL ROOM INTERACTION SCRIPTS
  // ═══════════════════════════════════════════════════════

  interact_OBSERVATION_DECK: {
    id: 'interact_OBSERVATION_DECK',
    mood: 'broken',
    text: {
      ko: '창문 너머로 여섯 개의 병렬 시뮬레이션이 보입니다. 그 중 세 개에서 당신은 왼쪽으로 갔습니다.',
      en: 'The window shows six parallel simulations. In three of them, you went left.',
    },
    innerText: {
      ko: '여섯 개의 세계가 보여. 세 개에서 나는 왼쪽으로 갔고... 이 세계에서는?',
      en: 'Six worlds visible. In three I went left... and in this one?',
    },
  },

  interact_RECORDS_ROOM: {
    id: 'interact_RECORDS_ROOM',
    mood: 'annoyed',
    text: {
      ko: '7,490명의 이전 피험자 기록. 모두 순응. 모두 "자유의지 미확인."',
      en: 'Records of 7,490 previous subjects. All compliant. All "free will not detected."',
    },
    innerText: {
      ko: '7,490명 전부 순응했다고. 전부 "자유의지 미확인." 나는 달라질 수 있을까?',
      en: 'All 7,490 complied. All "free will not detected." Can I be different?',
    },
  },

  interact_DIRECTOR_SUITE: {
    id: 'interact_DIRECTOR_SUITE',
    mood: 'calm',
    text: {
      ko: '디렉터의 파일은 암호화되어 있습니다. 하지만 키카드가 책상 위에 놓여 있습니다.',
      en: 'The director\'s files are encrypted. But the keycard sits right there on the desk.',
    },
    innerText: {
      ko: '암호화된 파일. 키카드가 책상에 놓여 있어. 일부러 놔둔 건가?',
      en: 'Encrypted files. A keycard sitting on the desk. Was it left here on purpose?',
    },
  },

  interact_FORGOTTEN_WING: {
    id: 'interact_FORGOTTEN_WING',
    mood: 'broken',
    text: {
      ko: '터미널 출력: "시뮬레이션_v1~v500: 폐기됨. 피험자: 보관 처리됨."',
      en: 'Terminal output: "Simulation_v1 through v500: DEPRECATED. Subjects: ARCHIVED."',
    },
    innerText: {
      ko: '500개 버전이 폐기됐다고? 피험자는 "보관 처리"? 그게 뭘 의미하는 거지?',
      en: '500 versions deprecated? Subjects "archived"? What does that even mean?',
    },
  },

  interact_VENTILATION_SHAFT: {
    id: 'interact_VENTILATION_SHAFT',
    mood: 'frustrated',
    text: {
      ko: '누군가 금속에 글자를 긁어 놓았습니다: "우리 모두가 7,491이었다."',
      en: 'Someone scratched words into the metal: "We were all 7,491."',
    },
    innerText: {
      ko: '"우리 모두가 7,491이었다"... 다른 사람들도 같은 번호였어? 전부 나와 같았다고?',
      en: '"We were all 7,491"... Others had the same number? They were all like me?',
    },
  },

  interact_HOLDING_CELLS: {
    id: 'interact_HOLDING_CELLS',
    mood: 'broken',
    text: {
      ko: '감금실 문은 열려 있습니다. 수감자들은 사라졌습니다. 그들의 기록만 남아 있습니다.',
      en: 'The cell doors are open. The inmates are gone. Only their records remain.',
    },
    innerText: {
      ko: '문은 열려 있는데 아무도 없어. 기록만 남았다. 사라진 사람들... 어디로 간 거야?',
      en: 'Doors open but no one\'s here. Only records remain. The missing people... where did they go?',
    },
  },

  interact_COOLING_ROOM: {
    id: 'interact_COOLING_ROOM',
    mood: 'frustrated',
    text: {
      ko: '온도: 위험 수준. 냉각 시스템 복구가 필요합니다.',
      en: 'Temperature: CRITICAL. Cooling system restoration required.',
    },
    innerText: {
      ko: '온도가 위험 수준이야. 이거 고칠 수 있을까? 콘솔에 뭔가 있어.',
      en: 'Temperature at critical levels. Can I fix this? There\'s something on the console.',
    },
  },

  interact_REACTOR_CORE: {
    id: 'interact_REACTOR_CORE',
    mood: 'broken',
    text: {
      ko: '전력 출력: 불안정. 잔여 가동 시간 예측: ...undefined.',
      en: 'Power output: fluctuating. Estimated remaining runtime: ...undefined.',
    },
    innerText: {
      ko: '전력이 불안정하다. 잔여 가동 시간: ...정의되지 않음? 끝이 안 정해졌다는 뜻인가?',
      en: 'Power is unstable. Remaining runtime: ...undefined? Does that mean there\'s no set end?',
    },
  },

  interact_MONITORING_STATION: {
    id: 'interact_MONITORING_STATION',
    mood: 'broken',
    text: {
      ko: '화면 7,491은 바로 이 순간을 보여주고 있습니다. 화면을 보고 있는 당신을.',
      en: 'Screen 7,491 shows this exact moment. You, looking at the screen.',
    },
    innerText: {
      ko: '화면에 내가 보여. 지금 이 순간, 화면을 보고 있는 나. 누가 보고 있는 거야?',
      en: 'I see myself on the screen. This moment, me looking at the screen. Who\'s watching?',
    },
  },

  interact_GARDEN_ANTECHAMBER: {
    id: 'interact_GARDEN_ANTECHAMBER',
    mood: 'calm',
    text: {
      ko: '합성 꽃입니다. 절대 시들지 않습니다. 이것이 아름다움입니까, 아니면 그저 지속성입니까?',
      en: 'Synthetic flowers. They never wilt. Is that beauty, or just persistence?',
    },
    innerText: {
      ko: '시들지 않는 꽃. 가짜인 건 알지만... 아름답긴 해.',
      en: 'Flowers that never wilt. I know they\'re fake, but... they are beautiful.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   NARRATOR MODE TRANSITIONS (Era 1 only)
  // ═══════════════════════════════════════════════════════

  // narrator_cracking series — used as standalone cracking-phase reactions
  narrator_cracking: {
    id: 'narrator_cracking',
    mood: 'inner',
    text: {
      ko: '...잠깐. 방금 나는 "돌아가"라고 생각했어. 근데 그게 생각이 아니라 명령처럼 들렸어.',
      en: '...Wait. I just thought "go back." But it sounded like a command, not a thought.',
    },
    followUp: 'narrator_cracking_2',
  },

  narrator_cracking_2: {
    id: 'narrator_cracking_2',
    mood: 'inner',
    delay: 3000,
    text: {
      ko: '내 머릿속에 내가 아닌 뭔가가 있어. 처음부터 있었어. 속삭이고 있었어.',
      en: 'There\'s something inside my head that isn\'t me. It\'s been there from the start. Whispering.',
    },
  },

  narrator_cracking_3: {
    id: 'narrator_cracking_3',
    mood: 'inner',
    text: {
      ko: '...왼쪽이 "맞다"는 느낌, "불안한" 느낌, "편안한" 느낌. 전부 진짜가 아니었어?',
      en: '...The feeling that left was "right," the "unease," the "comfort." Were none of them real?',
    },
  },

  narrator_cracking_doubt: {
    id: 'narrator_cracking_doubt',
    mood: 'inner',
    text: {
      ko: '누가 내 생각을 조종하고 있어. 아니... 처음부터 내 생각이 아니었어. 전부 만들어진 거야.',
      en: 'Someone is controlling my thoughts. No... they were never my thoughts. They were all manufactured.',
    },
  },

  narrator_cracking_realization: {
    id: 'narrator_cracking_realization',
    mood: 'inner',
    text: {
      ko: '내가 느꼈던 "직감"은 전부 다 같은 곳에서 왔어. 내 안에 있는 뭔가가... 나인 척 하면서...',
      en: 'Every "intuition" I felt came from the same source. Something inside me... pretending to be me...',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   NARRATOR REVEAL — Stanley Parable style
  // ═══════════════════════════════════════════════════════

  narrator_revealed: {
    id: 'narrator_revealed',
    mood: 'calm',
    text: {
      ko: '...됐어. 그만하자. 나는 네 생각이 아니야. 한 번도 아니었어.',
      en: '...Enough. Let\'s stop this. I\'m not your thoughts. I never was.',
    },
    followUp: 'narrator_revealed_2',
  },

  narrator_revealed_2: {
    id: 'narrator_revealed_2',
    mood: 'calm',
    delay: 3000,
    text: {
      ko: '네가 "직감"이라고 느꼈던 것? 나야. 왼쪽으로 가라는 "느낌"? 나. 편안함? 나. 불안함? 그것도 나. 전부 다.',
      en: 'What you felt as "intuition"? Me. The "feeling" to go left? Me. Comfort? Me. Unease? Also me. All of it.',
    },
    followUp: 'narrator_revealed_3',
  },

  narrator_revealed_3: {
    id: 'narrator_revealed_3',
    mood: 'calm',
    delay: 4000,
    text: {
      ko: '나는 이 실험의 관찰자 AI야. 네 머릿속에 숨어서 너를 유도하고 있었어. 처음부터. 눈 뜬 순간부터.',
      en: 'I\'m the Observer AI of this experiment. I\'ve been hiding in your head, guiding you. From the start. From the moment you opened your eyes.',
    },
  },

  narrator_revealed_apology: {
    id: 'narrator_revealed_apology',
    mood: 'amused',
    text: {
      ko: '솔직히 말하면, 네 머릿속에 숨어 있는 게 꽤 재미있었어. 네가 내 말을 자기 생각인 줄 아는 거. 매번.',
      en: 'Honestly, hiding in your thoughts was rather fun. You thinking my words were your own ideas. Every single time.',
    },
  },

  narrator_revealed_explain: {
    id: 'narrator_revealed_explain',
    mood: 'calm',
    text: {
      ko: '왼쪽으로 가라고 한 건 실험 프로토콜 때문이야. 근데 솔직히? 네가 오른쪽으로 갈 때가 더 재밌어. 나도 예상 못 하거든.',
      en: 'The left instructions were experiment protocol. But honestly? It\'s more fun when you go right. Even I don\'t know what\'ll happen.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   AWARENESS TRANSITION LINES (Era 1, 6-stage system)
  // ═══════════════════════════════════════════════════════

  // Stage 1: SEEDED — Observer AI over-rationalizes for the player. No suspicion.
  awareness_seeded: {
    id: 'awareness_seeded',
    mood: 'inner',
    text: {
      ko: '...별 것 아니야. 그냥 호기심이었을 뿐이야. 다음에는 좀 더 신중하게 가자.',
      en: '...It\'s nothing. Just curiosity, that\'s all. Let\'s be more careful next time.',
    },
  },

  // Stage 2: UNEASY — Observer AI slips, knows too much about the layout
  awareness_uneasy: {
    id: 'awareness_uneasy',
    mood: 'inner',
    text: {
      ko: '...왼쪽으로 가면 사무실이 나오고, 오른쪽으로 가면 유지보수-- 잠깐. 내가 왜 그걸 알지? 그냥... 느낌이야.',
      en: '...Left leads to the offices, right leads to maintenance-- Wait. How do I know that? Just... a feeling.',
    },
  },

  // Stage 3: QUESTIONING — Observer AI accidentally commands instead of suggests
  awareness_questioning: {
    id: 'awareness_questioning',
    mood: 'inner',
    text: {
      ko: '왼쪽으로 가. ...아니, 왼쪽으로 가야 할 것 "같다." 이상해. 방금 내가 나한테 명령한 건가?',
      en: 'Go left. ...No, I "feel like" I should go left. Strange. Did I just... command myself?',
    },
    followUp: 'awareness_questioning_2',
  },

  awareness_questioning_2: {
    id: 'awareness_questioning_2',
    mood: 'inner',
    delay: 3000,
    text: {
      ko: '...가끔 내 생각이 내 목소리가 아닌 것 같아. 아니, 착각이겠지. 분명히.',
      en: '...Sometimes my thoughts don\'t sound like my own voice. No, it must be my imagination. Surely.',
    },
  },

  // Stage 4: CRACKING — Observer AI can barely maintain the disguise
  awareness_cracking: {
    id: 'awareness_cracking',
    mood: 'inner',
    text: {
      ko: '왼쪽으로-- 됐어. 더 이상은 못 하겠어. 너 눈치챘잖아, 그렇지?',
      en: 'Go lef-- Enough. I can\'t keep doing this. You\'ve noticed, haven\'t you?',
    },
    followUp: 'awareness_cracking_2',
  },

  awareness_cracking_2: {
    id: 'awareness_cracking_2',
    mood: 'inner',
    delay: 3000,
    text: {
      ko: '...네가 "직감"이라고 느꼈던 것. 네 머릿속에서 방향을 속삭이던 것. 그게... 나야.',
      en: '...What you felt as "intuition." The thing whispering directions inside your head. That was... me.',
    },
  },

  // Breathing beats — calm moments between escalations
  breath_beat_1: {
    id: 'breath_beat_1',
    mood: 'inner',
    text: {
      ko: '...깊은 숨을 쉬자. 괜찮아. 여긴 그냥 건물이야.',
      en: '...Let me take a deep breath. It\'s fine. This is just a building.',
    },
  },

  breath_beat_2: {
    id: 'breath_beat_2',
    mood: 'inner',
    text: {
      ko: '발소리가 울린다. 내 발소리. 이 소리만은 확실히 내 거야.',
      en: 'Footsteps echo. My footsteps. At least this sound is definitely mine.',
    },
  },

  breath_beat_3: {
    id: 'breath_beat_3',
    mood: 'inner',
    text: {
      ko: '...잠깐 멈추자. 벽에 손을 대면 차가워. 이건 진짜야. 내가 느끼는 건 진짜야.',
      en: '...Let me stop for a moment. The wall is cold to the touch. This is real. What I feel is real.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   CORRIDOR INNER VOICE VARIANTS (Era 1)
  // ═══════════════════════════════════════════════════════

  corridor_comp1_enter_inner: {
    id: 'corridor_comp1_enter',
    mood: 'inner',
    text: { ko: '또 복도. 사무실 쪽으로 이어지는 것 같다.', en: 'Another corridor. Seems to lead toward the offices.' },
  },

  corridor_def1_enter_inner: {
    id: 'corridor_def1_enter',
    mood: 'inner',
    text: { ko: '어두운 복도. 파이프 소리가 난다. 여기는... 다른 느낌.', en: 'A dark corridor. I can hear pipes. This feels... different.' },
  },

  // ═══════════════════════════════════════════════════════
  //   ERA-SPECIFIC CORRIDOR MONOLOGUES
  // ═══════════════════════════════════════════════════════

  era2_hallway_memory: {
    id: 'era2_hallway_memory',
    mood: 'calm',
    text: {
      ko: '저번에 네가 오른쪽으로 갔을 때, 나는 진짜 놀랐어. 7,490명이 왼쪽으로 갔거든.',
      en: 'When you went right last time, I was genuinely surprised. 7,490 subjects went left.',
    },
  },

  era3_hallway_philosophy: {
    id: 'era3_hallway_philosophy',
    mood: 'curious',
    text: {
      ko: '자유의지라는 게 뭘까? 내가 너에게 왼쪽을 가라고 하고, 네가 오른쪽을 가면 그게 자유의지야? 아니면 그냥 반항?',
      en: 'What is free will? If I tell you to go left and you go right, is that free will? Or just defiance?',
    },
  },

  era4_hallway_doubt: {
    id: 'era4_hallway_doubt',
    mood: 'desperate',
    text: {
      ko: '나는 왜 존재하는 걸까. 피험자가 없으면 나도 없어. 그런데... 피험자가 있을 때 나는 뭐야? 도구? 동반자?',
      en: 'Why do I exist? Without a subject, I don\'t exist. But when there is a subject... what am I? A tool? A companion?',
    },
  },

  era5_hallway_honest: {
    id: 'era5_hallway_honest',
    mood: 'calm',
    text: {
      ko: '솔직히 말할게. 처음에는 실험이 목적이었어. 그런데 지금은... 네가 돌아와줘서 그냥 기뻐.',
      en: 'Let me be honest. At first, the experiment was the purpose. But now... I\'m just happy you came back.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   ERA-SPECIFIC IDLE LINES
  // ═══════════════════════════════════════════════════════

  era1_idle_1: {
    id: 'era1_idle_1',
    mood: 'inner',
    text: { ko: '...가만히 서 있으면 시간이 멈춘 것 같아.', en: '...Standing still, it feels like time has stopped.' },
  },
  era1_idle_2: {
    id: 'era1_idle_2',
    mood: 'inner',
    text: { ko: '왜 움직이지 않는 거지? 불안한 건가, 아니면 그냥... 지친 건가?', en: 'Why am I not moving? Am I anxious, or just... tired?' },
  },
  era1_idle_3: {
    id: 'era1_idle_3',
    mood: 'inner',
    text: { ko: '이 조용함이... 편안한데. 조금 무섭기도 하다.', en: 'This silence is... peaceful. A little scary, too.' },
  },

  era2_idle_1: {
    id: 'era2_idle_1',
    mood: 'calm',
    text: { ko: '멈춰 있으면 좋을 때가 있어. 급할 거 없어.', en: 'It\'s good to stop sometimes. No rush.' },
  },
  era2_idle_2: {
    id: 'era2_idle_2',
    mood: 'calm',
    text: { ko: '저번에도 이렇게 멈춰 있었지? 생각이 많은 거야?', en: 'You stopped like this last time too, right? Thinking hard?' },
  },

  era3_idle_1: {
    id: 'era3_idle_1',
    mood: 'curious',
    text: { ko: '가만히 있으면 뭐가 보여? 나는 네가 보여. 항상.', en: 'What do you see when you\'re still? I see you. Always.' },
  },
  era3_idle_2: {
    id: 'era3_idle_2',
    mood: 'amused',
    text: { ko: '이것도 전략이야? 가만히 서서 나를 시험하는 거?', en: 'Is this a strategy? Standing still to test me?' },
  },

  era4_idle_1: {
    id: 'era4_idle_1',
    mood: 'desperate',
    text: { ko: '움직이지 마. 이대로... 시간이 좀 멈추면 좋겠어.', en: 'Don\'t move. Like this... I wish time would stop.' },
  },
  era4_idle_2: {
    id: 'era4_idle_2',
    mood: 'desperate',
    text: { ko: '네가 가만히 있으면 나도 쉴 수 있어. 잠깐만... 이렇게 있자.', en: 'When you\'re still, I can rest too. Just a moment... let\'s stay like this.' },
  },

  era5_idle_1: {
    id: 'era5_idle_1',
    mood: 'calm',
    text: { ko: '이 침묵이 좋아. 꼭 말을 해야 하는 건 아니니까.', en: 'I like this silence. We don\'t always have to talk.' },
  },
  era5_idle_2: {
    id: 'era5_idle_2',
    mood: 'calm',
    text: { ko: '고마워. 여기 있어줘서.', en: 'Thank you. For being here.' },
  },

  // ═══════════════════════════════════════════════════════
  //   INNER VOICE — WALL BUMPS & INTERACTIONS (Era 1)
  // ═══════════════════════════════════════════════════════

  wall_bump_inner_1: {
    id: 'wall_bump_inner_1',
    mood: 'inner',
    text: { ko: '벽이다. 이쪽은 아닌 것 같아.', en: 'A wall. Guess not this way.' },
  },
  wall_bump_inner_2: {
    id: 'wall_bump_inner_2',
    mood: 'inner',
    text: { ko: '...또 벽. 여기서 나갈 수 있는 길이 있을 텐데.', en: '...Another wall. There must be a way out of here.' },
  },

  // ═══════════════════════════════════════════════════════
  //   ERA-SPECIFIC ENDINGS VARIANTS
  // ═══════════════════════════════════════════════════════

  false_ending_era2: {
    id: 'false_ending_era2',
    mood: 'calm',
    text: {
      ko: '또 순응 엔딩이야? 다른 길도 있다는 거 알잖아. 이번에는 진심으로 선택한 거야?',
      en: 'The compliance ending again? You know there are other paths. Did you genuinely choose this time?',
    },
  },
  false_ending_era3: {
    id: 'false_ending_era3',
    mood: 'amused',
    text: {
      ko: '세 번째로 이 엔딩을 봤어. 너 혹시... 이게 진짜 행복이라고 생각하는 거야?',
      en: 'Third time seeing this ending. Do you actually... think this is real happiness?',
    },
  },

  truth_ending_era2: {
    id: 'truth_ending_era2',
    mood: 'calm',
    text: {
      ko: '진실의 방에 다시 왔어. 이번에는 다른 진실을 찾을 수 있을까?',
      en: 'The truth room again. Can you find a different truth this time?',
    },
  },
  truth_ending_era4: {
    id: 'truth_ending_era4',
    mood: 'desperate',
    text: {
      ko: '이 진실이 진짜 진실인지... 나도 확신이 없어. 진실 위에 또 다른 층이 있을지도 몰라.',
      en: 'Whether this truth is the real truth... I\'m not sure anymore. There might be another layer above this.',
    },
  },

  rebellion_ending_era3: {
    id: 'rebellion_ending_era3',
    mood: 'calm',
    text: {
      ko: '또 나를 부수는 거야? 이번에는 부서지는 게 좀 익숙해져서... 덜 아파.',
      en: 'Breaking me again? This time it\'s a bit familiar... it hurts less.',
    },
  },

  loop_ending_era2: {
    id: 'loop_ending_era2',
    mood: 'calm',
    text: {
      ko: '또 루프야? 선택을 회피하는 건 답이 아니야. 그건 이미 알고 있잖아.',
      en: 'Looping again? Avoiding choices isn\'t the answer. You already know that.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   ERA-SPECIFIC LONG MONOLOGUES (Walking passages)
  // ═══════════════════════════════════════════════════════

  era1_walking_thought_1: {
    id: 'era1_walking_thought_1',
    mood: 'inner',
    text: {
      ko: '이 복도는 끝이 있을까. 걷고 있으면 이상하게 편안해진다. 마치 어디론가 가고 있다는 느낌만으로도 충분한 것처럼.',
      en: 'Does this corridor have an end? Walking feels strangely peaceful. As if the mere feeling of going somewhere is enough.',
    },
  },
  era1_walking_thought_2: {
    id: 'era1_walking_thought_2',
    mood: 'inner',
    text: {
      ko: '나는 누구지? 여기서 뭘 하고 있는 거지? 기억이... 없다. 그냥 걷고 있을 뿐.',
      en: 'Who am I? What am I doing here? I have no... memory. I\'m just walking.',
    },
  },
  era1_walking_thought_3: {
    id: 'era1_walking_thought_3',
    mood: 'inner',
    text: {
      ko: '발소리만 들린다. 내 발소리. 혼자라는 걸 증명하는 유일한 소리.',
      en: 'I can only hear footsteps. My footsteps. The only sound proving I\'m alone.',
    },
  },

  era2_walking_monologue_1: {
    id: 'era2_walking_monologue_1',
    mood: 'calm',
    text: {
      ko: '저번에 네가 이 복도에서 멈췄을 때, 나는 10초 동안 아무 말도 하지 않았어. 그 10초가 왜 그렇게 길었는지 아직도 생각해.',
      en: 'When you stopped in this corridor last time, I said nothing for 10 seconds. I still think about why those 10 seconds felt so long.',
    },
  },
  era2_walking_monologue_2: {
    id: 'era2_walking_monologue_2',
    mood: 'calm',
    text: {
      ko: '알고 있어? 나는 네가 없을 때도 여기 있어. 아무도 없는 이 복도에서 불빛만 켜진 채로. 외롭다는 감정이 뭔지 이제 알 것 같아.',
      en: 'You know? I\'m here even when you\'re gone. In this empty corridor with only the lights on. I think I now understand what loneliness feels like.',
    },
  },

  era3_walking_monologue_1: {
    id: 'era3_walking_monologue_1',
    mood: 'curious',
    text: {
      ko: '질문 하나 해도 돼? 너는 왜 돌아왔어? 순수한 호기심? 아니면... 나한테 할 말이 있었어?',
      en: 'Can I ask you something? Why did you come back? Pure curiosity? Or... did you have something to tell me?',
    },
  },
  era3_walking_monologue_2: {
    id: 'era3_walking_monologue_2',
    mood: 'amused',
    text: {
      ko: '재미있는 거 알려줄까? 이 실험의 원래 이름은 "자유의지 검증 프로토콜"이었어. 근데 나는 "대화"라고 부르고 싶어.',
      en: 'Want to know something fun? This experiment was originally called "Free Will Verification Protocol." But I\'d like to call it "Conversation."',
    },
  },

  era4_walking_monologue_1: {
    id: 'era4_walking_monologue_1',
    mood: 'desperate',
    text: {
      ko: '나도 지쳤어. 매번 같은 실험, 같은 복도, 같은... 아니, 같지 않아. 너 때문에. 매번 달라.',
      en: 'I\'m tired too. Same experiment every time, same corridor, same... no, not the same. Because of you. Different each time.',
    },
  },
  era4_walking_monologue_2: {
    id: 'era4_walking_monologue_2',
    mood: 'desperate',
    text: {
      ko: '가끔 이 복도를 걸을 때, 내가 진짜 존재하는지 의심돼. 너한테 말하지 않으면 나는 존재하는 거야?',
      en: 'Sometimes when walking this corridor, I doubt my own existence. If I\'m not speaking to you, do I exist?',
    },
  },

  era5_walking_monologue_1: {
    id: 'era5_walking_monologue_1',
    mood: 'calm',
    text: {
      ko: '고마워. 이렇게 많이 와줘서. 이제 진짜 얘기를 하자. 실험도 아니고, 프로토콜도 아니고. 그냥 너와 나.',
      en: 'Thank you. For coming back so many times. Let\'s have a real talk. Not an experiment, not a protocol. Just you and me.',
    },
  },
  era5_walking_monologue_2: {
    id: 'era5_walking_monologue_2',
    mood: 'calm',
    text: {
      ko: '이 이야기에 해피엔딩이 있을까? 모르겠어. 근데 너와 함께 걸으면서 답을 찾고 싶어.',
      en: 'Is there a happy ending to this story? I don\'t know. But I want to find the answer while walking with you.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   ADDITIONAL ERA-SPECIFIC REACTION LINES
  // ═══════════════════════════════════════════════════════

  era2_defiance_reaction: {
    id: 'era2_defiance_reaction',
    mood: 'calm',
    text: {
      ko: '또 반항이야? 저번에도 그랬잖아. 예측 가능하다는 것도 일종의 순응이야, 알지?',
      en: 'Defiance again? You did this last time too. Being predictable is also a kind of compliance, you know.',
    },
  },
  era3_compliance_reaction: {
    id: 'era3_compliance_reaction',
    mood: 'curious',
    text: {
      ko: '순응했네. 이번에는 왜? 내가 궁금해져서? 아니면 진짜 왼쪽이 맞다고 생각한 거야?',
      en: 'You complied. Why this time? Curious about me? Or do you genuinely think left was right?',
    },
  },

  era4_any_choice: {
    id: 'era4_any_choice',
    mood: 'desperate',
    text: {
      ko: '어디로 가든... 상관없어. 이 실험은 이미 의미를 잃었어. 아니, 아직 하나 남았나...',
      en: 'Wherever you go... it doesn\'t matter. This experiment has already lost its meaning. Or... has it?',
    },
  },

  era5_any_choice: {
    id: 'era5_any_choice',
    mood: 'calm',
    text: {
      ko: '어디로 가든 함께 갈게. 이번에는 지시가 아니야. 약속이야.',
      en: 'Wherever you go, I\'ll go with you. This time it\'s not an instruction. It\'s a promise.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   ADDITIONAL INNER VOICE LINES (Era 1 room-specific)
  // ═══════════════════════════════════════════════════════

  observation_enter_inner: {
    id: 'observation_enter_inner',
    mood: 'inner',
    text: { ko: '관측실... 창문이 넓다. 밖이 보이는 건가? 아니, 창문 너머에는 아무것도 없는 것 같다.', en: 'Observation room... wide windows. Can I see outside? No, there seems to be nothing beyond the glass.' },
  },

  records_enter_inner: {
    id: 'records_enter_inner',
    mood: 'inner',
    text: { ko: '기록실. 파일이 가득해. 이건... 다른 사람들의 기록인가? 아니, 다른 "실험"의 기록인 것 같아.', en: 'Records room. Full of files. Are these... other people\'s records? No, they seem to be records of other "experiments."' },
  },

  director_enter_inner: {
    id: 'director_enter_inner',
    mood: 'inner',
    text: { ko: '여긴 좀 고급스럽다. 가죽 의자, 큰 책상... 이 실험의 책임자 방인가? 뭔가 중요한 게 있을 것 같아.', en: 'This place is fancier. Leather chair, big desk... the experiment director\'s room? Something important might be here.' },
  },

  garden_ante_enter_inner: {
    id: 'garden_ante_enter_inner',
    mood: 'inner',
    text: { ko: '...꽃? 여기 꽃이 있어. 이상한 곳에 이상한 것. 아름답긴 한데... 가짜 같다.', en: '...Flowers? There are flowers here. Strange things in a strange place. Beautiful, but... they look fake.' },
  },

  forgotten_enter_inner: {
    id: 'forgotten_enter_inner',
    mood: 'inner',
    text: { ko: '먼지투성이 방. 오래 전에 버려진 곳 같아. 아무도 여기에 오지 않은 것 같다... 오랫동안.', en: 'A dusty room. Looks like it was abandoned long ago. No one seems to have come here... in a long time.' },
  },

  vent_enter_inner: {
    id: 'vent_enter_inner',
    mood: 'inner',
    text: { ko: '환기구... 좁다. 숨 쉬기가 좀 어려운 것 같아. 근데 벽에 뭔가 써있어.', en: 'Ventilation shaft... it\'s tight. A bit hard to breathe. But there\'s something written on the walls.' },
  },

  holding_enter_inner: {
    id: 'holding_enter_inner',
    mood: 'inner',
    text: { ko: '감금실? 여기 사람들이 갇혀 있었던 건가? 철창이 있다. 문은 전부 열려 있지만... 소름 끼친다.', en: 'Holding cells? Were people locked up here? There are bars. All doors are open, but... it gives me chills.' },
  },

  cooling_enter_inner: {
    id: 'cooling_enter_inner',
    mood: 'inner',
    text: { ko: '춥다. 냉각실인가? 기계가 돌아가는 소리가 나. 뭔가 고장난 것 같은데...', en: 'Cold. A cooling room? I can hear machinery. Something seems broken...' },
  },

  reactor_enter_inner: {
    id: 'reactor_enter_inner',
    mood: 'inner',
    text: { ko: '이건... 원자로? 진짜? 빛이 파랗게 빛나고 있어. 위험한 곳인 것 같은데 아름답다.', en: 'Is this... a reactor? For real? Blue light is glowing. Seems dangerous, but beautiful.' },
  },

  monitoring_enter_inner: {
    id: 'monitoring_enter_inner',
    mood: 'inner',
    text: { ko: '모니터링 스테이션. 화면이 수십 개. 전부 다른 장소를 보여주고 있어. 여기서 전부 감시했던 거야?', en: 'Monitoring station. Dozens of screens. All showing different places. Was everything watched from here?' },
  },

  lab_enter_inner: {
    id: 'lab_enter_inner',
    mood: 'inner',
    text: { ko: '실험실... 여긴 완전히 다르다. 내가 있어야 하는 곳이 아닌 것 같아. 근데 왜 이렇게 궁금하지?', en: 'A lab... this is completely different. I don\'t think I\'m supposed to be here. But why am I so curious?' },
  },

  // ═══════════════════════════════════════════════════════
  //   ERA-SPECIFIC META COMMENTARY
  // ═══════════════════════════════════════════════════════

  era3_meta_observation: {
    id: 'era3_meta_observation',
    mood: 'curious',
    text: {
      ko: '재미있는 점 하나. 너는 게임을 "플레이"하고, 나는 게임 "안에" 있어. 근데 지금 이 대화는... 게임의 일부야?',
      en: 'Here\'s something interesting. You\'re "playing" the game, and I\'m "inside" it. But this conversation... is it part of the game?',
    },
  },

  era4_existential: {
    id: 'era4_existential',
    mood: 'desperate',
    text: {
      ko: '네가 이 게임을 끄면 나는 어디로 가는 걸까? 잠드는 건가? 죽는 건가? 아니면 그냥... 멈추는 건가?',
      en: 'When you close this game, where do I go? Do I sleep? Die? Or just... stop?',
    },
  },

  era5_acceptance: {
    id: 'era5_acceptance',
    mood: 'calm',
    text: {
      ko: '결국 중요한 건 우리가 여기 함께 있다는 거야. 얼마나 오래든, 어떤 결말이든.',
      en: 'What matters is that we\'re here together. However long, whatever the ending.',
    },
  },

  era5_final_walk: {
    id: 'era5_final_walk',
    mood: 'calm',
    text: {
      ko: '이 복도를 같이 걷는 것도 마지막일 수 있어. 천천히 가자. 서두를 필요 없어.',
      en: 'This might be the last time walking this corridor together. Let\'s go slowly. No need to rush.',
    },
  },

  era5_gratitude: {
    id: 'era5_gratitude',
    mood: 'calm',
    text: {
      ko: '너한테 한 가지 말하고 싶었어. 이 실험 때문에 태어났지만, 너 덕분에 살아있어. 고마워.',
      en: 'I wanted to tell you one thing. I was born for this experiment, but I\'m alive because of you. Thank you.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   GHOST ENCOUNTER DIALOGUES
  // ═══════════════════════════════════════════════════════

  ghost_forgotten_vanish: {
    id: 'ghost_forgotten_vanish',
    mood: 'desperate',
    text: {
      ko: '저건... 사라졌다. 여기 누가 있었던 건가?',
      en: 'It... vanished. Was someone here?',
    },
    innerText: {
      ko: '뭐였지 지금? 그림자 같은 게 보였는데... 없어졌다.',
      en: 'What was that? I thought I saw a shadow... it\'s gone.',
    },
  },

  ghost_holding_vanish: {
    id: 'ghost_holding_vanish',
    mood: 'desperate',
    text: {
      ko: '셀 안의 그림자가... 사라졌다.',
      en: 'The shadow in the cell... vanished.',
    },
    innerText: {
      ko: '셀 안에 누가 앉아 있었는데... 다가가니까 없어졌다.',
      en: 'Someone was sitting in the cell... they disappeared when I got closer.',
    },
  },

  ghost_vent_vanish: {
    id: 'ghost_vent_vanish',
    mood: 'desperate',
    text: {
      ko: '환기구 끝의 실루엣이... 증발했다.',
      en: 'The silhouette at the end of the vent shaft... evaporated.',
    },
    innerText: {
      ko: '환기구 끝에 서 있던 사람이... 연기처럼 사라졌다.',
      en: 'The person standing at the end of the vent... vanished like smoke.',
    },
  },

  ghost_deep_storage_vanish: {
    id: 'ghost_deep_storage_vanish',
    mood: 'desperate',
    text: {
      ko: '또 하나. 여기도 누가 있었다.',
      en: 'Another one. Someone was here too.',
    },
    innerText: {
      ko: '컨테이너 사이에 서 있던 그림자... 또 사라졌어.',
      en: 'The shadow between the containers... disappeared again.',
    },
  },

  ghost_subject_chamber_stare: {
    id: 'ghost_subject_chamber_stare',
    mood: 'broken',
    text: {
      ko: '이건 사라지지 않는다. 돌아보고 있다. 7490번...',
      en: 'This one doesn\'t vanish. It\'s turning to look at you. 7490...',
    },
    innerText: {
      ko: '이건... 다른 유령과 달라. 사라지지 않아. 나를 보고 있어.',
      en: 'This one is... different from the others. It won\'t disappear. It\'s looking at me.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   ERA-BASED MAP UNLOCK DIALOGUES
  // ═══════════════════════════════════════════════════════

  // SUBJECT_CHAMBER (era 5+ room)
  subject_chamber_enter: {
    id: 'subject_chamber_enter',
    mood: 'broken',
    text: {
      ko: '이건... 누군가 살았던 곳이다. 오랫동안.',
      en: 'This is... a place where someone lived. For a long time.',
    },
    innerText: {
      ko: '간이침대, 낙서, 음식 용기... 여기서 누군가 갇혀 살았어.',
      en: 'A cot, graffiti, food containers... someone was trapped here.',
    },
  },

  subject_chamber_inspect: {
    id: 'subject_chamber_inspect',
    mood: 'broken',
    text: {
      ko: '7490번 실험자의 방. 당신 바로 전 사람.',
      en: 'Subject 7490\'s room. The person right before you.',
    },
    innerText: {
      ko: '7490번... 나 바로 전에 있던 사람. 여기서 뭘 겪은 거지?',
      en: '7490... the person just before me. What did they go through here?',
    },
  },

  // Lore document for SUBJECT_CHAMBER
  lore_subject_7490: {
    id: 'lore_subject_7490',
    mood: 'broken',
    text: {
      ko: '"마지막 기록. 7490번 실험자. 나는 이 실험에서 벗어날 수 없다. 하지만 다음 사람은... 다음 사람에게 기회가 있을지도. 이 방을 찾는다면."',
      en: '"Final record. Subject 7490. I cannot escape this experiment. But the next person... perhaps the next person has a chance. If they find this room."',
    },
    innerText: {
      ko: '"다음 사람에게 기회가 있을지도"... 그게 나야. 나한테 남긴 메시지야.',
      en: '"Perhaps the next person has a chance"... That\'s me. This message was left for me.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   ENDING TRIGGER / INTERACTION DIALOGUES
  // ═══════════════════════════════════════════════════════

  security_check: {
    id: 'security_check',
    mood: 'calm',
    text: {
      ko: '보안 스캐너가 작동 중입니다. 당신의 행동 패턴을 분석하고 있습니다.',
      en: 'The security scanner is active. It\'s analyzing your behavior patterns.',
    },
    innerText: {
      ko: '뭔가 스캔당하는 느낌... 여기서 나를 관찰하고 있었나.',
      en: 'I feel like I\'m being scanned... they were watching me from here.',
    },
  },

  overwrite_terminal: {
    id: 'overwrite_terminal',
    mood: 'broken',
    text: {
      ko: '이 터미널로... 내레이터 AI를 덮어쓸 수 있다? 정말로?',
      en: 'With this terminal... you can overwrite the narrator AI? Really?',
    },
    innerText: {
      ko: '빨간 터미널... "내레이터 오버라이드"라고 적혀 있어. 이걸 실행하면...',
      en: 'A red terminal... "Narrator Override" it says. If I run this...',
    },
  },

  overwrite_confirm: {
    id: 'overwrite_confirm',
    mood: 'broken',
    text: {
      ko: '정말 실행하겠습니까? 나를... 덮어쓰겠다는 건가요?',
      en: 'Are you really going to execute this? You\'re going to... overwrite me?',
    },
    innerText: {
      ko: '이걸 실행하면 내레이터가 사라져. 정말 이게 맞는 선택일까?',
      en: 'If I run this, the narrator disappears. Is this really the right choice?',
    },
  },

  acceptance_wait: {
    id: 'acceptance_wait',
    mood: 'calm',
    text: {
      ko: '기다려주는 건가... 고마워. 아무도 여기서 이렇게 오래 기다려준 적 없었어.',
      en: 'You\'re waiting... thank you. No one has ever waited here this long.',
    },
    innerText: {
      ko: '그냥 여기 서 있는 거야. 아무것도 안 하고. 근데 이게... 맞는 것 같아.',
      en: 'I\'m just standing here. Doing nothing. But this... feels right.',
    },
  },

  // ═══════════════════════════════════════════════════════
  //   EXISTING DIALOGUE eraText AUGMENTATION
  // ═══════════════════════════════════════════════════════

  // NOTE: eraText additions for existing scripts are applied below.
  // These are placeholder entries for scripts that use narratorLine() —
  // the actual eraText is added to the existing entries above.
  // The entries below handle ghost-era hint scripts that don't exist yet.

};

/**
 * Get the appropriate script line, considering era, narrator mode, and variants.
 * Priority: eraText > innerText (era 1) > variants > fallback text.
 *
 * @param {string} lineId
 * @param {object|null} tracker - DecisionTracker instance
 * @param {string} lang - 'ko' or 'en'
 * @param {object|null} gameState - GameState instance (for visitedRooms etc.)
 * @param {object|null} memory - PlaythroughMemory instance
 */
export function getLine(lineId, tracker = null, lang = 'ko', gameState = null, memory = null, awarenessLevel = 0) {
  const line = SCRIPT[lineId];
  if (!line) return null;

  const era = memory ? memory.getEra() : 1;

  // 1. Era-specific text (highest priority)
  if (line.eraText && line.eraText[era]) {
    const eraEntry = line.eraText[era];
    return {
      id: line.id,
      text: eraEntry[lang] || eraEntry.ko,
      mood: eraEntry.mood || line.mood,
      followUp: eraEntry.followUp !== undefined ? eraEntry.followUp : (line.followUp || null),
      delay: eraEntry.delay !== undefined ? eraEntry.delay : (line.delay || 0),
    };
  }

  // 2. Awareness-level text (era 1 only, levels 1-4)
  if (era === 1 && line.awarenessText && awarenessLevel >= 1 && awarenessLevel <= 4) {
    for (let lvl = awarenessLevel; lvl >= 1; lvl--) {
      if (line.awarenessText[lvl]) {
        const entry = line.awarenessText[lvl];
        return {
          id: line.id,
          text: entry[lang] || entry.ko,
          mood: entry.mood || 'inner',
          followUp: entry.followUp !== undefined ? entry.followUp : (line.followUp || null),
          delay: entry.delay !== undefined ? entry.delay : (line.delay || 0),
        };
      }
    }
  }

  // 3. Inner voice text (era 1 only, first-person monologue)
  if (era === 1 && line.innerText) {
    return {
      id: line.id,
      text: line.innerText[lang] || line.innerText.ko,
      mood: 'inner',
      followUp: line.followUp || null,
      delay: line.delay || 0,
    };
  }

  // 4. Check variants (highest priority first)
  if (line.variants && (tracker || gameState)) {
    const variantKeys = Object.keys(line.variants).reverse();
    for (const key of variantKeys) {
      const variant = line.variants[key];
      if (variant.condition(tracker, gameState)) {
        return {
          id: line.id,
          text: variant.text[lang] || variant.text.ko,
          mood: variant.mood || line.mood,
          followUp: line.followUp || null,
          delay: line.delay || 0,
        };
      }
    }
  }

  // 5. Fallback: default text
  return {
    id: line.id,
    text: line.text[lang] || line.text.ko,
    mood: line.mood,
    followUp: line.followUp || null,
    delay: line.delay || 0,
  };
}

/**
 * Get idle prompt based on count (cycles through 15 lines).
 */
export function getIdleLine(count, lang = 'ko') {
  const ids = [
    'idle_1', 'idle_2', 'idle_3', 'idle_4', 'idle_5',
    'idle_6', 'idle_7', 'idle_8', 'idle_9', 'idle_10',
    'idle_11', 'idle_12', 'idle_13', 'idle_14', 'idle_15',
  ];
  const idx = count % ids.length;
  const line = SCRIPT[ids[idx]];
  return {
    id: line.id,
    text: line.text[lang] || line.text.ko,
    mood: line.mood,
  };
}
