// ============================================================
// MATHS CURRICULUM — absolute basics -> government exam prep
// One topic per day. Progressive. Each has a lesson + worked
// example + practice problems (with answers).
// Day N maps to TOPIC index = (N-1) % MATHS.length so it always
// has content, then loops with harder framing handled by AI.
// ============================================================

export interface MathsTopic {
  unit: string;
  title: string;
  lesson: string;
  example: string;
  practice: { q: string; a: string }[];
}

export const MATHS: MathsTopic[] = [
  {
    unit: "Number System",
    title: "Natural, Whole & Integers",
    lesson:
      "Natural numbers (1,2,3…) are counting numbers. Add 0 → whole numbers. Add negatives → integers (…-2,-1,0,1,2…). Number line: left = smaller, right = larger.",
    example: "Order -3, 2, 0, -1, 5 → -3, -1, 0, 2, 5.",
    practice: [
      { q: "Which is greater: -7 or -2?", a: "-2 (closer to 0 on the right)" },
      { q: "Sum of first 5 natural numbers?", a: "1+2+3+4+5 = 15" },
      { q: "Is 0 a natural number?", a: "No — it's a whole number, not natural." },
    ],
  },
  {
    unit: "Number System",
    title: "Place Value & Face Value",
    lesson:
      "Face value = the digit itself. Place value = digit × its position value. In 4827, place value of 8 = 800, face value = 8.",
    example: "In 5,932: place value of 9 = 900; of 3 = 30.",
    practice: [
      { q: "Place value of 7 in 6743?", a: "700" },
      { q: "Difference of place & face value of 6 in 4651?", a: "600 - 6 = 594" },
      { q: "Face value of 0 in 4097?", a: "0" },
    ],
  },
  {
    unit: "Operations",
    title: "BODMAS — Order of Operations",
    lesson:
      "BODMAS: Brackets → Orders (powers/roots) → Division → Multiplication → Addition → Subtraction. Do left to right within same level.",
    example: "12 + 6 ÷ 2 × 3 = 12 + 3 × 3 = 12 + 9 = 21.",
    practice: [
      { q: "8 + 2 × 5", a: "8 + 10 = 18" },
      { q: "(6 + 4) ÷ 2 + 3²", a: "10÷2 + 9 = 5 + 9 = 14" },
      { q: "20 - 4 × 3 + 6 ÷ 2", a: "20 - 12 + 3 = 11" },
    ],
  },
  {
    unit: "Factors & Multiples",
    title: "HCF & LCM",
    lesson:
      "HCF = largest number dividing all. LCM = smallest number divisible by all. HCF × LCM = product of two numbers. Use prime factorisation.",
    example: "12 = 2²×3, 18 = 2×3². HCF = 2×3 = 6. LCM = 2²×3² = 36.",
    practice: [
      { q: "HCF of 24 and 36?", a: "12" },
      { q: "LCM of 4 and 6?", a: "12" },
      { q: "If HCF=4, LCM=48, one number=16, other?", a: "(4×48)/16 = 12" },
    ],
  },
  {
    unit: "Fractions",
    title: "Fractions & Decimals",
    lesson:
      "Fraction = part/whole. Add/subtract: common denominator. Multiply: across. Divide: multiply by reciprocal. Decimal = fraction in base 10.",
    example: "1/2 + 1/3 = 3/6 + 2/6 = 5/6 ≈ 0.833.",
    practice: [
      { q: "3/4 of 80?", a: "60" },
      { q: "2/5 + 1/10?", a: "4/10 + 1/10 = 5/10 = 1/2" },
      { q: "0.25 as a fraction?", a: "1/4" },
    ],
  },
  {
    unit: "Percentages",
    title: "Percentage Basics",
    lesson:
      "Percent = per 100. x% of N = (x/100)×N. To convert fraction→%, ×100. Increase/decrease %, = (change/original)×100.",
    example: "15% of 200 = (15/100)×200 = 30.",
    practice: [
      { q: "20% of 350?", a: "70" },
      { q: "What % is 45 of 180?", a: "(45/180)×100 = 25%" },
      { q: "Price 500→600, % increase?", a: "(100/500)×100 = 20%" },
    ],
  },
  {
    unit: "Percentages",
    title: "Profit, Loss & Discount",
    lesson:
      "Profit% = (SP-CP)/CP ×100. Loss% = (CP-SP)/CP ×100. Discount% on Marked Price = (MP-SP)/MP ×100.",
    example: "CP 400, SP 500 → profit 100 → 25% profit.",
    practice: [
      { q: "CP 250, SP 200. Loss%?", a: "(50/250)×100 = 20%" },
      { q: "MP 800, discount 10%, SP?", a: "800 - 80 = 720" },
      { q: "20% profit on CP 600, SP?", a: "600 + 120 = 720" },
    ],
  },
  {
    unit: "Ratio",
    title: "Ratio & Proportion",
    lesson:
      "Ratio compares quantities a:b. Proportion: a:b = c:d means ad = bc. To divide N in ratio a:b → parts = aN/(a+b), bN/(a+b).",
    example: "Divide 100 in 2:3 → 40 and 60.",
    practice: [
      { q: "Simplify 18:24", a: "3:4" },
      { q: "Divide 90 in ratio 4:5", a: "40 and 50" },
      { q: "If 3:5 = 9:x, x?", a: "15" },
    ],
  },
  {
    unit: "Averages",
    title: "Average (Mean)",
    lesson:
      "Average = sum of values ÷ number of values. If average of n numbers is A, sum = nA.",
    example: "Avg of 10,20,30 = 60/3 = 20.",
    practice: [
      { q: "Average of 4,8,12,16?", a: "40/4 = 10" },
      { q: "Avg of 5 numbers is 12, sum?", a: "60" },
      { q: "Avg of first 5 even numbers?", a: "(2+4+6+8+10)/5 = 6" },
    ],
  },
  {
    unit: "Time",
    title: "Time, Speed & Distance",
    lesson:
      "Speed = Distance/Time. Distance = Speed×Time. Time = Distance/Speed. Convert km/h → m/s by ×5/18.",
    example: "60 km in 2 h → 30 km/h. 72 km/h = 72×5/18 = 20 m/s.",
    practice: [
      { q: "Distance at 40 km/h for 3 h?", a: "120 km" },
      { q: "Time for 150 km at 50 km/h?", a: "3 h" },
      { q: "36 km/h in m/s?", a: "10 m/s" },
    ],
  },
  {
    unit: "Time",
    title: "Time & Work",
    lesson:
      "If A does a job in n days, A's 1-day work = 1/n. Combine rates by adding. Together time = 1 ÷ (sum of rates).",
    example: "A:10 days, B:15 days → together 1/10+1/15 = 1/6 → 6 days.",
    practice: [
      { q: "A:6 days, B:12 days, together?", a: "1/6+1/12=1/4 → 4 days" },
      { q: "A does job in 8 days. Work in 1 day?", a: "1/8" },
      { q: "A:20, B:30 days, together?", a: "1/20+1/30 = 1/12 → 12 days" },
    ],
  },
  {
    unit: "Interest",
    title: "Simple Interest",
    lesson: "SI = (P×R×T)/100. Amount = P + SI. P=principal, R=rate%, T=time(yrs).",
    example: "P=1000, R=5%, T=2 → SI = (1000×5×2)/100 = 100.",
    practice: [
      { q: "SI on 2000 at 10% for 3 yrs?", a: "600" },
      { q: "Amount: 500 at 8% for 2 yrs?", a: "500 + 80 = 580" },
      { q: "Rate if 400 gives SI 96 in 3 yrs?", a: "R = (96×100)/(400×3) = 8%" },
    ],
  },
  {
    unit: "Interest",
    title: "Compound Interest",
    lesson:
      "A = P(1 + R/100)^T. CI = A - P. Interest on interest, compounding each period.",
    example: "P=1000, R=10%, T=2 → A = 1000×1.1×1.1 = 1210, CI = 210.",
    practice: [
      { q: "CI on 5000 at 10% for 2 yrs?", a: "A=6050, CI=1050" },
      { q: "A on 2000 at 5% for 2 yrs?", a: "2000×1.05² = 2205" },
      { q: "Difference CI-SI on 1000,10%,2yrs?", a: "210-200 = 10" },
    ],
  },
  {
    unit: "Algebra",
    title: "Algebraic Basics & Linear Equations",
    lesson:
      "Variable stands for unknown. Solve linear eqn by isolating x. Whatever you do to one side, do to the other.",
    example: "2x + 5 = 15 → 2x = 10 → x = 5.",
    practice: [
      { q: "Solve 3x - 4 = 11", a: "x = 5" },
      { q: "Solve x/2 + 3 = 7", a: "x = 8" },
      { q: "Solve 5(x-2) = 20", a: "x = 6" },
    ],
  },
  {
    unit: "Algebra",
    title: "Identities & Factorisation",
    lesson:
      "(a+b)² = a²+2ab+b². (a-b)² = a²-2ab+b². a²-b² = (a+b)(a-b). Use to simplify and factor fast.",
    example: "x²-9 = (x+3)(x-3).",
    practice: [
      { q: "Expand (x+4)²", a: "x²+8x+16" },
      { q: "Factor x²-25", a: "(x+5)(x-5)" },
      { q: "If a+b=7, ab=12, a²+b²?", a: "(a+b)²-2ab = 49-24 = 25" },
    ],
  },
  {
    unit: "Geometry",
    title: "Lines, Angles & Triangles",
    lesson:
      "Angles on a straight line = 180°. Triangle angles sum = 180°. Right angle = 90°. Pythagoras: a²+b²=c² (right triangle).",
    example: "Triangle with 50° and 60° → third = 70°.",
    practice: [
      { q: "Two angles 35°,45° in triangle, third?", a: "100°" },
      { q: "Right triangle legs 3,4. Hypotenuse?", a: "5" },
      { q: "Angles on straight line: one is 110°, other?", a: "70°" },
    ],
  },
  {
    unit: "Mensuration",
    title: "Area & Perimeter",
    lesson:
      "Rectangle: A=l×b, P=2(l+b). Square: A=s², P=4s. Circle: A=πr², C=2πr. Triangle: A=½×base×height.",
    example: "Rectangle 5×3 → A=15, P=16.",
    practice: [
      { q: "Area of circle r=7 (π=22/7)?", a: "154" },
      { q: "Perimeter of square side 9?", a: "36" },
      { q: "Area of triangle base 10, height 6?", a: "30" },
    ],
  },
  {
    unit: "Mensuration",
    title: "Volume & Surface Area",
    lesson:
      "Cube: V=s³. Cuboid: V=l×b×h. Cylinder: V=πr²h. Sphere: V=(4/3)πr³.",
    example: "Cuboid 4×3×2 → V = 24.",
    practice: [
      { q: "Volume of cube side 5?", a: "125" },
      { q: "Volume cylinder r=7,h=10 (π=22/7)?", a: "1540" },
      { q: "Volume cuboid 6×5×2?", a: "60" },
    ],
  },
  {
    unit: "Data Interpretation",
    title: "Reading Tables & Bar Graphs",
    lesson:
      "DI tests extracting numbers from tables/graphs then applying %, ratio, average. Read the question first, then scan only the needed cells.",
    example:
      "Sales: Jan 200, Feb 300. % growth = (100/200)×100 = 50%.",
    practice: [
      { q: "Values 40,60,80,20. Average?", a: "50" },
      { q: "A=120, B=80. A is what % more than B?", a: "(40/80)×100 = 50%" },
      { q: "Total 500, part 125. % share?", a: "25%" },
    ],
  },
  {
    unit: "Data Interpretation",
    title: "Pie Charts",
    lesson:
      "Whole pie = 360° = 100%. Sector value = (sector°/360)×Total, or (sector%/100)×Total.",
    example: "Total 7200, sector 90° → (90/360)×7200 = 1800.",
    practice: [
      { q: "Sector 72° of total 1000?", a: "(72/360)×1000 = 200" },
      { q: "25% sector in degrees?", a: "90°" },
      { q: "Sector 25% of 4000?", a: "1000" },
    ],
  },
  {
    unit: "Reasoning",
    title: "Number Series",
    lesson:
      "Find the rule: +, -, ×, ÷, squares, alternating. Check the gap between terms.",
    example: "2,4,8,16,? → ×2 → 32.",
    practice: [
      { q: "3,6,9,12,?", a: "15 (+3)" },
      { q: "1,4,9,16,?", a: "25 (squares)" },
      { q: "2,5,10,17,?", a: "26 (+3,+5,+7,+9)" },
    ],
  },
  {
    unit: "Reasoning",
    title: "Coding-Decoding & Analogy",
    lesson:
      "Letters mapped by shift or position. A=1…Z=26. Spot the pattern and apply it back.",
    example: "If CAT=24 (3+1+20), then DOG = 4+15+7 = 26.",
    practice: [
      { q: "If A=1, sum of letters in 'BAD'?", a: "2+1+4 = 7" },
      { q: "Cat:Kitten :: Dog:?", a: "Puppy" },
      { q: "Shift each letter +1: 'ABC' →", a: "BCD" },
    ],
  },
  {
    unit: "Reasoning",
    title: "Blood Relations & Direction Sense",
    lesson:
      "Draw a quick diagram. For directions: N up, S down, E right, W left; right turn = clockwise.",
    example: "Facing North, turn right → now facing East.",
    practice: [
      { q: "Facing South, turn left, facing?", a: "East" },
      { q: "My father's son (not me) is my?", a: "Brother" },
      { q: "Walk 3km N then 4km E, distance from start?", a: "5 km (3-4-5)" },
    ],
  },
];

export function mathsForDay(dayNumber: number): MathsTopic {
  const idx = (Math.max(1, dayNumber) - 1) % MATHS.length;
  return MATHS[idx];
}
