import { readStorage, writeStorage } from './storage';

const STORAGE_KEY = 'nexvg-segments';

export function getSegments(): string[] {
  const parsed = readStorage<string[]>(STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
}

export function saveSegments(segments: string[]): void {
  writeStorage(STORAGE_KEY, segments);
}

export function createSegment(name: string): string[] {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return getSegments();
  }

  const nextSegments = Array.from(new Set([...getSegments(), normalizedName])).sort((first, second) => first.localeCompare(second));
  saveSegments(nextSegments);
  return nextSegments;
}
