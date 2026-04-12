declare global {
  interface Window {
    storage: {
      get(key: string): Promise<{ key: string; value: string }>;
      set(key: string, value: string): Promise<{ key: string; value: string }>;
      delete(key: string): Promise<{ key: string; deleted: boolean }>;
      list(prefix?: string): Promise<{ keys: string[] }>;
    };
  }
}

export async function storageGet<T>(key: string): Promise<T | null> {
  try {
    const result = await window.storage.get(key);
    return JSON.parse(result.value) as T;
  } catch {
    return null;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  await window.storage.set(key, JSON.stringify(value));
}

export async function storageDelete(key: string): Promise<void> {
  await window.storage.delete(key);
}

export async function storageList(prefix?: string): Promise<string[]> {
  const result = await window.storage.list(prefix);
  return result.keys;
}
