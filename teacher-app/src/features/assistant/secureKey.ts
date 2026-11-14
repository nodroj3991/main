// BYOK key storage. Encrypted with a passphrase the user enters at "unlock"
// time so the key isn't readable by other origin scripts that find their way
// into the page (e.g. extensions). Trade-off: the user must re-enter the
// passphrase per session. Acceptable for a local-first planning tool; the
// alternative (plaintext in IndexedDB) is worse.

import { db } from "../../db/db";

const KEY_LENGTH = 256;
const ITERATIONS = 250_000;

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function base64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

type Bytes = Uint8Array<ArrayBuffer>;

function asBytes(u: Uint8Array): Bytes {
  // Copy into a fresh ArrayBuffer-backed view so the Web Crypto types accept it.
  const buf = new ArrayBuffer(u.byteLength);
  const out = new Uint8Array(buf);
  out.set(u);
  return out as Bytes;
}

async function deriveKey(passphrase: string, salt: Bytes): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    asBytes(enc.encode(passphrase)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function setEncryptedKey(apiKey: string, passphrase: string): Promise<void> {
  const settings = await db.settings.get("settings");
  if (!settings) throw new Error("Settings not initialised");
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Bytes;
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Bytes;
  const key = await deriveKey(passphrase, salt);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, asBytes(new TextEncoder().encode(apiKey))),
  );
  await db.settings.put({
    ...settings,
    encryptedAnthropicKey: bytesToBase64(ciphertext),
    keySalt: bytesToBase64(salt),
    keyIv: bytesToBase64(iv),
    updatedAt: Date.now(),
  });
}

export async function getDecryptedKey(passphrase: string): Promise<string | null> {
  const settings = await db.settings.get("settings");
  if (!settings || !settings.encryptedAnthropicKey) return null;
  try {
    const salt = asBytes(base64ToBytes(settings.keySalt));
    const iv = asBytes(base64ToBytes(settings.keyIv));
    const ct = asBytes(base64ToBytes(settings.encryptedAnthropicKey));
    const key = await deriveKey(passphrase, salt);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export async function clearKey(): Promise<void> {
  const settings = await db.settings.get("settings");
  if (!settings) return;
  await db.settings.put({
    ...settings,
    encryptedAnthropicKey: "",
    keySalt: "",
    keyIv: "",
    updatedAt: Date.now(),
  });
}

export async function hasStoredKey(): Promise<boolean> {
  const settings = await db.settings.get("settings");
  return !!settings?.encryptedAnthropicKey;
}

// In-memory cache for the current session, cleared when the tab closes.
let cachedKey: string | null = null;
export function cacheKey(k: string | null): void {
  cachedKey = k;
}
export function getCachedKey(): string | null {
  return cachedKey;
}
