const finishThreshold = 0.82;
const flingDeceleration = 3_600; // CSS pixels per second squared.
const maxReleaseSpeed = 2_200;
const sampleWindow = 80; // Milliseconds.

type PointerSample = { x: number; time: number };

export function recordSwipeSample(samples: PointerSample[], sample: PointerSample) {
  samples.push(sample);
  // Keep the last sample before the window so a fast flick with few events still has a baseline.
  while (samples.length > 2 && samples[1].time <= sample.time - sampleWindow) samples.shift();
}

export function swipeReleaseSpeed(samples: PointerSample[]) {
  const first = samples[0];
  const last = samples[samples.length - 1];
  const seconds = Math.max(0.008, (last.time - first.time) / 1_000);
  const velocity = (last.x - first.x) / seconds;
  return Math.max(-maxReleaseSpeed, Math.min(maxReleaseSpeed, velocity));
}

export function reachesSwipeEnd(travel: number, distance: number, forwardSpeed: number) {
  const momentumTravel = Math.max(0, forwardSpeed) ** 2 / (2 * flingDeceleration);
  return travel >= Math.min(18, distance * 0.12) && travel + momentumTravel >= distance * finishThreshold;
}

export type SwipeSpring = { position: number; velocity: number; target: number };

export function stepSwipeSpring(spring: SwipeSpring, seconds: number) {
  // Closed-form damped spring with unit mass. Motion stays consistent across frame rates.
  const stiffness = 330;
  const decay = 23 / 2;
  const frequency = Math.sqrt(stiffness - decay ** 2);
  const displacement = spring.position - spring.target;
  const sineWeight = (spring.velocity + decay * displacement) / frequency;
  const sine = Math.sin(frequency * seconds);
  const cosine = Math.cos(frequency * seconds);
  const envelope = Math.exp(-decay * seconds);
  const offset = envelope * (displacement * cosine + sineWeight * sine);
  spring.position = spring.target + offset;
  spring.velocity = envelope * frequency * (sineWeight * cosine - displacement * sine) - decay * offset;
  return Math.abs(offset) < 0.35 && Math.abs(spring.velocity) < 8;
}
