import { readStorage, writeStorage } from './storage';

const SEGMENTS_STORAGE_KEY = 'nexvg-segments';

export function getSegments(): string[] {
  return readStorage<string[]>(SEGMENTS_STORAGE_KEY, []);
}

export function saveSegments(segments: string[]): void {
  writeStorage(SEGMENTS_STORAGE_KEY, segments);
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
