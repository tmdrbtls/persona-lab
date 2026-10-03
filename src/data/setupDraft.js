const DB_NAME = "personalab-setup";
const STORE_NAME = "drafts";
const DRAFT_KEY = "current";
const META_KEY = "personalab-setup-draft-meta";
const VERSION = 1;

let databasePromise;
let pendingWrite = Promise.resolve();

function database() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch(error => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

async function transact(mode, operation) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function enqueue(operation) {
  const result = pendingWrite.then(operation);
  pendingWrite = result.catch(() => {});
  return result;
}

export function getSetupDraftMeta() {
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY) || "null");
    return meta?.version === VERSION ? meta : null;
  } catch { return null; }
}

export async function loadSetupDraft() {
  await pendingWrite;
  const record = await transact("readonly", store => store.get(DRAFT_KEY));
  if (record?.version === VERSION && record.draft) return record;
  try { localStorage.removeItem(META_KEY); } catch { /* 저장소 접근 제한 */ }
  return null;
}

export function saveSetupDraft(draft, step) {
  return enqueue(async () => {
    const meta = { version: VERSION, name: draft.product.name || "이름 없는 테스트", step, updatedAt: Date.now() };
    await transact("readwrite", store => store.put({ version: VERSION, draft, step }, DRAFT_KEY));
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* 초안 자체는 IndexedDB에 저장됨 */ }
    return meta;
  });
}

export function clearSetupDraft() {
  return enqueue(async () => {
    await transact("readwrite", store => store.delete(DRAFT_KEY));
    try { localStorage.removeItem(META_KEY); } catch { /* 저장소 접근 제한 */ }
  });
}
