/**
 * Publish service — thin bridge between routes and publishers.
 * In future, this will orchestrate publisher agents.
 */

import type { Channel } from '@content-forge/core';
import { Ok } from '@content-forge/core';
import type { Result } from '@content-forge/core';
import type { Repositories, DbError } from '@content-forge/db';

export interface PublishJobResult {
  contentId: string;
  channels: Channel[];
  published: string[];
  failed: string[];
}

export class PublishService {
  constructor(private readonly repos: Repositories) {}

  async publish(contentId: string, channels: readonly Channel[]): Promise<Result<PublishJobResult, DbError>> {
    // Verify content exists
    const result = await this.repos.contents.findById(contentId);
    if (!result.ok) return result;
    if (result.value === null) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Content ${contentId} not found` } };
    }

    // Stub: real implementation will call publisher agents
    return Ok({
      contentId,
      channels: [...channels],
      published: [],
      failed: [...channels] as string[],
    });
  }
}
