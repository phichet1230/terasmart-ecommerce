/**
 * 🚀 High-Concurrency Distributed Lock Engine (Flash Sale & Stock Protection)
 * Implements Redis Redlock Mutex Pattern with In-Memory Mutex & SQL Row Lock Fallback.
 * Cost: $0 (FREE 100% using open-source Redis & Node.js process memory)
 */

class DistributedLockService {
  constructor() {
    this.memoryLocks = new Map();
    this.redisClient = null;
    this.isRedisReady = false;
    this.initRedis();
  }

  initRedis() {
    try {
      const Redis = require('ioredis');
      const redisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);
      if (redisUrl) {
        this.redisClient = new Redis(redisUrl, {
          retryStrategy: (times) => Math.min(times * 100, 3000),
          maxRetriesPerRequest: 1
        });

        this.redisClient.on('connect', () => {
          console.log('⚡ Redis Distributed Lock Engine Connected & Ready (Flash Sale Speed Up)');
          this.isRedisReady = true;
        });

        this.redisClient.on('error', (err) => {
          this.isRedisReady = false;
        });
      }
    } catch (e) {
      this.isRedisReady = false;
    }
  }

  /**
   * Acquire Atomic Lock for a target resource (e.g., variant_id)
   * @param {string} resourceKey - Unique key like 'variant:12'
   * @param {number} ttlMs - Time-to-live in milliseconds (default 5000ms)
   * @returns {Promise<{acquired: boolean, lockToken: string, release: Function}>}
   */
  async acquireLock(resourceKey, ttlMs = 5000) {
    const lockToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const key = `lock:${resourceKey}`;

    // 1. Try Redis Atomic Lock (SET key token NX PX ttlMs)
    if (this.isRedisReady && this.redisClient) {
      try {
        const result = await this.redisClient.set(key, lockToken, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
          return {
            acquired: true,
            lockToken,
            release: async () => {
              try {
                // Atomic release using Lua script to check token match
                const luaScript = `
                  if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                  else
                    return 0
                  end
                `;
                await this.redisClient.eval(luaScript, 1, key, lockToken);
              } catch (e) {}
            }
          };
        }
      } catch (e) {
        // Fallback if Redis fails
      }
    }

    // 2. In-Memory Mutex Lock Fallback
    const now = Date.now();
    const existing = this.memoryLocks.get(key);

    if (!existing || existing.expiresAt < now) {
      const lockObject = {
        lockToken,
        expiresAt: now + ttlMs
      };
      this.memoryLocks.set(key, lockObject);

      return {
        acquired: true,
        lockToken,
        release: async () => {
          const current = this.memoryLocks.get(key);
          if (current && current.lockToken === lockToken) {
            this.memoryLocks.delete(key);
          }
        }
      };
    }

    // Lock failed to acquire immediately
    return {
      acquired: false,
      lockToken: null,
      release: async () => {}
    };
  }

  /**
   * Acquire lock with spin-wait retry strategy for high concurrency
   */
  async acquireLockWithRetry(resourceKey, ttlMs = 5000, maxRetries = 10, retryDelayMs = 150) {
    for (let i = 0; i < maxRetries; i++) {
      const lock = await this.acquireLock(resourceKey, ttlMs);
      if (lock.acquired) {
        return lock;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }

    // If lock is still held by another worker, return acquired: false to fallback to DB FOR UPDATE
    return {
      acquired: false,
      lockToken: null,
      release: async () => {}
    };
  }
}

module.exports = new DistributedLockService();
