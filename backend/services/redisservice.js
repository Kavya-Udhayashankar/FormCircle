const redis = require('../config/redis');

// ---- 🔁 Step 4: Set/Get Live Response ----

async function saveLiveResponse(formCode, responseData) {
  const key = `form:${formCode}:response`;
  await redis.set(key, JSON.stringify(responseData));
}

async function getLiveResponse(formCode) {
  const key = `form:${formCode}:response`;
  const value = await redis.get(key);
  return value ? JSON.parse(value) : {};
}

// ---- 🔒 Step 5: Lock/Unlock Fields ----

async function lockField(formCode, fieldName, userId) {
  const key = `form:${formCode}:locks`;
  let locks = JSON.parse(await redis.get(key) || '{}');
  locks[fieldName] = userId;
  await redis.set(key, JSON.stringify(locks));
}

async function unlockField(formCode, fieldName) {
  const key = `form:${formCode}:locks`;
  let locks = JSON.parse(await redis.get(key) || '{}');
  delete locks[fieldName];
  await redis.set(key, JSON.stringify(locks));
}

async function isFieldLocked(formCode, fieldName) {
  const key = `form:${formCode}:locks`;
  let locks = JSON.parse(await redis.get(key) || '{}');
  return locks[fieldName] || null;
}

// ---- ⏱️ Optional: Auto-Expire Lock ----

async function lockFieldWithExpiry(formCode, fieldName, userId, seconds = 30) {
  const key = `form:${formCode}:lock:${fieldName}`;
  await redis.set(key, userId, { EX: seconds });
}

async function isFieldLockedWithExpiry(formCode, fieldName) {
  const key = `form:${formCode}:lock:${fieldName}`;
  return await redis.get(key); // null if not locked
}

async function unlockFieldWithExpiry(formCode, fieldName) {
  const key = `form:${formCode}:lock:${fieldName}`;
  await redis.del(key);
}

module.exports = {
  saveLiveResponse,
  getLiveResponse,
  lockField,
  unlockField,
  isFieldLocked,
  lockFieldWithExpiry,
  isFieldLockedWithExpiry,
  unlockFieldWithExpiry,
};
