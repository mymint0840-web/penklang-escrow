import Redis from 'ioredis';
import { logger } from '@/utils/logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  },
};

// Create Redis client
export const redis = new Redis(redisConfig);

// Redis event handlers
redis.on('connect', () => {
  logger.info('Redis client connecting...');
});

redis.on('ready', () => {
  logger.info('Redis client connected and ready');
});

redis.on('error', (error) => {
  logger.error('Redis client error:', error);
});

redis.on('close', () => {
  logger.warn('Redis client connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
});

redis.on('end', () => {
  logger.warn('Redis client connection ended');
});

// Helper functions for common Redis operations
export const redisHelpers = {
  /**
   * Set a value with expiration time
   */
  async setWithExpiry(key: string, value: string, expirySeconds: number): Promise<void> {
    await redis.setex(key, expirySeconds, value);
  },

  /**
   * Set a JSON object with expiration
   */
  async setJSON(key: string, value: object, expirySeconds?: number): Promise<void> {
    const jsonString = JSON.stringify(value);
    if (expirySeconds) {
      await redis.setex(key, expirySeconds, jsonString);
    } else {
      await redis.set(key, jsonString);
    }
  },

  /**
   * Get and parse JSON object
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Failed to parse JSON from Redis key: ${key}`, error);
      return null;
    }
  },

  /**
   * Delete one or more keys
   */
  async delete(...keys: string[]): Promise<number> {
    return await redis.del(...keys);
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  /**
   * Get TTL of a key in seconds
   */
  async getTTL(key: string): Promise<number> {
    return await redis.ttl(key);
  },

  /**
   * Increment a counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    return await redis.incrby(key, amount);
  },

  /**
   * Set expiration on existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await redis.expire(key, seconds);
    return result === 1;
  },

  /**
   * Get all keys matching a pattern
   */
  async getKeysByPattern(pattern: string): Promise<string[]> {
    return await redis.keys(pattern);
  },

  /**
   * Delete all keys matching a pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    return await redis.del(...keys);
  },

  /**
   * Add item to a set
   */
  async addToSet(key: string, ...members: string[]): Promise<number> {
    return await redis.sadd(key, ...members);
  },

  /**
   * Remove item from a set
   */
  async removeFromSet(key: string, ...members: string[]): Promise<number> {
    return await redis.srem(key, ...members);
  },

  /**
   * Get all members of a set
   */
  async getSetMembers(key: string): Promise<string[]> {
    return await redis.smembers(key);
  },

  /**
   * Check if member exists in set
   */
  async isInSet(key: string, member: string): Promise<boolean> {
    const result = await redis.sismember(key, member);
    return result === 1;
  },

  /**
   * Push to list (queue)
   */
  async pushToList(key: string, ...values: string[]): Promise<number> {
    return await redis.rpush(key, ...values);
  },

  /**
   * Pop from list (queue)
   */
  async popFromList(key: string): Promise<string | null> {
    return await redis.lpop(key);
  },

  /**
   * Get list length
   */
  async getListLength(key: string): Promise<number> {
    return await redis.llen(key);
  },

  /**
   * Set hash field
   */
  async setHashField(key: string, field: string, value: string): Promise<number> {
    return await redis.hset(key, field, value);
  },

  /**
   * Get hash field
   */
  async getHashField(key: string, field: string): Promise<string | null> {
    return await redis.hget(key, field);
  },

  /**
   * Get all hash fields
   */
  async getAllHashFields(key: string): Promise<Record<string, string>> {
    return await redis.hgetall(key);
  },

  /**
   * Delete hash field
   */
  async deleteHashField(key: string, ...fields: string[]): Promise<number> {
    return await redis.hdel(key, ...fields);
  },
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await redis.quit();
  logger.info('Redis connection closed');
});

export default redis;
