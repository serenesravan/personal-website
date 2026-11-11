export function seededRandom(seed: string) {
  let state = 2166136261;
  for (const character of seed) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  }
  if (state === 0) state = 1;

  return (limit: number) => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) % limit;
  };
}

export function shuffle<T>(values: readonly T[], next: (limit: number) => number) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = next(index + 1);
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}
