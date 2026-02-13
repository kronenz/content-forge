/**
 * Lock manager tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLockManager } from '../lock-manager.js';

describe('InMemoryLockManager', () => {
  let lockManager: InMemoryLockManager;

  beforeEach(() => {
    lockManager = new InMemoryLockManager();
  });

  describe('acquire', () => {
    it('should acquire a lock successfully', async () => {
      const result = await lockManager.acquire('test-key', 'owner-1', 30000);

      expect(result.ok).toBe(true);
      expect(await lockManager.isLocked('test-key')).toBe(true);
    });

    it('should fail when lock is already held', async () => {
      await lockManager.acquire('test-key', 'owner-1', 30000);
      const result = await lockManager.acquire('test-key', 'owner-2', 30000);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('already held');
        expect(result.error.owner).toBe('owner-1');
      }
    });

    it('should acquire lock after expiry', async () => {
      await lockManager.acquire('test-key', 'owner-1', 10);

      // Wait for lock to expire
      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await lockManager.acquire('test-key', 'owner-2', 30000);
      expect(result.ok).toBe(true);
    });
  });

  describe('release', () => {
    it('should release a lock successfully', async () => {
      await lockManager.acquire('test-key', 'owner-1', 30000);
      const result = await lockManager.release('test-key', 'owner-1');

      expect(result.ok).toBe(true);
      expect(await lockManager.isLocked('test-key')).toBe(false);
    });

    it('should fail when lock does not exist', async () => {
      const result = await lockManager.release('test-key', 'owner-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('does not exist');
      }
    });

    it('should fail when releasing lock held by another owner', async () => {
      await lockManager.acquire('test-key', 'owner-1', 30000);
      const result = await lockManager.release('test-key', 'owner-2');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('held by');
      }
    });
  });

  describe('isLocked', () => {
    it('should return false for unlocked key', async () => {
      expect(await lockManager.isLocked('test-key')).toBe(false);
    });

    it('should return true for locked key', async () => {
      await lockManager.acquire('test-key', 'owner-1', 30000);
      expect(await lockManager.isLocked('test-key')).toBe(true);
    });

    it('should return false for expired lock', async () => {
      await lockManager.acquire('test-key', 'owner-1', 10);

      // Wait for lock to expire
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(await lockManager.isLocked('test-key')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return 0 for empty lock manager', async () => {
      expect(await lockManager.size()).toBe(0);
    });

    it('should return correct count', async () => {
      await lockManager.acquire('key-1', 'owner-1', 30000);
      await lockManager.acquire('key-2', 'owner-2', 30000);

      expect(await lockManager.size()).toBe(2);
    });

    it('should exclude expired locks', async () => {
      await lockManager.acquire('key-1', 'owner-1', 10);
      await lockManager.acquire('key-2', 'owner-2', 30000);

      // Wait for first lock to expire
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(await lockManager.size()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all locks', async () => {
      await lockManager.acquire('key-1', 'owner-1', 30000);
      await lockManager.acquire('key-2', 'owner-2', 30000);

      await lockManager.clear();

      expect(await lockManager.size()).toBe(0);
    });
  });
});
