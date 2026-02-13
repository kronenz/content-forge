/**
 * Instagram Reels publisher - Graph API integration
 */

import {
  Ok,
  Err,
  type Result,
  type ChannelContent,
  type PublishResult,
  type Logger
} from '@content-forge/core';
import { BasePublisher, type PublisherConfig, type PublishError } from './base-publisher.js';

export interface ReelsConfig {
  accessToken: string;
  igUserId: string;
}

export interface ReelsUploadInput {
  videoUrl: string; // Must be a publicly accessible URL
  caption: string;
  coverTimestampMs?: number;
  shareToFeed?: boolean; // default: true
}

interface MediaContainerResponse {
  id: string;
}

interface MediaStatusResponse {
  status_code: 'IN_PROGRESS' | 'FINISHED' | 'ERROR';
  status?: string;
}

interface MediaPublishResponse {
  id: string;
}

interface MediaPermalinkResponse {
  permalink: string;
}

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 60; // 3 minutes max

export class ReelsPublisher extends BasePublisher {
  private reelsConfig: ReelsConfig;

  constructor(config: PublisherConfig, reelsConfig: ReelsConfig, logger?: Logger) {
    super({ ...config, channel: 'reels' }, logger);
    this.reelsConfig = reelsConfig;
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'reels',
      title: content.title
    });

    return this.withRetry(() => this.publishToReels(content));
  }

  /**
   * Upload a Reel via standalone input
   */
  async uploadReel(
    input: ReelsUploadInput
  ): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('upload_start', {
      publisher: 'reels',
      caption: input.caption.substring(0, 50)
    });

    return this.withRetry(() => this.executeUpload(input));
  }

  /**
   * Execute the 3-step Instagram Reels upload flow
   */
  private async executeUpload(
    input: ReelsUploadInput
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      // Step 1: Create media container
      const containerResult = await this.createMediaContainer(input);
      if (!containerResult.ok) {
        return containerResult;
      }
      const containerId = containerResult.value;

      // Step 2: Poll until container is ready
      const pollResult = await this.pollMediaStatus(containerId);
      if (!pollResult.ok) {
        return pollResult;
      }

      // Step 3: Publish the container
      const publishResult = await this.publishMediaContainer(containerId);
      if (!publishResult.ok) {
        return publishResult;
      }
      const mediaId = publishResult.value;

      // Get permalink
      const permalinkResult = await this.getPermalink(mediaId);
      const permalink = permalinkResult.ok
        ? permalinkResult.value
        : `https://www.instagram.com/reel/${mediaId}`;

      this.logger.info('publish_success', {
        publisher: 'reels',
        externalId: mediaId,
        url: permalink
      });

      return Ok({
        channel: 'reels',
        externalUrl: permalink,
        externalId: mediaId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'reels',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'reels',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }

  /**
   * Step 1: Create media container for Reels
   */
  private async createMediaContainer(
    input: ReelsUploadInput
  ): Promise<Result<string, PublishError>> {
    const params = new URLSearchParams({
      media_type: 'REELS',
      video_url: input.videoUrl,
      caption: input.caption,
      share_to_feed: String(input.shareToFeed ?? true),
      access_token: this.reelsConfig.accessToken
    });

    if (input.coverTimestampMs !== undefined) {
      params.set('thumb_offset', String(input.coverTimestampMs));
    }

    const response = await fetch(
      `${GRAPH_API_BASE}/${this.reelsConfig.igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return Err({
        publisher: 'reels',
        message: `Instagram create container error: ${errorText}`,
        statusCode: response.status,
        retryable: this.isRetryableStatus(response.status)
      });
    }

    const data = await response.json() as MediaContainerResponse;
    return Ok(data.id);
  }

  /**
   * Step 2: Poll media container status until FINISHED
   */
  private async pollMediaStatus(
    containerId: string
  ): Promise<Result<void, PublishError>> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const response = await fetch(
        `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${this.reelsConfig.accessToken}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        return Err({
          publisher: 'reels',
          message: `Instagram poll status error: ${errorText}`,
          statusCode: response.status,
          retryable: this.isRetryableStatus(response.status)
        });
      }

      const data = await response.json() as MediaStatusResponse;

      if (data.status_code === 'FINISHED') {
        return Ok(undefined);
      }

      if (data.status_code === 'ERROR') {
        return Err({
          publisher: 'reels',
          message: `Instagram media processing failed: ${data.status ?? 'Unknown error'}`,
          retryable: false
        });
      }

      // IN_PROGRESS - wait and poll again
      await this.sleep(POLL_INTERVAL_MS);
    }

    return Err({
      publisher: 'reels',
      message: 'Instagram media processing timed out',
      retryable: true
    });
  }

  /**
   * Step 3: Publish the media container
   */
  private async publishMediaContainer(
    containerId: string
  ): Promise<Result<string, PublishError>> {
    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: this.reelsConfig.accessToken
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/${this.reelsConfig.igUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return Err({
        publisher: 'reels',
        message: `Instagram publish error: ${errorText}`,
        statusCode: response.status,
        retryable: this.isRetryableStatus(response.status)
      });
    }

    const data = await response.json() as MediaPublishResponse;
    return Ok(data.id);
  }

  /**
   * Get permalink for a published media
   */
  private async getPermalink(
    mediaId: string
  ): Promise<Result<string, PublishError>> {
    const response = await fetch(
      `${GRAPH_API_BASE}/${mediaId}?fields=permalink&access_token=${this.reelsConfig.accessToken}`
    );

    if (!response.ok) {
      return Err({
        publisher: 'reels',
        message: 'Failed to get permalink',
        retryable: false
      });
    }

    const data = await response.json() as MediaPermalinkResponse;
    return Ok(data.permalink);
  }

  /**
   * Publish ChannelContent to Instagram Reels
   */
  private async publishToReels(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    const videoUrl = content.metadata.videoUrl as string | undefined;
    if (!videoUrl) {
      return Err({
        publisher: 'reels',
        message: 'videoUrl is required in content metadata',
        retryable: false
      });
    }

    const coverTimestampMs = content.metadata.coverTimestampMs as number | undefined;
    const input: ReelsUploadInput = {
      videoUrl,
      caption: content.body,
      shareToFeed: (content.metadata.shareToFeed as boolean | undefined) ?? true,
      ...(coverTimestampMs !== undefined && { coverTimestampMs })
    };

    return this.executeUpload(input);
  }
}

/**
 * Standalone function for Instagram Reels upload
 */
export async function publishToReels(
  input: ReelsUploadInput,
  config: ReelsConfig
): Promise<Result<PublishResult, PublishError>> {
  const publisher = new ReelsPublisher(
    { channel: 'reels', maxRetries: 3 },
    config
  );
  return publisher.uploadReel(input);
}
