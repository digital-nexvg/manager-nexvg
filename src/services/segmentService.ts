export function getSegments(): string[] {
  return [];
}

export function saveSegments(_segments: string[]): void {
  // segment persistence is handled by the backend when available
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
