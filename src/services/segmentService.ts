import { readStorage, writeStorage } from './storage';

const SEGMENTS_STORAGE_KEY = 'nexvg-segments';
const CLIENTS_STORAGE_KEY = 'nexvg-clients';

type ClientSegmentSource = {
  segment?: string;
};

function getSegmentsFromClientsCache(): string[] {
  const clients = readStorage<ClientSegmentSource[]>(CLIENTS_STORAGE_KEY, []);

  if (!Array.isArray(clients)) {
    return [];
  }

  return clients
    .map((client) => (client.segment ?? '').trim())
    .filter(Boolean);
}

export function getSegments(): string[] {
  const savedSegments = readStorage<string[]>(SEGMENTS_STORAGE_KEY, []);
  const cachedClientSegments = getSegmentsFromClientsCache();

  return Array.from(new Set([...savedSegments, ...cachedClientSegments])).sort((first, second) => first.localeCompare(second));
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
