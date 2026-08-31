type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
}

export function readStorage<T>(key: string, fallback: T): T {
  const storage = getStorage();

  if (!storage) {
    return fallback;
  }

  const raw = storage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function notifyStorageUpdate(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent('nexvg-storage-update'));
}

export function writeStorage<T>(key: string, value: T): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
  notifyStorageUpdate();
}

// Writes without dispatching the update event, for use when caching data that was just fetched
// (avoids re-triggering every 'nexvg-storage-update' listener, which would refetch and loop).
export function writeStorageSilently<T>(key: string, value: T): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}
