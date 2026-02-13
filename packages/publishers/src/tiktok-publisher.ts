/**
 * TikTok publisher - Content Posting API
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

export interface TikTokConfig {
  accessToken: string;
}

export interface TikTokUploadInput {
  videoFilePath: string;
  title: string; // max 150 chars
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
}

interface TikTokInitResponse {
  data: {
    publish_id: string;
    upload_url: string;
  };
  error: {
    code: string;
    message: string;
  };
}

interface TikTokPublishResponse {
  data: {
    publish_id: string;
    share_url: string;
  };
  error: {
    code: string;
    message: string;
  };
}

const TIKTOK_API_BASE = 'https://open.tiktokapis.com';

export class TikTokPublisher extends BasePublisher {
  private tiktokConfig: TikTokConfig;

  constructor(config: PublisherConfig, tiktokConfig: TikTokConfig, logger?: Logger) {
    super({ ...config, channel: 'tiktok' }, logger);
    this.tiktokConfig = tiktokConfig;
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'tiktok',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    return this.withRetry(() => this.publishToTikTok(content));
  }

  /**
   * Upload video via standalone input
   */
  async uploadVideo(
    input: TikTokUploadInput
  ): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('upload_start', {
      publisher: 'tiktok',
      title: input.title
    });

    // Validate title length
    if (input.title.length > 150) {
      return Err({
        publisher: 'tiktok',
        message: `Title too long: ${input.title.length} chars (maximum 150)`,
        retryable: false
      });
    }

    return this.withRetry(() => this.executeUpload(input));
  }

  /**
   * Validate TikTok content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    if (content.title.length > 150) {
      return Err({
        publisher: 'tiktok',
        message: `Title too long: ${content.title.length} chars (maximum 150)`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Execute the TikTok upload flow
   */
  private async executeUpload(
    input: TikTokUploadInput
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      // Step 1: Initiate upload
      const initResult = await this.initiateUpload(input);
      if (!initResult.ok) {
        return initResult;
      }
      const { publishId, uploadUrl } = initResult.value;

      // Step 2: Upload video binary
      const { readFile } = await import('node:fs/promises');
      const videoData = await readFile(input.videoFilePath);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': videoData.byteLength.toString()
        },
        body: videoData
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        return Err({
          publisher: 'tiktok',
          message: `TikTok upload error: ${errorText}`,
          statusCode: uploadResponse.status,
          retryable: this.isRetryableStatus(uploadResponse.status)
        });
      }

      // Step 3: Publish
      const publishResult = await this.publishVideo(publishId);
      if (!publishResult.ok) {
        return publishResult;
      }

      const { shareUrl, externalId } = publishResult.value;

      this.logger.info('publish_success', {
        publisher: 'tiktok',
        externalId,
        url: shareUrl
      });

      return Ok({
        channel: 'tiktok',
        externalUrl: shareUrl,
        externalId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'tiktok',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'tiktok',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }

  /**
   * Step 1: Initiate video upload
   */
  private async initiateUpload(
    input: TikTokUploadInput
  ): Promise<Result<{ publishId: string; uploadUrl: string }, PublishError>> {
    const body = {
      post_info: {
        title: input.title,
        privacy_level: input.privacyLevel ?? 'SELF_ONLY',
        disable_comment: input.disableComment ?? false,
        disable_duet: input.disableDuet ?? false,
        disable_stitch: input.disableStitch ?? false
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: 0 // Will be determined by the API
      }
    };

    const response = await fetch(
      `${TIKTOK_API_BASE}/v2/post/publish/inbox/video/init/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.tiktokConfig.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return Err({
        publisher: 'tiktok',
        message: `TikTok initiate upload error: ${errorText}`,
        statusCode: response.status,
        retryable: this.isRetryableStatus(response.status)
      });
    }

    const data = await response.json() as TikTokInitResponse;

    if (data.error?.code && data.error.code !== 'ok') {
      return Err({
        publisher: 'tiktok',
        message: `TikTok API error: ${data.error.message}`,
        retryable: false
      });
    }

    return Ok({
      publishId: data.data.publish_id,
      uploadUrl: data.data.upload_url
    });
  }

  /**
   * Step 3: Publish the uploaded video
   */
  private async publishVideo(
    publishId: string
  ): Promise<Result<{ shareUrl: string; externalId: string }, PublishError>> {
    const response = await fetch(
      `${TIKTOK_API_BASE}/v2/post/publish/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.tiktokConfig.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ publish_id: publishId })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return Err({
        publisher: 'tiktok',
        message: `TikTok publish error: ${errorText}`,
        statusCode: response.status,
        retryable: this.isRetryableStatus(response.status)
      });
    }

    const data = await response.json() as TikTokPublishResponse;

    if (data.error?.code && data.error.code !== 'ok') {
      return Err({
        publisher: 'tiktok',
        message: `TikTok publish error: ${data.error.message}`,
        retryable: false
      });
    }

    return Ok({
      shareUrl: data.data.share_url,
      externalId: data.data.publish_id
    });
  }

  /**
   * Publish ChannelContent to TikTok
   */
  private async publishToTikTok(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    const videoFilePath = content.metadata.videoFilePath as string | undefined;
    if (!videoFilePath) {
      return Err({
        publisher: 'tiktok',
        message: 'videoFilePath is required in content metadata',
        retryable: false
      });
    }

    const disableComment = content.metadata.disableComment as boolean | undefined;
    const disableDuet = content.metadata.disableDuet as boolean | undefined;
    const disableStitch = content.metadata.disableStitch as boolean | undefined;
    const input: TikTokUploadInput = {
      videoFilePath,
      title: content.title,
      privacyLevel: (content.metadata.privacyLevel as TikTokUploadInput['privacyLevel']) ?? 'SELF_ONLY',
      ...(disableComment !== undefined && { disableComment }),
      ...(disableDuet !== undefined && { disableDuet }),
      ...(disableStitch !== undefined && { disableStitch })
    };

    return this.executeUpload(input);
  }
}

/**
 * Standalone function for TikTok video upload
 */
export async function publishToTikTok(
  input: TikTokUploadInput,
  config: TikTokConfig
): Promise<Result<PublishResult, PublishError>> {
  const publisher = new TikTokPublisher(
    { channel: 'tiktok', maxRetries: 3 },
    config
  );
  return publisher.uploadVideo(input);
}
