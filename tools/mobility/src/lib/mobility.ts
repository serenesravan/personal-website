import { seededRandom, shuffle } from "./seeded-random";

export const drills = [
  {
    id: "drill-1",
    movement: "flexion",
    name: "Small cat–cow",
    dose: "6–8 slow reps",
    text: "Start on hands and knees. Breathe out as you gently round your back. Return through neutral into a small, comfortable arch. Keep your neck relaxed.",
    source: "https://www.tims.nhs.uk/wp-content/uploads/2024/08/TIMS-Managing-Thoracic-Back-Pain-July-2024.pdf",
  },
  {
    id: "drill-2",
    movement: "rotation",
    name: "Thread-the-needle",
    dose: "5 reps per side",
    text: "From hands and knees, slide your right arm under your left, palm up. Let your chest turn while your hips stay roughly above your knees. Pause for one easy breath, then return. Switch sides.",
    source: "https://www.southtees.nhs.uk/resources/threading-the-needle/",
  },
  {
    id: "drill-3",
    movement: "side-bend",
    name: "Diagonal child’s pose",
    dose: "2 × 20 sec per side",
    text: "Sit your hips back as far as comfortable. Walk both hands left to stretch the right side of your back, then switch. Keep your hips roughly centered and breathe normally. A small reach is enough.",
    source: "https://www.fhft.nhs.uk/patients-and-visitors/patient-information-library/pelvic-health-exercises/submit/7561",
  },
  {
    id: "drill-4",
    movement: "reach",
    name: "Counter-supported rock-back",
    dose: "2 × 20 sec",
    text: "Put both hands on a sturdy counter and step back. Send your hips back with soft knees and lower your chest slightly. Stop at the first mild stretch, before your ribs flare or your neck tips back.",
    source: "https://www.cuh.nhs.uk/patient-information/thoracic-spine-exercises/",
  },
  {
    id: "drill-5",
    movement: "extension",
    name: "Mid-back roller extension",
    dose: "3 slow reps",
    text: "Lie with knees bent and the roller across your mid-back near the lower edge of your shoulder blades. Support your head, keep your hips down, and gently tip your upper back over the roller. A rolled towel is an easier start. Keep pressure off tender ribs and your low back. If comfortable, add a second spot slightly higher.",
    source: "https://bmjopensem.bmj.com/content/bmjosem/6/1/e000713/DC2/embed/inline-supplementary-material-2.pdf?download=true",
  },
  {
    id: "drill-6",
    movement: "reach",
    name: "Wall slide → light band wall slide",
    dose: "1 × 6, then 2 × 6–8",
    text: "Face a wall and slide your hands up as far as comfortable while your ribs stay relaxed. Lower slowly. Once the plain slide feels controlled, try a light loop around your wrists with gentle outward tension.",
    source: "https://rightdecisions.scot.nhs.uk/media/alqcguhk/shoulder-rehabilitation-exercises.pdf",
  },

  {
    id: "drill-7",
    movement: "side-bend",
    name: "Seated side-bend",
    dose: "5–6 slow reps per side",
    text: "Sit with your feet flat and arms crossed. Keep both sitting bones on the chair. Gently tip your rib cage to the left until you feel a mild stretch on the right. Return to center and switch sides.",
    source: "https://www.cuh.nhs.uk/patient-information/thoracic-spine-exercises/",
  },
  {
    id: "drill-8",
    movement: "reach",
    name: "Lying single-arm overhead reach",
    dose: "5–8 reps per side",
    text: "Lie on your back with knees bent and feet flat. Start with one hand pointing at the ceiling. Breathe out and take that arm overhead slowly. Stop when your lower ribs start to lift or your low back starts to arch more.",
    source: "https://www.acefitness.org/resources/everyone/exercise-library/123/supine-shoulder-flexion/",
  },
  {
    id: "drill-9",
    movement: "control",
    name: "Hands-and-knees arm reach → bird dog",
    dose: "5 reps per side",
    text: "From all fours, reach one arm forward while keeping your chest and hips facing the floor. Once that feels steady, reach the opposite leg back at the same time. Keep the reach small enough to stay steady.",
    source: "https://www.tims.nhs.uk/wp-content/uploads/2024/08/TIMS-Managing-Thoracic-Back-Pain-July-2024.pdf",
  },
  {
    id: "drill-10",
    movement: "rotation",
    name: "Half-kneeling wall rotation",
    dose: "5 slow reps per side",
    text: "Kneel beside a wall with one foot forward. Keep one arm pointing forward and sweep the other open at about shoulder height. Let your chest turn while your pelvis stays steady.",
    source: "https://www.harrishealth.org/SiteCollectionDocuments/exercises-at-home.pdf",
  },
] as const;

export function isDrillAnchor(anchor: string) {
  return drills.some((drill) => drill.id === anchor);
}

export function dailyDrills(day: string) {
  // Seed the shuffle with the local calendar date so refreshes keep the same session.
  const next = seededRandom(day);
  const count = 3 + next(2);
  const pool = shuffle(drills, next);

  const session: (typeof drills)[number][] = [];
  const movements = new Set<string>();
  for (const drill of pool) {
    if (movements.has(drill.movement)) continue;
    movements.add(drill.movement);
    session.push(drill);
    if (session.length === count) break;
  }
  return session;
}
