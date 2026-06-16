// ============================================================
// COMMUNICATION CURRICULUM — daily progression from basics
// (eye contact, listening) → vocabulary, storytelling, interview
// confidence, English fluency. One practical exercise per day.
// Supplemented by uploaded communication books.
// ============================================================

export interface CommLesson {
  unit: string;
  skill: string;
  why: string;
  exercise: string; // the practical drill for today
  phrase?: string; // a useful line / vocab to deploy today
}

export const COMMUNICATION: CommLesson[] = [
  {
    unit: "Presence",
    skill: "Eye Contact",
    why: "Eye contact signals confidence and honesty. Avoiding it reads as fear.",
    exercise:
      "In every conversation today, hold eye contact for ~3-4 seconds, then look away naturally. Notice the other person relax.",
    phrase: "Practice the 50/70 rule: 50% eye contact while speaking, 70% while listening.",
  },
  {
    unit: "Presence",
    skill: "Active Listening",
    why: "People remember how you made them feel. Listening makes them feel important.",
    exercise:
      "Today, in one conversation, don't think about your reply. Just listen, then summarise back: 'So what you're saying is…'",
    phrase: "'Tell me more about that.' — the most powerful four words in conversation.",
  },
  {
    unit: "Presence",
    skill: "Open Body Language",
    why: "Closed posture (crossed arms, hunched) signals insecurity. Open posture commands the room.",
    exercise:
      "Stand and sit with shoulders back, chest open, hands visible. Do a 2-min power pose before any important talk today.",
    phrase: "Take up space. Confidence is a posture before it is a feeling.",
  },
  {
    unit: "Presence",
    skill: "Voice & Pace",
    why: "A slow, low, steady voice projects authority. Rushing signals nerves.",
    exercise:
      "Record yourself reading a paragraph aloud. Slow down 20%. Add pauses. Listen back.",
    phrase: "Pause before you answer. The pause makes you sound thoughtful, not slow.",
  },
  {
    unit: "Conversation",
    skill: "Small Talk Openers",
    why: "Small talk is the door to every relationship. It's a skill, not a talent.",
    exercise:
      "Start 2 conversations today with a stranger or acquaintance using an observation + open question.",
    phrase: "'That's a great ___ — where did you get it?' / 'What's keeping you busy these days?'",
  },
  {
    unit: "Conversation",
    skill: "The FORD Method",
    why: "Never run out of things to say: Family, Occupation, Recreation, Dreams.",
    exercise:
      "In one conversation, move through 2 FORD topics with follow-up questions.",
    phrase: "F-O-R-D: Family, Occupation, Recreation, Dreams. Your conversation map.",
  },
  {
    unit: "Conversation",
    skill: "Asking Better Questions",
    why: "Open questions ('how', 'why', 'what') unlock real conversation; closed ones kill it.",
    exercise:
      "Turn 3 yes/no questions into open ones today. 'Did you like it?' → 'What did you like about it?'",
    phrase: "Swap 'Did/Do/Are' for 'What/How/Why'.",
  },
  {
    unit: "Vocabulary",
    skill: "Word of the Day Habit",
    why: "A strong vocabulary makes you precise and persuasive. Build it 1 word/day.",
    exercise:
      "Learn one new word, write its meaning, and use it in 3 sentences out loud today.",
    phrase: "Today's word: 'Articulate' — expressing yourself clearly and effectively.",
  },
  {
    unit: "Vocabulary",
    skill: "Precision over Filler",
    why: "'Um', 'like', 'you know' leak confidence. Silence beats filler.",
    exercise:
      "Count your filler words in one conversation. Replace each with a 1-second silent pause.",
    phrase: "Silence is not awkward. It is powerful. Let it breathe.",
  },
  {
    unit: "Storytelling",
    skill: "The Story Spine",
    why: "Stories are how humans connect and remember. Structure makes any story land.",
    exercise:
      "Tell a 60-second story today using: Once upon a time… Every day… Until one day… Because of that… Finally…",
    phrase: "Hook → tension → resolution. Every story needs all three.",
  },
  {
    unit: "Storytelling",
    skill: "Show, Don't Tell",
    why: "Details create images. Images create memory and emotion.",
    exercise:
      "Retell something from your day using one vivid sensory detail (a sound, a smell, a number).",
    phrase: "Don't say 'it was crazy'. Say what made it crazy.",
  },
  {
    unit: "Storytelling",
    skill: "Humour & Timing",
    why: "Light humour disarms and connects. Timing is the whole game.",
    exercise:
      "Make one person smile today with a light, self-aware comment. Aim for warmth, not performance.",
    phrase: "Callback humour: reference something said earlier. It signals you were listening.",
  },
  {
    unit: "English Fluency",
    skill: "Think in English",
    why: "Translation in your head causes hesitation. Thinking in English builds flow.",
    exercise:
      "Narrate your routine in your head in English for 10 minutes ('Now I am making tea…').",
    phrase: "Fluency = thinking in the language, not translating to it.",
  },
  {
    unit: "English Fluency",
    skill: "Shadowing",
    why: "Repeating native audio out loud trains accent, rhythm and confidence fast.",
    exercise:
      "Pick a 2-minute clip of a confident speaker. Play, pause, repeat exactly — tone and all.",
    phrase: "Shadow 5 minutes daily. Your mouth learns what your ear hears.",
  },
  {
    unit: "English Fluency",
    skill: "Speak Before Perfect",
    why: "Waiting until your English is 'perfect' guarantees you never speak. Reps > perfection.",
    exercise:
      "Speak English out loud for 5 minutes today, mistakes allowed. Record it. No deleting.",
    phrase: "A fluent speaker is a fearless speaker. Make mistakes loudly.",
  },
  {
    unit: "Persuasion",
    skill: "Speak in Benefits",
    why: "People act on what's in it for them. Translate features into benefits.",
    exercise:
      "Describe something you'd recommend today by leading with the benefit, not the feature.",
    phrase: "'This saves you 2 hours' beats 'this has feature X'.",
  },
  {
    unit: "Persuasion",
    skill: "Use Their Name",
    why: "A person's name is the sweetest sound to them. It builds instant rapport.",
    exercise:
      "Use the name of 3 people today, naturally, in conversation.",
    phrase: "Names build bridges. Learn them, use them, remember them.",
  },
  {
    unit: "Interview",
    skill: "The STAR Method",
    why: "Interview answers ramble without structure. STAR makes you sound sharp.",
    exercise:
      "Answer 'Tell me about a challenge you overcame' using Situation, Task, Action, Result.",
    phrase: "S-T-A-R: Situation, Task, Action, Result. Memorise it.",
  },
  {
    unit: "Interview",
    skill: "Tell Me About Yourself",
    why: "The #1 question. A crisp 60-second answer sets the whole tone.",
    exercise:
      "Build & rehearse a 60-sec pitch: Present (what you do) → Past (how you got here) → Future (what you want).",
    phrase: "Present → Past → Future. Three sentences each. Rehearse out loud 5×.",
  },
  {
    unit: "Interview",
    skill: "Confident Closings",
    why: "How you end is what they remember. End with intention, not a mumble.",
    exercise:
      "Practice a strong close: 'Thank you — I'm genuinely excited about this and I'd love the chance to contribute.'",
    phrase: "Always end with a firm handshake, eye contact, and a clear next step.",
  },
  {
    unit: "Social Confidence",
    skill: "Rejection Reps",
    why: "Fear of rejection silences you. Exposure kills the fear.",
    exercise:
      "Ask for one small thing today you'd normally avoid asking (a favour, a discount, an opinion).",
    phrase: "Rejection is a muscle. Train it and it stops hurting.",
  },
  {
    unit: "Social Confidence",
    skill: "Owning the Room",
    why: "Confidence is contagious. Walk in like you belong and others believe it.",
    exercise:
      "Enter one space today slowly, head up, unhurried. Greet someone first instead of waiting.",
    phrase: "Be the one who says hello first. Initiative reads as status.",
  },
];

export function communicationForDay(dayNumber: number): CommLesson {
  const idx = (Math.max(1, dayNumber) - 1) % COMMUNICATION.length;
  return COMMUNICATION[idx];
}
