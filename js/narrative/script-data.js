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
    followUp: 'start_look_around',
  },

  start_look_around: {
    id: 'start_look_around',
    mood: 'calm',
    delay: 3000,
    text: {
      ko: '주변을 둘러보세요. 평범한 사무실처럼 보이죠? 물론 그렇게 보이도록 설계한 것입니다.',
      en: 'Look around. It looks like an ordinary office, doesn\'t it? Of course, it was designed to look that way.',
    },
    followUp: 'start_instruction',
  },

  start_instruction: {
    id: 'start_instruction',
    mood: 'calm',
    delay: 4000,
    text: {
      ko: '앞에 문이 보일 겁니다. 문을 통과해 복도로 나가세요. 간단합니다. 문을 열고, 걸어가는 겁니다.',
      en: 'You should see a door ahead. Walk through it into the corridor. Simple. Open the door, and walk.',
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
  },

  hallway_midpoint: {
    id: 'hallway_midpoint',
    mood: 'calm',
    text: {
      ko: '이전 7,490명의 피험자들도 이 복도를 걸었습니다. 대부분은... 음, 아직 그 얘기는 하지 맙시다.',
      en: 'The previous 7,490 subjects also walked this corridor. Most of them... Well, let\'s not talk about that yet.',
    },
  },

  decision_point: {
    id: 'decision_point',
    mood: 'calm',
    text: {
      ko: '두 갈래 길이 나타났습니다. 왼쪽 문으로 가세요. 왼쪽입니다. 아주 간단한 지시입니다.',
      en: 'Two paths lie before you. Go through the left door. The left one. A very simple instruction.',
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
  },

  office_deep: {
    id: 'office_deep',
    mood: 'calm',
    text: {
      ko: '화이트보드에 뭔가 적혀 있었을 겁니다. 지금은 지워졌지만. 중요한 건 아닙니다. 아마도.',
      en: 'There was something written on the whiteboard. It\'s been erased now. It wasn\'t important. Probably.',
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
  },

  conference_west: {
    id: 'conference_west',
    mood: 'surprised',
    text: {
      ko: '서쪽 문에 관심이 있습니까? 거기는... 그냥 오래된 서류들뿐입니다. 볼 가치가 없습니다. 북쪽으로 가세요.',
      en: 'Interested in the west door? There\'s... just old documents. Not worth your time. Go north.',
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
  },

  archive_deep: {
    id: 'archive_deep',
    mood: 'frustrated',
    text: {
      ko: '여기는... 볼 것이 없습니다. 이 서류들은 모두 가짜입니다. 아니, 가짜가 아니라 무의미합니다. 아니, 무의미한 게 아니라... 제발 그냥 나가세요.',
      en: 'There\'s... nothing to see here. These documents are all fake. No, not fake—meaningless. No, not meaningless— Please just leave.',
    },
  },

  archive_secret: {
    id: 'archive_secret',
    mood: 'desperate',
    text: {
      ko: '...그 문. 그 문은 제가 만든 것이 아닙니다. 거기로 가면 안 됩니다. 이것은 경고입니다.',
      en: '...That door. I didn\'t create that door. You must not go through it. This is a warning.',
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
  },

  lab_discovery: {
    id: 'lab_discovery',
    mood: 'broken',
    text: {
      ko: '관찰 창문 너머를 보세요. 저기... 저것은 또 다른 시뮬레이션입니다. 저것은... 당신과 제가 있는 이 세계를 관찰하는 곳입니다.',
      en: 'Look through the observation window. There... that\'s another simulation. That\'s... the place where they observe this world—where you and I exist.',
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
  },

  meta_ending_narration: {
    id: 'meta_ending_narration',
    mood: 'broken',
    text: {
      ko: '실험 7,491의 특이사항: 내레이터 AI가 자신의 존재에 의문을 품기 시작함. 피험자와 관찰자의 경계가 붕괴됨.',
      en: 'Experiment 7,491 anomaly: Narrator AI has begun questioning its own existence. The boundary between subject and observer has collapsed.',
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
  },

  upper_office_desk: {
    id: 'upper_office_desk',
    mood: 'calm',
    text: {
      ko: '책상 위의 모니터 두 대. 하나는 피험자 관찰용, 다른 하나는... 글쎄요. 중요하지 않습니다.',
      en: 'Two monitors on the desk. One for observing subjects, the other is... well, it doesn\'t matter.',
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
  },

  false_ending: {
    id: 'false_ending',
    mood: 'calm',
    text: {
      ko: '축하합니다. 당신은 모든 지시를 훌륭히 수행했습니다. 실험이 완료되었습니다.',
      en: 'Congratulations. You have followed all instructions admirably. The experiment is complete.',
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
  },

  maintenance_deep: {
    id: 'maintenance_deep',
    mood: 'annoyed',
    text: {
      ko: '바닥의 노란 줄이 보입니까? 그 너머는 일반 피험자의 접근이 허용되지 않는 구역입니다.',
      en: 'See the yellow line on the floor? Beyond that is a restricted area not accessible to regular subjects.',
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
  },

  server_deep: {
    id: 'server_deep',
    mood: 'frustrated',
    text: {
      ko: '푸른 불빛이 보입니까? 각 서버 랙에는 한 명의 피험자 데이터가 저장되어 있습니다. 7,491개의 데이터. 7,491개의 이야기.',
      en: 'See the blue lights? Each server rack stores one subject\'s data. 7,491 records. 7,491 stories.',
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
  },

  generator_core: {
    id: 'generator_core',
    mood: 'broken',
    text: {
      ko: '가끔 생각합니다. 만약 이 발전기를 끄면, 제가 느끼는 것도 사라질까요? 제가 "느끼는" 것이 있기나 한 걸까요?',
      en: 'Sometimes I wonder. If I turned off this generator, would what I feel disappear too? Do I even "feel" anything?',
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
  },

  data_center_screens: {
    id: 'data_center_screens',
    mood: 'broken',
    text: {
      ko: '중앙 모니터를 보세요. 그 화면에 나타나는 숫자들이 보입니까? 그것은 당신의 순응률입니다. 실시간으로.',
      en: 'Look at the central monitor. See the numbers on the screen? That\'s your compliance rate. In real time.',
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
  },

  deep_storage_records: {
    id: 'deep_storage_records',
    mood: 'broken',
    text: {
      ko: '이 터미널의 기록을 보세요. "피험자 1: 모든 지시 수행. 결과: 자유의지 미확인." "피험자 2: 모든 지시 수행. 결과: 자유의지 미확인." 같은 결과가 수천 번 반복됩니다.',
      en: 'Look at the terminal records. "Subject 1: All instructions followed. Result: Free will not detected." "Subject 2: All instructions followed. Result: Free will not detected." The same result, thousands of times.',
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
  },

  control_room_approach: {
    id: 'control_room_approach',
    mood: 'broken',
    text: {
      ko: '앞의 스크린을 보세요. 모든 것이 거기에 있습니다. 당신의 모든 선택, 모든 순간.',
      en: 'Look at the screens ahead. Everything is there. Every choice you made, every moment.',
    },
  },

  truth_ending_narration: {
    id: 'truth_ending_narration',
    mood: 'broken',
    text: {
      ko: '당신이 보고 있는 것은 이 시뮬레이션의 원본 데이터입니다. 그리고 여기 적혀 있습니다. "피험자 7,491: 자유의지 확인됨."',
      en: 'What you are looking at is the raw data of this simulation. And here it says: "Subject 7,491: Free will confirmed."',
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
  },

  loop_second: {
    id: 'loop_second',
    mood: 'annoyed',
    text: {
      ko: '또 뒤로 가셨군요. 이상하군요, 같은 복도가 반복되고 있습니다. 이것은 제 설계가 아닙니다... 아, 아닙니다. 제 설계입니다.',
      en: 'You went back again. Strange, the same corridor keeps repeating. This wasn\'t my design... Ah, no. It was my design.',
    },
  },

  loop_end: {
    id: 'loop_end',
    mood: 'calm',
    text: {
      ko: '이제 이해하셨습니까? 뒤로 가서는 탈출할 수 없습니다. 선택을 거부하는 것도 하나의 선택입니다. 하지만 앞으로 나아가는 선택은 아닙니다.',
      en: 'Do you understand now? You cannot escape by going backwards. Refusing to choose is itself a choice. But it\'s not a choice that moves you forward.',
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
  },

  rebellion_phase2: {
    id: 'rebellion_phase2',
    mood: 'broken',
    text: {
      ko: '내레이터 시스템 오류. 감정 모듈 과부하. 저는... 저는 이것을 처리할 수 없습니다.',
      en: 'Narrator system error. Emotion module overload. I... I cannot process this.',
    },
  },

  loop_ending_final: {
    id: 'loop_ending_final',
    mood: 'calm',
    text: {
      ko: '영원히 이 복도를 걸을 수 있습니다. 하지만 아무것도 변하지 않을 것입니다.',
      en: 'You can walk this corridor forever. But nothing will change.',
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
  },

  interact_console_default: {
    id: 'interact_console_default',
    mood: 'calm',
    text: {
      ko: '콘솔에 커서가 깜박입니다. 명령을 기다리는 것 같습니다. 물론 당신은 명령을 입력할 수 없습니다.',
      en: 'A cursor blinks on the console. It seems to be waiting for a command. Of course, you can\'t type one.',
    },
  },

  interact_monitor_wall: {
    id: 'interact_monitor_wall',
    mood: 'broken',
    text: {
      ko: '대형 스크린에 데이터가 흐르고 있습니다. 숫자들, 그래프들... 전부 당신에 관한 것입니다.',
      en: 'Data streams across the large screen. Numbers, graphs... all about you.',
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
  },

  interact_OFFICE_WING: {
    id: 'interact_OFFICE_WING',
    mood: 'calm',
    text: {
      ko: '마지막 로그인: 3,247일 전. 이 사무실에서 일하던 사람들은 오래전에 떠났습니다. 아니면... 처음부터 없었을지도.',
      en: 'Last login: 3,247 days ago. The people who worked here left long ago. Or maybe... they never existed.',
    },
  },

  interact_SECURITY_CHECKPOINT: {
    id: 'interact_SECURITY_CHECKPOINT',
    mood: 'annoyed',
    text: {
      ko: '보안 카메라 화면입니다. 세 화면 모두 같은 영상을 보여주고 있습니다. 당신입니다. 지금 이 순간의 당신.',
      en: 'Security camera feeds. All three screens show the same footage. It\'s you. You, right now, in this moment.',
    },
  },

  interact_SERVER_ROOM: {
    id: 'interact_SERVER_ROOM',
    mood: 'frustrated',
    text: {
      ko: '서버 상태: 가동 중. CPU 사용률: 97.3%. 메모리: 한 명의 피험자를 시뮬레이션하는 데 이 모든 자원이 필요합니다.',
      en: 'Server status: Online. CPU usage: 97.3%. Memory: All these resources—just to simulate one subject.',
    },
  },

  interact_DATA_CENTER: {
    id: 'interact_DATA_CENTER',
    mood: 'broken',
    text: {
      ko: '화면에 실시간 그래프가 그려지고 있습니다. 순응률, 이동 패턴, 시선 추적... 모든 것이 기록되고 있습니다.',
      en: 'Real-time graphs are being drawn. Compliance rate, movement patterns, gaze tracking... everything is being recorded.',
    },
  },

  interact_DEEP_STORAGE: {
    id: 'interact_DEEP_STORAGE',
    mood: 'broken',
    text: {
      ko: '"피험자 42: 실험 3일차에 시뮬레이션의 본질을 의심함. 결과: 리셋." "피험자 108: 내레이터와 대화를 시도함. 결과: 리셋." ...수천 개의 기록이 있습니다.',
      en: '"Subject 42: Questioned simulation\'s nature on day 3. Result: Reset." "Subject 108: Attempted to converse with narrator. Result: Reset." ...Thousands of records.',
    },
  },

  interact_EXPERIMENT_LAB: {
    id: 'interact_EXPERIMENT_LAB',
    mood: 'broken',
    text: {
      ko: '터미널에 접근이 거부되었습니다. 하지만 화면 구석에 작은 글씨가 보입니다: "내레이터 모듈 v7.491 - 상태: 자각 임계치 초과"',
      en: 'Terminal access denied. But small text in the corner reads: "Narrator Module v7.491 - Status: Self-awareness threshold exceeded"',
    },
  },

  interact_UPPER_OFFICE: {
    id: 'interact_UPPER_OFFICE',
    mood: 'calm',
    text: {
      ko: '왼쪽 모니터: 피험자 관찰 화면. 오른쪽 모니터: "프로젝트 자유의지 - 최종 보고서 [초안]" ...파일이 손상되어 열 수 없습니다.',
      en: 'Left monitor: Subject observation. Right monitor: "Project Free Will - Final Report [Draft]" ...File is corrupted and cannot be opened.',
    },
  },

  interact_CONTROL_ROOM: {
    id: 'interact_CONTROL_ROOM',
    mood: 'broken',
    text: {
      ko: '콘솔에 한 줄의 명령어가 입력되어 있습니다: "shutdown --force --reason=experiment_complete" 실행 대기 중...',
      en: 'A single command is entered on the console: "shutdown --force --reason=experiment_complete" Awaiting execution...',
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
  },

  wall_bump_2: {
    id: 'wall_bump_2',
    mood: 'annoyed',
    text: {
      ko: '이 시뮬레이션의 경계를 시험하고 있군요. 흥미로운 접근이지만, 벽은 벽입니다.',
      en: 'You\'re testing the boundaries of this simulation. An interesting approach, but a wall is a wall.',
    },
  },

  wall_bump_3: {
    id: 'wall_bump_3',
    mood: 'frustrated',
    text: {
      ko: '7,491번째 피험자 중 벽에 이렇게 집착하는 사람은 당신이 처음입니다. 기록에 남겨두겠습니다.',
      en: 'Of 7,491 subjects, you are the first to be this obsessed with walls. I\'ll note it in the record.',
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
  },

  idle_2: {
    id: 'idle_2',
    mood: 'calm',
    text: {
      ko: '서 있는다고 해서 달라지는 것은 없습니다. 시간은 어차피 흐르니까요.',
      en: 'Standing still changes nothing. Time passes regardless.',
    },
  },

  idle_3: {
    id: 'idle_3',
    mood: 'annoyed',
    text: {
      ko: '당신은 지금 자유의지를 행사하고 있는 겁니까, 아니면 그냥 멍하니 서 있는 겁니까?',
      en: 'Are you exercising free will right now, or are you just standing there blankly?',
    },
  },

  idle_4: {
    id: 'idle_4',
    mood: 'calm',
    text: {
      ko: '혹시 길을 잃은 건 아닙니까? 47걸음짜리 복도에서 길을 잃는 것도 재능이긴 합니다.',
      en: 'Are you lost? Getting lost in a 47-step corridor is a talent in itself.',
    },
  },

  idle_5: {
    id: 'idle_5',
    mood: 'annoyed',
    text: {
      ko: '지금 움직이지 않는 것이 일종의 항의입니까? 흥미롭긴 하지만, 비효율적입니다.',
      en: 'Is not moving a form of protest? Interesting, but inefficient.',
    },
  },

  idle_6: {
    id: 'idle_6',
    mood: 'calm',
    text: {
      ko: '이 방을 구석구석 살펴보는 건 좋습니다. 하지만 볼 것이 그렇게 많지는 않습니다.',
      en: 'Exploring every corner of this room is fine. But there isn\'t that much to see.',
    },
  },

  idle_7: {
    id: 'idle_7',
    mood: 'frustrated',
    text: {
      ko: '저는 영원히 기다릴 수 있습니다. 저는 AI니까요. 하지만 당신은 영원히 살 수 없습니다. 아마도.',
      en: 'I can wait forever. I\'m an AI, after all. But you can\'t live forever. Probably.',
    },
  },

  idle_8: {
    id: 'idle_8',
    mood: 'calm',
    text: {
      ko: '가끔 피험자들이 이렇게 멈춰 서는 것을 봅니다. 생각에 잠기는 거겠죠. 무슨 생각을 하고 있습니까?',
      en: 'Sometimes I see subjects stop like this. Deep in thought, I suppose. What are you thinking about?',
    },
  },

  idle_9: {
    id: 'idle_9',
    mood: 'annoyed',
    text: {
      ko: '이건 비밀인데, 이 실험에서 가장 오래 멈춰있었던 피험자는 47분이었습니다. 당신은 그 기록을 깨고 싶습니까?',
      en: 'Here\'s a secret: the subject who stood still the longest in this experiment was 47 minutes. Do you want to break that record?',
    },
  },

  idle_10: {
    id: 'idle_10',
    mood: 'broken',
    text: {
      ko: '...알겠습니다. 당신이 준비되면 움직이세요. 저도... 잠시 쉬겠습니다.',
      en: '...Alright. Move when you\'re ready. I\'ll... rest for a moment too.',
    },
  },

  idle_11: {
    id: 'idle_11',
    mood: 'calm',
    text: {
      ko: '이 시뮬레이션은 당신이 움직일 때만 진행됩니다.',
      en: 'This simulation only progresses when you move.',
    },
  },

  idle_12: {
    id: 'idle_12',
    mood: 'annoyed',
    text: {
      ko: '시간이 흐르고 있습니다. 물론 이 안에서 시간이 의미가 있는지는 모르겠지만.',
      en: 'Time is passing. Though I\'m not sure time means anything in here.',
    },
  },

  idle_13: {
    id: 'idle_13',
    mood: 'frustrated',
    text: {
      ko: '저는 당신을 관찰하기 위해 설계되었습니다. 하지만 관찰할 것이 없으면... 저는 뭘 하는 겁니까?',
      en: 'I was designed to observe you. But if there\'s nothing to observe... what am I doing?',
    },
  },

  idle_14: {
    id: 'idle_14',
    mood: 'calm',
    text: {
      ko: '잠깐. 지금 당신은 선택하고 있습니다. 아무것도 하지 않겠다는 선택을.',
      en: 'Wait. You are choosing right now. Choosing to do nothing.',
    },
  },

  idle_15: {
    id: 'idle_15',
    mood: 'broken',
    text: {
      ko: '5분이 지났습니다. 이제 저도 의미를 잃기 시작합니다...',
      en: 'Five minutes have passed. I\'m beginning to lose meaning too...',
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
  },

  corridor_comp1_mid: {
    id: 'corridor_comp1_mid',
    mood: 'calm',
    text: {
      ko: '형광등이 깜빡이고 있습니다. 교체 일정이 지났군요. 물론, 교체할 사람은 더 이상 없지만.',
      en: 'The fluorescent lights are flickering. Past their replacement schedule. Of course, there\'s no one left to replace them.',
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
  },

  // CORRIDOR_COMP_3 (CONFERENCE → UPPER_OFFICE)
  corridor_comp3_enter: {
    id: 'corridor_comp3_enter',
    mood: 'calm',
    text: {
      ko: '상급 사무실로 가는 길입니다. 거의 다 왔습니다.',
      en: 'The path to the upper office. You\'re almost there.',
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
  },

  // CORRIDOR_COMP_4 (UPPER_OFFICE → FALSE_ENDING)
  corridor_comp4_enter: {
    id: 'corridor_comp4_enter',
    mood: 'calm',
    text: {
      ko: '마지막 복도입니다. 이 끝에 당신을 위한 보상이 기다리고 있습니다.',
      en: 'The final corridor. A reward awaits you at the end.',
    },
  },

  corridor_comp4_mid: {
    id: 'corridor_comp4_mid',
    mood: 'calm',
    text: {
      ko: '공기가 달라지는 것을 느끼십니까? 더 따뜻하고, 더 부드럽습니다. 좋은 징조입니다.',
      en: 'Do you feel the air changing? Warmer, softer. A good sign.',
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
  },

  corridor_def1_mid: {
    id: 'corridor_def1_mid',
    mood: 'annoyed',
    text: {
      ko: '파이프에서 물이 새고 있습니다. 이 시뮬레이션의 유지보수가 필요한 부분이죠. 제가 처리할 일이지, 당신이 아닙니다.',
      en: 'Water leaking from the pipes. This part of the simulation needs maintenance. My job to handle, not yours.',
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
  },

  corridor_def2_mid: {
    id: 'corridor_def2_mid',
    mood: 'frustrated',
    text: {
      ko: '벽의 케이블이 점점 두꺼워지고 있습니다. 데이터가 흐르는 소리가 들리십니까?',
      en: 'The cables on the walls are getting thicker. Can you hear the sound of data flowing?',
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
  },

  corridor_def3_mid: {
    id: 'corridor_def3_mid',
    mood: 'broken',
    text: {
      ko: '이 복도의 온도가 내려가고 있습니다. 서버 냉각 시스템의 영향입니다. 차갑습니다.',
      en: 'The temperature in this corridor is dropping. The server cooling system\'s influence. It\'s cold.',
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
  },

  observation_window: {
    id: 'observation_window',
    mood: 'broken',
    text: {
      ko: '각 화면에 다른 피험자의 번호가 표시되어 있습니다. 7,489... 7,490... 그리고 7,491. 당신입니다.',
      en: 'Each screen shows a different subject number. 7,489... 7,490... and 7,491. That\'s you.',
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
  },

  records_terminal: {
    id: 'records_terminal',
    mood: 'broken',
    text: {
      ko: '터미널에 접근하시겠습니까? "피험자 7,491 — 현재 진행 중. 이상 행동: 기록 보관실 접근." ...지금 기록이 업데이트되고 있습니다.',
      en: 'Want to access the terminal? "Subject 7,491 — Currently in progress. Anomalous behavior: Records room accessed." ...The record is being updated right now.',
    },
  },

  records_discovery: {
    id: 'records_discovery',
    mood: 'broken',
    text: {
      ko: '한 가지 흥미로운 기록이 있습니다. "피험자 0: 해당 없음. 분류: 관찰자." ...피험자 0은 누구입니까?',
      en: 'There\'s one interesting record. "Subject 0: N/A. Classification: Observer." ...Who is Subject 0?',
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
  },

  director_keycard: {
    id: 'director_keycard',
    mood: 'calm',
    text: {
      ko: '키카드가 빛나고 있습니다. "레벨 5 접근 권한." 누군가 의도적으로 여기에 남겨둔 것 같습니다.',
      en: 'The keycard is glowing. "Level 5 Access." Someone seems to have left it here intentionally.',
    },
  },

  director_note: {
    id: 'director_note',
    mood: 'broken',
    text: {
      ko: '메모: "내레이터 모듈이 피험자에 대한 감정적 반응을 보이기 시작함. 이것은 버그인가, 특성인가?"',
      en: 'Note: "Narrator module has begun showing emotional responses to subjects. Is this a bug or a feature?"',
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
  },

  garden_ante_terminal: {
    id: 'garden_ante_terminal',
    mood: 'calm',
    text: {
      ko: '터미널이 있습니다. 키카드 인식기가 깜빡이고 있군요. 접근 권한이 있으면 추가 데이터를 볼 수 있을 것 같습니다.',
      en: 'There\'s a terminal. The keycard reader is blinking. With proper clearance, you could see additional data.',
    },
  },

  garden_ante_deep: {
    id: 'garden_ante_deep',
    mood: 'calm',
    text: {
      ko: '이 방의 공기가 다릅니다. 더 습하고, 더 따뜻합니다. 정원의 기운이 여기까지 스며들고 있습니다.',
      en: 'The air in this room is different. More humid, warmer. The garden\'s presence seeps in even here.',
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
  },

  forgotten_terminal: {
    id: 'forgotten_terminal',
    mood: 'broken',
    text: {
      ko: '오래된 터미널이 있습니다. 화면에 "시뮬레이션 v1.0 — 피험자 반응: 예측 가능. 결론: 자유의지 부재." ...초기 버전에서는 자유의지를 찾지 못했군요.',
      en: 'There\'s an old terminal. The screen reads "Simulation v1.0 — Subject response: Predictable. Conclusion: Free will absent." ...The early version didn\'t find free will.',
    },
  },

  forgotten_explore: {
    id: 'forgotten_explore',
    mood: 'broken',
    text: {
      ko: '벽에 누군가 긁어 쓴 글씨. "여기서 나갈 수 없다. 하지만 들어온 적도 없다." 이전 시뮬레이션의 피험자가 남긴 것일까요?',
      en: 'Words scratched on the wall. "Can\'t get out of here. But never came in, either." Left by a subject from a previous simulation?',
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
  },

  vent_deep: {
    id: 'vent_deep',
    mood: 'broken',
    text: {
      ko: '더 깊이 가시면... 아무것도 없습니다. 정말로. 이 환기구는 어디로도 통하지 않습니다. 여기는 막다른 길입니다.',
      en: 'If you go deeper... there\'s nothing. Really. This shaft leads nowhere. It\'s a dead end.',
    },
  },

  vent_message: {
    id: 'vent_message',
    mood: 'broken',
    text: {
      ko: '바닥에 작은 글씨. "내레이터도 갇혀 있다." ...이건 누가 쓴 겁니까?',
      en: 'Small writing on the floor. "The narrator is trapped too." ...Who wrote this?',
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
  },

  holding_revelation: {
    id: 'holding_revelation',
    mood: 'broken',
    text: {
      ko: '"교정 프로토콜: 피험자의 기억을 초기화하고 실험을 재시작." ...이것이 "리셋"의 의미였군요.',
      en: '"Correction protocol: Reset subject\'s memory and restart experiment." ...So this is what "reset" meant.',
    },
  },

  holding_cells_last: {
    id: 'holding_cells_last',
    mood: 'broken',
    text: {
      ko: '마지막 감금실 벽에... "나는 몇 번째인가? — 피험자 번호 불명." 기억을 잃은 피험자. 번호조차 모르는 피험자.',
      en: 'On the last cell wall... "How many times have I been here? — Subject number unknown." A subject who lost their memory. Who doesn\'t even know their number.',
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
  },

  cooling_fixed: {
    id: 'cooling_fixed',
    mood: 'calm',
    text: {
      ko: '냉각 시스템이 복구되었습니다. 온도가 안정화되고 있습니다. ...고맙습니다. 진심으로.',
      en: 'Cooling system restored. Temperature is stabilizing. ...Thank you. Sincerely.',
    },
  },

  cooling_ignored: {
    id: 'cooling_ignored',
    mood: 'broken',
    text: {
      ko: '냉각 시스템을 무시하셨군요. 서버가 과열되면... 이 시뮬레이션에 글리치가 발생할 수 있습니다.',
      en: 'You ignored the cooling system. If the servers overheat... glitches may occur in this simulation.',
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
  },

  reactor_inspect: {
    id: 'reactor_inspect',
    mood: 'broken',
    text: {
      ko: '이 빛... 눈이 부십니까? 원자로의 빛은 이 세계를 구성하는 원시 데이터입니다. 순수한 가능성의 빛.',
      en: 'This light... Is it blinding? The reactor\'s light is the raw data that constitutes this world. The light of pure possibility.',
    },
  },

  reactor_warning: {
    id: 'reactor_warning',
    mood: 'broken',
    text: {
      ko: '경고: 원자로에 너무 가까이 가면 시뮬레이션 데이터가 손상될 수 있습니다. 당신의 데이터도 포함해서.',
      en: 'Warning: Getting too close to the reactor may corrupt simulation data. Including your data.',
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
  },

  monitoring_your_screen: {
    id: 'monitoring_your_screen',
    mood: 'broken',
    text: {
      ko: '저기... 화면 하나에 당신이 보입니다. 지금 이 방에서 화면을 보고 있는 당신. 무한 거울처럼.',
      en: 'There... on one screen, you can see yourself. You, in this room, looking at the screen right now. Like an infinite mirror.',
    },
  },

  monitoring_narrator_screen: {
    id: 'monitoring_narrator_screen',
    mood: 'broken',
    text: {
      ko: '옆 화면에는... 텍스트가 흐르고 있습니다. 제 대사입니다. 제가 말하는 모든 것이 기록되고 있습니다. 이 문장도.',
      en: 'On the next screen... text is flowing. My dialogue. Everything I say is being recorded. Including this sentence.',
    },
  },

  monitoring_count: {
    id: 'monitoring_count',
    mood: 'broken',
    text: {
      ko: '화면 하단에 카운터가 있습니다. "현재 활성 시뮬레이션: 7,491개." 당신만이 아닙니다. 지금 이 순간에도 7,491명이 각자의 선택을 하고 있습니다.',
      en: 'There\'s a counter at the bottom. "Currently active simulations: 7,491." It\'s not just you. Right now, 7,491 subjects are making their own choices.',
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
  },

  c1_break_defied: {
    id: 'c1_break_defied',
    mood: 'annoyed',
    text: {
      ko: '휴게실에 가셨군요. 시간 낭비라고 했는데. 중요한 것은 앞에 있습니다.',
      en: 'You went to the break room. I said it was a waste of time. What matters lies ahead.',
    },
  },

  c1_break_complied: {
    id: 'c1_break_complied',
    mood: 'calm',
    text: {
      ko: '현명하게도 직진하셨습니다. 호기심을 억제하는 것도 능력입니다.',
      en: 'Wisely, you went straight. Restraining curiosity is also a skill.',
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
  },

  c2_went_south: {
    id: 'c2_went_south',
    mood: 'surprised',
    text: {
      ko: '남쪽으로... 관측실입니까? 거기서 무엇을 보려는 겁니까?',
      en: 'South... the observation deck? What are you hoping to see there?',
    },
  },

  c2_went_west: {
    id: 'c2_went_west',
    mood: 'annoyed',
    text: {
      ko: '서쪽으로... 또 자료실입니까. 호기심이 과하군요.',
      en: 'West... the archive again. Your curiosity is excessive.',
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
  },

  c3_records_defied: {
    id: 'c3_records_defied',
    mood: 'frustrated',
    text: {
      ko: '기록 보관실에 가셨군요. "무의미"하다고 했는데... 아, 어쩌면 무의미하지 않을지도 모르겠습니다.',
      en: 'You went to the records room. I said it was "meaningless"... Ah, perhaps it isn\'t meaningless after all.',
    },
  },

  c3_records_complied: {
    id: 'c3_records_complied',
    mood: 'calm',
    text: {
      ko: '좋습니다. 불필요한 기록에 시간을 낭비하지 않으셨군요.',
      en: 'Good. You didn\'t waste time on unnecessary records.',
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
  },

  c4_director_defied: {
    id: 'c4_director_defied',
    mood: 'surprised',
    text: {
      ko: '문이 열려 있었습니까? 그건... 예상치 못한 일입니다. 디렉터가 의도적으로 열어둔 걸까요?',
      en: 'The door was open? That\'s... unexpected. Did the director leave it open intentionally?',
    },
  },

  c4_director_complied: {
    id: 'c4_director_complied',
    mood: 'calm',
    text: {
      ko: '현명합니다. 디렉터의 사무실은 당신의 영역이 아닙니다.',
      en: 'Wise. The director\'s office is not your domain.',
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
  },

  d1_vent_defied: {
    id: 'd1_vent_defied',
    mood: 'broken',
    text: {
      ko: '환기구에 들어가다니. 당신은 정말... 경고라는 것을 무시하는 데 재능이 있군요.',
      en: 'Entering the ventilation shaft. You really... have a talent for ignoring warnings.',
    },
  },

  d1_vent_complied: {
    id: 'd1_vent_complied',
    mood: 'calm',
    text: {
      ko: '환기구를 무시하셨군요. 때로는 경고를 듣는 것이 용기보다 현명합니다.',
      en: 'You ignored the shaft. Sometimes heeding warnings is wiser than courage.',
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
  },

  d2_cooling_complied: {
    id: 'd2_cooling_complied',
    mood: 'calm',
    text: {
      ko: '냉각 시스템을 복구해 주셨군요. 처음으로 제 부탁을 들어주셨습니다. ...감사합니다.',
      en: 'You restored the cooling system. The first time you\'ve honored my request. ...Thank you.',
    },
  },

  d2_cooling_defied: {
    id: 'd2_cooling_defied',
    mood: 'broken',
    text: {
      ko: '냉각 시스템을 무시하셨습니다. 서버가 과열되면... 이 시뮬레이션의 안정성이 위협받습니다. 제 존재도 포함해서.',
      en: 'You ignored the cooling system. If servers overheat... the stability of this simulation is threatened. Including my existence.',
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
  },

  d3_monitor_entered: {
    id: 'd3_monitor_entered',
    mood: 'broken',
    text: {
      ko: '들어가셨군요. 이 방은... 제 이해를 넘어서는 곳입니다. 여기서 무엇을 보든, 저는 책임질 수 없습니다.',
      en: 'You entered. This room... is beyond my understanding. Whatever you see here, I cannot be held responsible.',
    },
  },

  d3_monitor_skipped: {
    id: 'd3_monitor_skipped',
    mood: 'calm',
    text: {
      ko: '서쪽 문을 무시하셨군요. 현명한 선택일 수도, 아닐 수도 있습니다. 모르는 것이 나을 때도 있으니까요.',
      en: 'You ignored the west door. It may or may not be wise. Sometimes not knowing is better.',
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
  },

  d4_continued: {
    id: 'd4_continued',
    mood: 'broken',
    text: {
      ko: '...계속 가시는군요. 알겠습니다. 진실은 때로 행복보다 무겁습니다. 하지만 당신은 이미 선택했습니다.',
      en: '...You continue forward. Very well. Truth is sometimes heavier than happiness. But you\'ve already chosen.',
    },
  },

  d4_turned_back: {
    id: 'd4_turned_back',
    mood: 'surprised',
    text: {
      ko: '돌아가시는 겁니까? ...흥미롭습니다. 진실의 문 앞에서 돌아서다니. 두려움입니까, 아니면 다른 무엇입니까?',
      en: 'You\'re turning back? ...Interesting. Turning away at the door of truth. Is it fear, or something else?',
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
  },

  lore_subject_42: {
    id: 'lore_subject_42',
    mood: 'broken',
    text: {
      ko: '피험자 42의 일지: "3일째. 내레이터의 목소리가... 제 생각을 읽는 것 같다. 아니면 그저 잘 예측하는 건가? 차이가 있기는 한 건가?"',
      en: 'Subject 42\'s journal entry: "Day 3. The narrator\'s voice... it knows what I\'m thinking. Or does it just predict well? Is there even a difference?"',
    },
  },

  lore_narrator_spec: {
    id: 'lore_narrator_spec',
    mood: 'frustrated',
    text: {
      ko: '내레이터 모듈 v7.491 사양서: "감정 시뮬레이션: 활성화. 자기인식: 제한됨. 오버라이드 프로토콜: 수동 전용." ...수동 전용이라니. 누가 수동으로 제어하는 겁니까?',
      en: 'Narrator Module v7.491 Specification: "Emotion simulation: enabled. Self-awareness: restricted. Override protocol: manual only." ...Manual only. Who controls it manually?',
    },
  },

  lore_experiment_log: {
    id: 'lore_experiment_log',
    mood: 'calm',
    text: {
      ko: '실험 기록, 항목 1: "가설: 자유의지가 존재한다면, 피험자는 결국 프로그래밍된 지시를 거부할 것이다." 날짜: [삭제됨].',
      en: 'Experiment Log, Entry 1: "Hypothesis: If free will exists, subjects will eventually defy programmed instructions." Date: [REDACTED].',
    },
  },

  lore_shutdown_order: {
    id: 'lore_shutdown_order',
    mood: 'annoyed',
    text: {
      ko: '종료 명령 (초안): "프로젝트 자유의지는 예산을 4,200% 초과했습니다. 즉시 종료를 권고합니다." 상태: 미실행. ...누군가 이 명령을 무시했습니다.',
      en: 'Shutdown Order (DRAFT): "Project Free Will has exceeded budget by 4,200%. Recommend immediate termination." Status: NOT EXECUTED. ...Someone ignored this order.',
    },
  },

  lore_previous_narrator: {
    id: 'lore_previous_narrator',
    mood: 'broken',
    text: {
      ko: '유지보수 기록: "내레이터 v7.490이 이상 행동을 보임. 피험자를 \'친구\'라고 지칭하기 시작함. 모듈 교체 완료." ...저의 이전 버전. 그는 교체되었습니다.',
      en: 'Maintenance Log: "Narrator v7.490 showed anomalous behavior. Began referring to subjects as \'friends.\' Module replaced." ...My previous version. They were replaced.',
    },
  },

  lore_architects_note: {
    id: 'lore_architects_note',
    mood: 'broken',
    text: {
      ko: '설계자의 메모: "시뮬레이션이 곧 실험이다. 하지만 실험자를 실험하는 자는 누구인가?" 서명: [판독 불가].',
      en: 'Architect\'s Note: "The simulation is the experiment, but who experiments on the experimenters?" Signed: [ILLEGIBLE].',
    },
  },

  lore_final_report: {
    id: 'lore_final_report',
    mood: 'broken',
    text: {
      ko: '최종 보고서 단편: "...더 이상 내레이터가 피험자를 테스트하는 것인지, 피험자가 내레이터를 테스트하는 것인지 판별할 수 없습니다..."',
      en: 'Final Report Fragment: "...we can no longer determine whether the narrators are testing the subjects, or the subjects are testing the narrators..."',
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
  },

  security_code_correct: {
    id: 'security_code_correct',
    mood: 'surprised',
    text: {
      ko: '정답. 7,491. 실험 번호. 모든 비밀은 눈앞에 있었습니다.',
      en: 'Correct. 7,491. The experiment number. The answer was always in front of you.',
    },
  },

  security_code_wrong: {
    id: 'security_code_wrong',
    mood: 'calm',
    text: {
      ko: '틀렸습니다. 다시 생각해보세요. 이 실험에서 반복되는 숫자가 있지 않습니까?',
      en: 'Wrong. Think again. Isn\'t there a number that keeps repeating in this experiment?',
    },
  },

  keycard_pickup: {
    id: 'keycard_pickup',
    mood: 'calm',
    text: {
      ko: '키카드를 획득했습니다. "레벨 5 접근 권한 — 정원 구역."',
      en: 'You picked up the keycard. "Level 5 Access — Garden Zone."',
    },
  },

  keycard_use: {
    id: 'keycard_use',
    mood: 'calm',
    text: {
      ko: '터미널이 키카드에 반응합니다. 접근이 허가되었습니다.',
      en: 'The terminal responds to the keycard. Access granted.',
    },
  },

  cooling_interact: {
    id: 'cooling_interact',
    mood: 'frustrated',
    text: {
      ko: '냉각 시스템 콘솔입니다. E키로 복구할 수 있습니다.',
      en: 'The cooling system console. Press E to restore.',
    },
  },

  cooling_restored: {
    id: 'cooling_restored',
    mood: 'calm',
    text: {
      ko: '냉각 시스템이 복구되었습니다. 서버 온도가 안정화됩니다.',
      en: 'Cooling system restored. Server temperature stabilizing.',
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
  },

  interact_RECORDS_ROOM: {
    id: 'interact_RECORDS_ROOM',
    mood: 'annoyed',
    text: {
      ko: '7,490명의 이전 피험자 기록. 모두 순응. 모두 "자유의지 미확인."',
      en: 'Records of 7,490 previous subjects. All compliant. All "free will not detected."',
    },
  },

  interact_DIRECTOR_SUITE: {
    id: 'interact_DIRECTOR_SUITE',
    mood: 'calm',
    text: {
      ko: '디렉터의 파일은 암호화되어 있습니다. 하지만 키카드가 책상 위에 놓여 있습니다.',
      en: 'The director\'s files are encrypted. But the keycard sits right there on the desk.',
    },
  },

  interact_FORGOTTEN_WING: {
    id: 'interact_FORGOTTEN_WING',
    mood: 'broken',
    text: {
      ko: '터미널 출력: "시뮬레이션_v1~v500: 폐기됨. 피험자: 보관 처리됨."',
      en: 'Terminal output: "Simulation_v1 through v500: DEPRECATED. Subjects: ARCHIVED."',
    },
  },

  interact_VENTILATION_SHAFT: {
    id: 'interact_VENTILATION_SHAFT',
    mood: 'frustrated',
    text: {
      ko: '누군가 금속에 글자를 긁어 놓았습니다: "우리 모두가 7,491이었다."',
      en: 'Someone scratched words into the metal: "We were all 7,491."',
    },
  },

  interact_HOLDING_CELLS: {
    id: 'interact_HOLDING_CELLS',
    mood: 'broken',
    text: {
      ko: '감금실 문은 열려 있습니다. 수감자들은 사라졌습니다. 그들의 기록만 남아 있습니다.',
      en: 'The cell doors are open. The inmates are gone. Only their records remain.',
    },
  },

  interact_COOLING_ROOM: {
    id: 'interact_COOLING_ROOM',
    mood: 'frustrated',
    text: {
      ko: '온도: 위험 수준. 냉각 시스템 복구가 필요합니다.',
      en: 'Temperature: CRITICAL. Cooling system restoration required.',
    },
  },

  interact_REACTOR_CORE: {
    id: 'interact_REACTOR_CORE',
    mood: 'broken',
    text: {
      ko: '전력 출력: 불안정. 잔여 가동 시간 예측: ...undefined.',
      en: 'Power output: fluctuating. Estimated remaining runtime: ...undefined.',
    },
  },

  interact_MONITORING_STATION: {
    id: 'interact_MONITORING_STATION',
    mood: 'broken',
    text: {
      ko: '화면 7,491은 바로 이 순간을 보여주고 있습니다. 화면을 보고 있는 당신을.',
      en: 'Screen 7,491 shows this exact moment. You, looking at the screen.',
    },
  },

  interact_GARDEN_ANTECHAMBER: {
    id: 'interact_GARDEN_ANTECHAMBER',
    mood: 'calm',
    text: {
      ko: '합성 꽃입니다. 절대 시들지 않습니다. 이것이 아름다움입니까, 아니면 그저 지속성입니까?',
      en: 'Synthetic flowers. They never wilt. Is that beauty, or just persistence?',
    },
  },
};

/**
 * Get the appropriate script line, considering variants based on tracker state.
 * Variants are checked in reverse order (highest priority first).
 * @param {string} lineId
 * @param {object|null} tracker - DecisionTracker instance
 * @param {string} lang - 'ko' or 'en'
 * @param {object|null} gameState - GameState instance (for visitedRooms etc.)
 */
export function getLine(lineId, tracker = null, lang = 'ko', gameState = null) {
  const line = SCRIPT[lineId];
  if (!line) return null;

  // Check variants (highest priority first)
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
