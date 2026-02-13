/**
 * In-memory lock manager for MVP
 * TODO: Replace with Redis-based implementation in production
 */

import { Ok, Err, type Result } from '@content-forge/core';
import type { LockError } from './types.js';

interface LockEntry {
  owner: string;
  expiresAt: number;
}

export class InMemoryLockManager {
  private locks: Map<string, LockEntry> = new Map();

  /**
   * Acquire a lock for a given key
   */
  acquire(key: string, owner: string, ttlMs: number): Promise<Result<void, LockError>> {
    // Clean up expired locks first
    this.cleanupExpiredLocks();

    const existing = this.locks.get(key);

    if (existing) {
      // Check if lock is still valid
      if (existing.expiresAt > Date.now()) {
        return Promise.resolve(Err({
          key,
          message: `Lock already held by ${existing.owner}`,
          owner: existing.owner,
        }));
      }
    }

    // Acquire the lock
    this.locks.set(key, {
      owner,
      expiresAt: Date.now() + ttlMs,
    });

    return Promise.resolve(Ok(undefined));
  }

  /**
   * Release a lock for a given key
   */
  release(key: string, owner: string): Promise<Result<void, LockError>> {
    const existing = this.locks.get(key);

    if (!existing) {
      return Promise.resolve(Err({
        key,
        message: 'Lock does not exist',
      }));
    }

    if (existing.owner !== owner) {
      return Promise.resolve(Err({
        key,
        message: `Lock is held by ${existing.owner}, not ${owner}`,
        owner: existing.owner,
      }));
    }

    this.locks.delete(key);
    return Promise.resolve(Ok(undefined));
  }

  /**
   * Check if a key is locked
   */
  isLocked(key: string): Promise<boolean> {
    this.cleanupExpiredLocks();
    return Promise.resolve(this.locks.has(key));
  }

  /**
   * Clean up expired locks
   */
  private cleanupExpiredLocks(): void {
    const now = Date.now();
    for (const [key, entry] of this.locks.entries()) {
      if (entry.expiresAt <= now) {
        this.locks.delete(key);
      }
    }
  }

  /**
   * Get current lock count (for testing)
   */
  size(): Promise<number> {
    this.cleanupExpiredLocks();
    return Promise.resolve(this.locks.size);
  }

  /**
   * Clear all locks (for testing)
   */
  clear(): Promise<void> {
    this.locks.clear();
    return Promise.resolve();
  }
}
