/**
 * YouTube Shorts publisher - reuses YouTube API with shorts-specific metadata
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
import { type YouTubeConfig } from './youtube-publisher.js';

export interface ShortsUploadInput {
  videoFilePath: string;
  title: string; // max 100 chars
  description: string;
  tags: string[];
  privacyStatus?: 'public' | 'unlisted' | 'private';
}

interface YouTubeVideoResponse {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
  };
  status: {
    privacyStatus: string;
    uploadStatus: string;
  };
}

export class ShortsPublisher extends BasePublisher {
  private youtubeConfig: YouTubeConfig;

  constructor(config: PublisherConfig, youtubeConfig: YouTubeConfig, logger?: Logger) {
    super({ ...config, channel: 'shorts' }, logger);
    this.youtubeConfig = youtubeConfig;
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'shorts',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    return this.withRetry(() => this.publishToShorts(content));
  }

  /**
   * Upload a Short via standalone input
   */
  async uploadShort(
    input: ShortsUploadInput
  ): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('upload_start', {
      publisher: 'shorts',
      title: input.title
    });

    // Validate title length
    if (input.title.length > 100) {
      return Err({
        publisher: 'shorts',
        message: `Title too long: ${input.title.length} chars (maximum 100)`,
        retryable: false
      });
    }

    return this.withRetry(() => this.executeUpload(input));
  }

  /**
   * Validate Shorts content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    if (content.title.length > 100) {
      return Err({
        publisher: 'shorts',
        message: `Title too long: ${content.title.length} chars (maximum 100)`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Ensure #Shorts is included in title or description
   */
  private ensureShortsTag(text: string): string {
    if (text.includes('#Shorts')) {
      return text;
    }
    return `${text} #Shorts`;
  }

  /**
   * Execute the upload flow
   */
  private async executeUpload(
    input: ShortsUploadInput
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      const title = this.ensureShortsTag(input.title);
      const description = this.ensureShortsTag(input.description);

      const metadata = {
        snippet: {
          title,
          description,
          tags: [...input.tags, 'Shorts'],
          categoryId: '28'
        },
        status: {
          privacyStatus: input.privacyStatus ?? 'private'
        }
      };

      // Step 1: Initiate resumable upload
      const initResponse = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.youtubeConfig.accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': 'video/*'
          },
          body: JSON.stringify(metadata)
        }
      );

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        return Err({
          publisher: 'shorts',
          message: `YouTube Shorts initiate upload error: ${errorText}`,
          statusCode: initResponse.status,
          retryable: this.isRetryableStatus(initResponse.status)
        });
      }

      const uploadUrl = initResponse.headers.get('Location');
      if (!uploadUrl) {
        return Err({
          publisher: 'shorts',
          message: 'No upload URL returned from YouTube API',
          retryable: false
        });
      }

      // Step 2: Upload video binary
      const { readFile } = await import('node:fs/promises');
      const videoData = await readFile(input.videoFilePath);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/*',
          'Content-Length': videoData.byteLength.toString()
        },
        body: videoData
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        return Err({
          publisher: 'shorts',
          message: `YouTube Shorts upload error: ${errorText}`,
          statusCode: uploadResponse.status,
          retryable: this.isRetryableStatus(uploadResponse.status)
        });
      }

      const videoResponse = await uploadResponse.json() as YouTubeVideoResponse;

      const videoUrl = `https://www.youtube.com/shorts/${videoResponse.id}`;

      this.logger.info('publish_success', {
        publisher: 'shorts',
        externalId: videoResponse.id,
        url: videoUrl
      });

      return Ok({
        channel: 'shorts',
        externalUrl: videoUrl,
        externalId: videoResponse.id,
        publishedAt: new Date(videoResponse.snippet.publishedAt)
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'shorts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'shorts',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }

  /**
   * Publish ChannelContent to YouTube Shorts
   */
  private async publishToShorts(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    const videoFilePath = content.metadata.videoFilePath as string | undefined;
    if (!videoFilePath) {
      return Err({
        publisher: 'shorts',
        message: 'videoFilePath is required in content metadata',
        retryable: false
      });
    }

    const input: ShortsUploadInput = {
      videoFilePath,
      title: content.title,
      description: content.body,
      tags: (content.metadata.tags as string[] | undefined) ?? [],
      privacyStatus: (content.metadata.privacyStatus as 'public' | 'unlisted' | 'private' | undefined) ?? 'private'
    };

    return this.executeUpload(input);
  }
}

/**
 * Standalone function for YouTube Shorts upload
 */
export async function publishToShorts(
  input: ShortsUploadInput,
  config: YouTubeConfig
): Promise<Result<PublishResult, PublishError>> {
  const publisher = new ShortsPublisher(
    { channel: 'shorts', maxRetries: 3 },
    config
  );
  return publisher.uploadShort(input);
}
