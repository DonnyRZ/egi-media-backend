const crypto = require("crypto");
const CryptoJS = require("crypto-js");

const algorithm = "aes-256-cbc";
const defaultRawKey = "antigravity_default_secret_key_123456";
const DET_IV = crypto.createHash("md5").update("cc_backend_iv_16").digest();
const DEFAULT_ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(defaultRawKey)
  .digest();

// Lazy key resolution so dotenv/global_config can populate ENCRYPTION_KEY
// before the first encrypt/decrypt call.
let cachedRawKey = null;
let cachedEncryptionKey = null;
let cachedLegacyKeys = null;

const getRawKey = () => {
  if (cachedRawKey === null) {
    cachedRawKey = process.env.ENCRYPTION_KEY || defaultRawKey;
  }
  return cachedRawKey;
};

const getEncryptionKey = () => {
  if (cachedEncryptionKey === null) {
    cachedEncryptionKey = crypto
      .createHash("sha256")
      .update(getRawKey())
      .digest();
  }
  return cachedEncryptionKey;
};

const getLegacyRawKeys = () => {
  if (cachedLegacyKeys === null) {
    const legacy = String(process.env.ENCRYPTION_KEY_LEGACY || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    cachedLegacyKeys = [defaultRawKey, ...legacy].filter(
      (value, index, arr) => value && arr.indexOf(value) === index,
    );
  }
  return cachedLegacyKeys;
};

const looksLikeEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const decryptWithKey = (ciphertext, keyBuffer) => {
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, DET_IV);
  return (
    decipher.update(String(ciphertext), "base64", "utf8") +
    decipher.final("utf8")
  );
};

const encrypt = (text) => {
  if (text === null || text === undefined || text === "") {
    return text;
  }
  try {
    const cipher = crypto.createCipheriv(
      algorithm,
      getEncryptionKey(),
      DET_IV,
    );
    let encrypted = cipher.update(String(text), "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  } catch (error) {
    return text;
  }
};

const decrypt = (ciphertext) => {
  if (ciphertext === null || ciphertext === undefined || ciphertext === "") {
    return ciphertext;
  }

  // Already plaintext (legacy/seed rows).
  if (looksLikeEmail(ciphertext)) {
    return ciphertext;
  }

  try {
    if (typeof ciphertext === "string" && ciphertext.startsWith("U2FsdGVkX1")) {
      const bytes = CryptoJS.AES.decrypt(ciphertext, getRawKey());
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedString) {
        return decryptedString;
      }
    }

    return decryptWithKey(ciphertext, getEncryptionKey());
  } catch (error) {
    for (const legacyRaw of getLegacyRawKeys()) {
      try {
        const legacyKey = crypto
          .createHash("sha256")
          .update(legacyRaw)
          .digest();
        const decrypted = decryptWithKey(ciphertext, legacyKey);
        if (decrypted) {
          return decrypted;
        }
      } catch {
        // try next legacy key
      }
    }
    return ciphertext;
  }
};

/**
 * Candidate values used when looking up a user by email across storage formats.
 */
const emailLookupCandidates = (email) => {
  const normalized = String(email || "").trim();
  if (!normalized) return [];

  const candidates = [encrypt(normalized), normalized];

  for (const legacyRaw of getLegacyRawKeys()) {
    try {
      const legacyKey = crypto.createHash("sha256").update(legacyRaw).digest();
      const cipher = crypto.createCipheriv(algorithm, legacyKey, DET_IV);
      candidates.push(
        cipher.update(normalized, "utf8", "base64") + cipher.final("base64"),
      );
    } catch {
      // ignore invalid legacy key material
    }
  }

  return Array.from(new Set(candidates.filter(Boolean)));
};

const sensitiveKeys = [
  "email",
  "username",
  "telephone",
  "name",
  "address",
  "worker_name",
  "worker_telephone",
];

const isSensitiveKey = (key) => {
  if (!key) return false;
  return sensitiveKeys.includes(key.toLowerCase());
};

const encryptDocument = (doc) => {
  if (!doc || typeof doc !== "object") return doc;
  const encrypted = { ...doc };
  for (const key of Object.keys(encrypted)) {
    if (isSensitiveKey(key) && typeof encrypted[key] === "string") {
      encrypted[key] = encrypt(encrypted[key]);
    }
  }
  return encrypted;
};

const decryptRows = (rows) => {
  if (!rows) return rows;
  const isArray = Array.isArray(rows);
  const data = isArray ? rows.map((row) => ({ ...row })) : [{ ...rows }];
  for (const row of data) {
    if (row && typeof row === "object") {
      for (const key of Object.keys(row)) {
        if (isSensitiveKey(key) && typeof row[key] === "string") {
          row[key] = decrypt(row[key]);
        }
      }
    }
  }
  return isArray ? data : data[0];
};

module.exports = {
  encrypt,
  decrypt,
  emailLookupCandidates,
  isSensitiveKey,
  encryptDocument,
  decryptRows,
};
