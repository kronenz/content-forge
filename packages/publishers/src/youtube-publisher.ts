/**
 * YouTube publisher - YouTube Data API v3 video upload
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

export interface YouTubeConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface YouTubeUploadInput {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  categoryId?: string; // default: '28' (Science & Technology)
  privacyStatus?: 'public' | 'unlisted' | 'private'; // default: 'private'
  thumbnailPath?: string;
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

export class YouTubePublisher extends BasePublisher {
  private youtubeConfig: YouTubeConfig;

  constructor(config: PublisherConfig, youtubeConfig: YouTubeConfig, logger?: Logger) {
    super({ ...config, channel: 'youtube' }, logger);
    this.youtubeConfig = youtubeConfig;
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'youtube',
      title: content.title
    });

    return this.withRetry(() => this.publishToYouTube(content));
  }

  /**
   * Upload video to YouTube via resumable upload flow
   */
  async uploadVideo(
    input: YouTubeUploadInput
  ): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('upload_start', {
      publisher: 'youtube',
      title: input.title
    });

    return this.withRetry(() => this.executeUpload(input));
  }

  /**
   * Execute the resumable upload flow
   */
  private async executeUpload(
    input: YouTubeUploadInput
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      // Step 1: Initiate resumable upload
      const initResult = await this.initiateUpload(input);
      if (!initResult.ok) {
        return initResult;
      }
      const uploadUrl = initResult.value;

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
          publisher: 'youtube',
          message: `YouTube upload error: ${errorText}`,
          statusCode: uploadResponse.status,
          retryable: this.isRetryableStatus(uploadResponse.status)
        });
      }

      const videoData2 = await uploadResponse.json() as YouTubeVideoResponse;

      // Step 3: Optional thumbnail upload
      if (input.thumbnailPath) {
        await this.uploadThumbnail(videoData2.id, input.thumbnailPath);
      }

      const videoUrl = `https://www.youtube.com/watch?v=${videoData2.id}`;

      this.logger.info('publish_success', {
        publisher: 'youtube',
        externalId: videoData2.id,
        url: videoUrl
      });

      return Ok({
        channel: 'youtube',
        externalUrl: videoUrl,
        externalId: videoData2.id,
        publishedAt: new Date(videoData2.snippet.publishedAt)
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'youtube',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'youtube',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }

  /**
   * Initiate resumable upload session
   */
  private async initiateUpload(
    input: YouTubeUploadInput
  ): Promise<Result<string, PublishError>> {
    const metadata = {
      snippet: {
        title: input.title,
        description: input.description,
        tags: input.tags,
        categoryId: input.categoryId ?? '28'
      },
      status: {
        privacyStatus: input.privacyStatus ?? 'private'
      }
    };

    const response = await fetch(
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

    if (!response.ok) {
      const errorText = await response.text();
      return Err({
        publisher: 'youtube',
        message: `YouTube initiate upload error: ${errorText}`,
        statusCode: response.status,
        retryable: this.isRetryableStatus(response.status)
      });
    }

    const uploadUrl = response.headers.get('Location');
    if (!uploadUrl) {
      return Err({
        publisher: 'youtube',
        message: 'No upload URL returned from YouTube API',
        retryable: false
      });
    }

    return Ok(uploadUrl);
  }

  /**
   * Upload thumbnail for a video
   */
  private async uploadThumbnail(
    videoId: string,
    thumbnailPath: string
  ): Promise<Result<void, PublishError>> {
    try {
      const { readFile } = await import('node:fs/promises');
      const thumbnailData = await readFile(thumbnailPath);

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/thumbnails/set?videoId=${videoId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.youtubeConfig.accessToken}`,
            'Content-Type': 'image/png'
          },
          body: thumbnailData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn('thumbnail_upload_failed', {
          publisher: 'youtube',
          videoId,
          error: errorText
        });
        return Err({
          publisher: 'youtube',
          message: `Thumbnail upload failed: ${errorText}`,
          statusCode: response.status,
          retryable: false
        });
      }

      return Ok(undefined);
    } catch (error) {
      this.logger.warn('thumbnail_upload_error', {
        publisher: 'youtube',
        videoId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return Err({
        publisher: 'youtube',
        message: error instanceof Error ? error.message : 'Thumbnail upload error',
        retryable: false
      });
    }
  }

  /**
   * Publish ChannelContent to YouTube (simplified flow for pipeline integration)
   */
  private async publishToYouTube(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      const videoFilePath = content.metadata.videoFilePath as string | undefined;
      if (!videoFilePath) {
        return Err({
          publisher: 'youtube',
          message: 'videoFilePath is required in content metadata',
          retryable: false
        });
      }

      const thumbnailPath = content.metadata.thumbnailPath as string | undefined;
      const input: YouTubeUploadInput = {
        videoFilePath,
        title: content.title,
        description: content.body,
        tags: (content.metadata.tags as string[] | undefined) ?? [],
        categoryId: (content.metadata.categoryId as string | undefined) ?? '28',
        privacyStatus: (content.metadata.privacyStatus as 'public' | 'unlisted' | 'private' | undefined) ?? 'private',
        ...(thumbnailPath !== undefined && { thumbnailPath })
      };

      return this.executeUpload(input);

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'youtube',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'youtube',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}

/**
 * Standalone function for YouTube video upload
 */
export async function publishToYouTube(
  input: YouTubeUploadInput,
  config: YouTubeConfig
): Promise<Result<PublishResult, PublishError>> {
  const publisher = new YouTubePublisher(
    { channel: 'youtube', maxRetries: 3 },
    config
  );
  return publisher.uploadVideo(input);
}
