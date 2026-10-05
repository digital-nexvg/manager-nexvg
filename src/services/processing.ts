import { useSyncExternalStore } from 'react';

type Task = { id: number; message: string };

let tasks: Task[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function startProcessing(message = 'Processando…') {
  const id = nextId++;
  tasks = [...tasks, { id, message }];
  emit();

  return () => {
    tasks = tasks.filter((task) => task.id !== id);
    emit();
  };
}

/** Wraps an async operation with the global processing indicator. */
export async function withProcessing<T>(operation: () => Promise<T>, message?: string): Promise<T> {
  const stop = startProcessing(message);
  try {
    return await operation();
  } finally {
    stop();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return tasks;
}

export function useProcessingMessage(): string | null {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return current.length ? current[current.length - 1].message : null;
}
