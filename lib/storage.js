// Client-side persistence for MedLens.
//
// There is no backend database in this build (see README — "What's not
// implemented"), so patient records are persisted in the browser's
// localStorage. This is enough for a single-device demo/judging session to
// close a tab, come back, and find their patients, records, and audit trail
// still there — it is NOT a substitute for a real encrypted, access-controlled
// clinical database, and the UI says so.
//
// There is no sign-in screen. Every browser/device gets a silent, randomly
// generated device id the first time the app loads, and all patient records
// for that device are namespaced under it automatically. On top of that,
// a lightweight "personal profile" can be created — but only implicitly,
// the first time someone adds a patient record and marks it as being for
// themselves (see NewPatientModal.js). Records added on behalf of someone
// else never require a profile at all.

const DEVICE_KEY = "medlens_device_v1";
const PROFILE_KEY = "medlens_profile_v1";
const RECORDS_KEY_PREFIX = "medlens_records_v2__";

function isBrowser() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function randomId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- Device namespace (replaces the old sign-in gate) ----------

export function getDeviceId() {
  if (!isBrowser()) return "anonymous";
  try {
    let id = window.localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = randomId("device");
      window.localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

function recordsKey(deviceId) {
  return `${RECORDS_KEY_PREFIX}${deviceId || "anonymous"}`;
}

// ---------- Personal profile (created automatically, never via a login form) ----------
// Used only to pre-fill and tag records the user adds for themselves.

export function getProfile() {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function createOrUpdateProfile({ displayName, age, sex }) {
  if (!isBrowser()) return null;
  const existing = getProfile();
  const profile = {
    id: existing?.id || randomId("profile"),
    displayName: (displayName || existing?.displayName || "").trim(),
    age: age ?? existing?.age ?? "",
    sex: sex ?? existing?.sex ?? "",
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function clearProfile() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PROFILE_KEY);
}

// ---------- Patient records ----------

export function listRecords(deviceId) {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(recordsKey(deviceId));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveAllRecords(deviceId, records) {
  if (!isBrowser()) return;
  window.localStorage.setItem(recordsKey(deviceId), JSON.stringify(records));
}

export function getRecord(deviceId, id) {
  return listRecords(deviceId).find((r) => r.id === id) || null;
}

export function upsertRecord(deviceId, record) {
  const all = listRecords(deviceId);
  const idx = all.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.unshift(record);
  }
  saveAllRecords(deviceId, all);
  return record;
}

export function deleteRecord(deviceId, id) {
  const all = listRecords(deviceId).filter((r) => r.id !== id);
  saveAllRecords(deviceId, all);
}

export function appendAudit(deviceId, recordId, entry) {
  const record = getRecord(deviceId, recordId);
  if (!record) return null;
  record.audit = record.audit || [];
  record.audit.unshift(entry);
  record.updatedAt = entry.timestamp;
  upsertRecord(deviceId, record);
  return record;
}
