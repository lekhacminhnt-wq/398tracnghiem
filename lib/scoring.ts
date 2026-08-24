export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const PASS_RATIO = 0.7;

export function isPassed(score: number, total: number) {
  return total > 0 && score / total >= PASS_RATIO - 1e-9;
}
