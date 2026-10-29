import { SECRETS, type SecretId } from "@/content/types";
import { readJSON, writeJSON } from "./storage";

const KEY = "cv:secrets";
const EMPTY: readonly SecretId[] = [];
const listeners = new Set<() => void>();
let cache: readonly SecretId[] | null = null;

const isSecret = (v: unknown): v is SecretId => (SECRETS as readonly unknown[]).includes(v);

// External store for useSyncExternalStore: the server snapshot is always empty,
// so the found-secrets counter hydrates without a mismatch.
export const secretStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      cache = null;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  get(): readonly SecretId[] {
    if (!cache) cache = readJSON<unknown[]>(KEY, []).filter(isSecret);
    return cache;
  },
  getServer(): readonly SecretId[] {
    return EMPTY;
  },
  /** Returns true when the secret was not found before. */
  add(id: SecretId): boolean {
    const current = secretStore.get();
    if (current.includes(id)) return false;
    cache = [...current, id];
    writeJSON(KEY, cache);
    listeners.forEach((l) => l());
    return true;
  },
};
