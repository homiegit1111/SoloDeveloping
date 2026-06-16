// ============================================================
// GYM CURRICULUM — beginner → intermediate progression.
// Exact workouts with sets, reps, rest. A repeating weekly split
// that progressively overloads. Supplemented heavily by uploaded
// gym books (form tips pulled from book chunks by the AI planner).
// ============================================================

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  form: string;
}

export interface GymDay {
  day: string; // split label
  focus: string;
  warmup: string;
  exercises: Exercise[];
  finisher?: string;
}

// 6-day Push/Pull/Legs split with a rest day on day 7.
export const GYM_SPLIT: GymDay[] = [
  {
    day: "Push A",
    focus: "Chest · Shoulders · Triceps",
    warmup: "5 min light cardio + arm circles + 1 light warmup set per first exercise.",
    exercises: [
      { name: "Push-ups (or Bench Press)", sets: "4", reps: "8-12", rest: "90s", form: "Elbows ~45°, chest to floor, full lockout. Brace core." },
      { name: "Dumbbell Shoulder Press", sets: "3", reps: "8-12", rest: "90s", form: "Press overhead, don't flare elbows fully. Control the descent." },
      { name: "Incline Push-ups / Incline Press", sets: "3", reps: "10-12", rest: "75s", form: "Targets upper chest. Squeeze at top." },
      { name: "Lateral Raises", sets: "3", reps: "12-15", rest: "60s", form: "Lead with elbows, raise to shoulder height, no swinging." },
      { name: "Triceps Dips / Pushdowns", sets: "3", reps: "10-12", rest: "60s", form: "Full extension, keep elbows tucked." },
    ],
    finisher: "Push-up burnout: max clean reps in one set.",
  },
  {
    day: "Pull A",
    focus: "Back · Biceps · Rear Delts",
    warmup: "5 min cardio + band pull-aparts + scapular hangs.",
    exercises: [
      { name: "Pull-ups (or Lat Pulldown)", sets: "4", reps: "5-10", rest: "120s", form: "Full hang to chin over bar. Pull elbows down, not just arms." },
      { name: "Bent-over Rows", sets: "4", reps: "8-12", rest: "90s", form: "Flat back, pull to belly button, squeeze shoulder blades." },
      { name: "Face Pulls", sets: "3", reps: "12-15", rest: "60s", form: "Pull to forehead, externally rotate. Great for posture." },
      { name: "Bicep Curls", sets: "3", reps: "10-12", rest: "60s", form: "No swinging, full squeeze at top, slow lower." },
      { name: "Hammer Curls", sets: "3", reps: "10-12", rest: "60s", form: "Neutral grip, controlled." },
    ],
    finisher: "Dead hang for max time × 2.",
  },
  {
    day: "Legs A",
    focus: "Quads · Hamstrings · Glutes · Calves",
    warmup: "5 min cardio + bodyweight squats + leg swings.",
    exercises: [
      { name: "Squats (Goblet or Barbell)", sets: "4", reps: "8-12", rest: "120s", form: "Chest up, knees track toes, break parallel, drive through heels." },
      { name: "Romanian Deadlifts", sets: "3", reps: "8-12", rest: "100s", form: "Hinge at hips, slight knee bend, flat back, feel hamstrings stretch." },
      { name: "Walking Lunges", sets: "3", reps: "10-12/leg", rest: "75s", form: "Long step, back knee toward floor, torso upright." },
      { name: "Leg Curls / Nordic Curls", sets: "3", reps: "10-12", rest: "60s", form: "Control the eccentric — that's where growth happens." },
      { name: "Calf Raises", sets: "4", reps: "15-20", rest: "45s", form: "Full stretch at bottom, pause at top." },
    ],
    finisher: "Wall sit 60s × 2.",
  },
  {
    day: "Push B",
    focus: "Shoulders · Chest · Triceps (heavier)",
    warmup: "5 min cardio + shoulder dislocates with band.",
    exercises: [
      { name: "Overhead Press", sets: "4", reps: "6-10", rest: "120s", form: "Brace, press straight up, glutes tight. No lower-back arch." },
      { name: "Bench / Weighted Push-ups", sets: "4", reps: "6-10", rest: "100s", form: "Heavier today, fewer reps. Control descent." },
      { name: "Arnold Press", sets: "3", reps: "10-12", rest: "75s", form: "Rotate palms through the press — full delt activation." },
      { name: "Lateral Raises", sets: "4", reps: "12-15", rest: "60s", form: "Strict, no momentum." },
      { name: "Overhead Triceps Extension", sets: "3", reps: "10-12", rest: "60s", form: "Elbows in, full stretch behind head." },
    ],
  },
  {
    day: "Pull B",
    focus: "Back width · Biceps (heavier)",
    warmup: "5 min cardio + band pull-aparts.",
    exercises: [
      { name: "Weighted Pull-ups / Pulldown", sets: "4", reps: "6-10", rest: "120s", form: "Add load if bodyweight is easy. Full range." },
      { name: "Seated / Cable Rows", sets: "4", reps: "8-12", rest: "90s", form: "Squeeze back, don't lean for momentum." },
      { name: "Single-arm Dumbbell Row", sets: "3", reps: "8-12/side", rest: "75s", form: "Brace on bench, pull to hip, full stretch." },
      { name: "Reverse Flyes", sets: "3", reps: "12-15", rest: "60s", form: "Rear delts — light weight, strict." },
      { name: "Barbell / EZ Curls", sets: "3", reps: "8-12", rest: "60s", form: "Heavier today. Strict form." },
    ],
  },
  {
    day: "Legs B + Core",
    focus: "Posterior chain · Core",
    warmup: "5 min cardio + hip openers + glute bridges.",
    exercises: [
      { name: "Deadlifts", sets: "4", reps: "5-8", rest: "150s", form: "Bar over mid-foot, flat back, push the floor away. King of lifts." },
      { name: "Bulgarian Split Squats", sets: "3", reps: "8-10/leg", rest: "90s", form: "Rear foot elevated, drop straight down, drive through front heel." },
      { name: "Hip Thrusts", sets: "3", reps: "10-15", rest: "75s", form: "Squeeze glutes hard at top, chin tucked." },
      { name: "Hanging Leg Raises", sets: "3", reps: "10-15", rest: "60s", form: "Control, no swinging. Lower legs slowly." },
      { name: "Plank", sets: "3", reps: "45-60s", rest: "45s", form: "Straight line head-to-heel, brace abs." },
    ],
    finisher: "Russian twists 3 × 20.",
  },
];

export const REST_DAY: GymDay = {
  day: "Active Recovery",
  focus: "Mobility · Walk · Stretch",
  warmup: "—",
  exercises: [
    { name: "Brisk Walk", sets: "1", reps: "20-30 min", rest: "—", form: "Get steps in, sunlight, decompress." },
    { name: "Full-body Stretch / Mobility", sets: "1", reps: "10-15 min", rest: "—", form: "Hold each stretch 30s, breathe deep." },
  ],
  finisher: "Foam roll tight areas. Recovery is where muscle is built.",
};

// Beginner note shown for the first 14 days
export const BEGINNER_NOTE =
  "First 2 weeks: focus on FORM over weight. Master the movement, build the habit of showing up. Strength follows consistency.";

export function gymForDay(dayNumber: number): GymDay {
  const inWeek = (Math.max(1, dayNumber) - 1) % 7; // 0..6
  if (inWeek === 6) return REST_DAY;
  return GYM_SPLIT[inWeek % GYM_SPLIT.length];
}
