function fallbackId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === 'x' ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return fallbackId();
}
