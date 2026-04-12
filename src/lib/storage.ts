declare global {
  interface Window {
    storage?: {
      get(key: string): Promise<{ key: string; value: string }>;
      set(key: string, value: string): Promise<{ key: string; value: string }>;
      delete(key: string): Promise<{ key: string; deleted: boolean }>;
      list(prefix?: string): Promise<{ keys: string[] }>;
    };
  }
}

// Use window.storage if available, otherwise fall back to localStorage
function hasWindowStorage(): boolean {
  return typeof window !== 'undefined' && !!window.storage;
}

export async function storageGet<T>(key: string): Promise<T | null> {
  try {
    if (hasWindowStorage()) {
      const result = await window.storage!.get(key);
      return JSON.parse(result.value) as T;
    }
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  const json = JSON.stringify(value);
  if (hasWindowStorage()) {
    await window.storage!.set(key, json);
  } else {
    localStorage.setItem(key, json);
  }
}

export async function storageDelete(key: string): Promise<void> {
  if (hasWindowStorage()) {
    await window.storage!.delete(key);
  } else {
    localStorage.removeItem(key);
  }
}

export async function storageList(prefix?: string): Promise<string[]> {
  if (hasWindowStorage()) {
    const result = await window.storage!.list(prefix);
    return result.keys;
  }
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (!prefix || key.startsWith(prefix))) {
      keys.push(key);
    }
  }
  return keys;
}
