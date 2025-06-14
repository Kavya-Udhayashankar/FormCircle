// redis.js
const { createClient } = require('redis');

const redis = createClient(); // connects to localhost:6379

redis.on('error', (err) => console.error('Redis Client Error:', err));

// Important: connect returns a Promise
(async () => {
  try {
    await redis.connect();
    console.log("Redis connected");
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
})();

module.exports = redis;
