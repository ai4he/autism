// IndexedDB wrapper for PWA offline storage
import { BehaviorEntry, Reinforcer, CrisisProtocol } from '@/types';

const DB_NAME = 'ABATrackerDB';
const DB_VERSION = 1;

export const STORES = {
  BEHAVIORS: 'behaviors',
  REINFORCERS: 'reinforcers',
  CRISIS_PROTOCOLS: 'crisisProtocols',
} as const;

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create Behaviors store
        if (!db.objectStoreNames.contains(STORES.BEHAVIORS)) {
          const behaviorStore = db.createObjectStore(STORES.BEHAVIORS, {
            keyPath: 'id',
          });
          behaviorStore.createIndex('date', 'date', { unique: false });
          behaviorStore.createIndex('severity', 'severity', { unique: false });
          behaviorStore.createIndex('function', 'function', { unique: false });
        }

        // Create Reinforcers store
        if (!db.objectStoreNames.contains(STORES.REINFORCERS)) {
          const reinforcerStore = db.createObjectStore(STORES.REINFORCERS, {
            keyPath: 'id',
          });
          reinforcerStore.createIndex('type', 'type', { unique: false });
          reinforcerStore.createIndex('lastUsed', 'lastUsed', { unique: false });
        }

        // Create Crisis Protocols store
        if (!db.objectStoreNames.contains(STORES.CRISIS_PROTOCOLS)) {
          const crisisStore = db.createObjectStore(STORES.CRISIS_PROTOCOLS, {
            keyPath: 'id',
          });
          crisisStore.createIndex('isActive', 'isActive', { unique: false });
        }
      };
    });
  }

  async add<T>(storeName: string, item: T): Promise<string> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error);
    });
  }

  async update<T>(storeName: string, item: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query<T>(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new Database();
