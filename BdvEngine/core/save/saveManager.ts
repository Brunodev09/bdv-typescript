import { Message } from '../com/message';

export const MESSAGE_SAVE_WRITTEN = "MESSAGE_SAVE_WRITTEN";
export const MESSAGE_SAVE_DELETED = "MESSAGE_SAVE_DELETED";

export interface SaveListEntry {
  slot: string;
  timestamp: number;
  size: number;
}

interface SaveRecord {
  slot: string;
  timestamp: number;
  size: number;
  data: string;
}

/**
 * Engine-agnostic persistent save system backed by IndexedDB.
 *
 * Stores arbitrary JSON-serializable data per named slot. All operations are
 * async (Promise-based) since IndexedDB is async. The first call to any
 * operation lazily opens the database; an explicit init() lets you choose a
 * custom database name per game.
 */
export class SaveManager {
  private static dbName: string = "BdvEngineSaves";
  private static readonly storeName: string = "saves";
  private static db: IDBDatabase | null = null;
  private static openPromise: Promise<IDBDatabase> | null = null;

  private constructor() {}

  /**
   * Open (or create) the save database. Calling this is optional; the first
   * read/write will open with the default database name. Pass a name to scope
   * saves per game when multiple games share an origin.
   */
  public static init(dbName?: string): Promise<IDBDatabase> {
    if (dbName !== undefined && dbName !== SaveManager.dbName) {
      SaveManager.close();
      SaveManager.dbName = dbName;
    }
    return SaveManager.open();
  }

  public static save(slot: string, data: any): Promise<void> {
    const serialized = JSON.stringify(data);
    const record: SaveRecord = {
      slot,
      timestamp: Date.now(),
      size: serialized.length,
      data: serialized,
    };
    return SaveManager.run("readwrite", (store) => store.put(record))
      .then(() => {
        Message.send(MESSAGE_SAVE_WRITTEN, SaveManager, { slot, size: record.size });
      });
  }

  public static load<T = any>(slot: string): Promise<T | null> {
    return SaveManager.run<SaveRecord | undefined>("readonly", (store) => store.get(slot))
      .then((record) => {
        if (!record) return null;
        return JSON.parse(record.data) as T;
      });
  }

  public static exists(slot: string): Promise<boolean> {
    return SaveManager.run<number>("readonly", (store) => store.count(slot))
      .then((count) => count > 0);
  }

  public static delete(slot: string): Promise<void> {
    return SaveManager.run("readwrite", (store) => store.delete(slot))
      .then(() => {
        Message.send(MESSAGE_SAVE_DELETED, SaveManager, { slot });
      });
  }

  public static list(): Promise<SaveListEntry[]> {
    return SaveManager.run<SaveRecord[]>("readonly", (store) => store.getAll())
      .then((records) => records
        .map((r) => ({ slot: r.slot, timestamp: r.timestamp, size: r.size }))
        .sort((a, b) => b.timestamp - a.timestamp));
  }

  public static clear(): Promise<void> {
    return SaveManager.run("readwrite", (store) => store.clear()).then(() => {});
  }

  public static close(): void {
    if (SaveManager.db) {
      SaveManager.db.close();
      SaveManager.db = null;
    }
    SaveManager.openPromise = null;
  }

  private static open(): Promise<IDBDatabase> {
    if (SaveManager.db) return Promise.resolve(SaveManager.db);
    if (SaveManager.openPromise) return SaveManager.openPromise;

    SaveManager.openPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(SaveManager.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(SaveManager.storeName)) {
          db.createObjectStore(SaveManager.storeName, { keyPath: "slot" });
        }
      };
      request.onsuccess = () => {
        SaveManager.db = request.result;
        SaveManager.db.onclose = () => {
          SaveManager.db = null;
          SaveManager.openPromise = null;
        };
        resolve(SaveManager.db);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("SaveManager::IndexedDB open blocked."));
    });
    return SaveManager.openPromise;
  }

  private static run<T = void>(
    mode: IDBTransactionMode,
    op: (store: IDBObjectStore) => IDBRequest,
  ): Promise<T> {
    return SaveManager.open().then((db) => new Promise<T>((resolve, reject) => {
      const tx = db.transaction(SaveManager.storeName, mode);
      const store = tx.objectStore(SaveManager.storeName);
      const req = op(store);
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    }));
  }
}
