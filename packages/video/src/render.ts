/**
 * Server-side video rendering using @remotion/renderer
 * Bundles Remotion compositions and renders MP4 output
 */

import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { Ok, Err, type Result } from '@content-forge/core';
import type { VideoProject } from '@content-forge/core';

export interface RenderResult {
  outputPath: string;
  durationMs: number;
  fileSize: number;
}

export interface RenderError {
  message: string;
  phase: 'bundle' | 'render';
  details?: unknown;
}

export interface RenderOptions {
  fps?: number;
  codec?: 'h264' | 'h265';
  crf?: number;
  concurrency?: number;
}

/**
 * Get the entry point path for the Remotion project
 */
function getEntryPoint(): string {
  return path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    'remotion-entry.jsx'
  );
}

/**
 * Render a VideoProject to an MP4 file
 */
export async function renderVideo(
  project: VideoProject,
  outputPath: string,
  options: RenderOptions = {}
): Promise<Result<RenderResult, RenderError>> {
  const codec = options.codec ?? 'h264';

  const compositionId =
    project.aspectRatio === '9:16' ? 'ShortformVideo' : 'LongformVideo';

  // 1. Bundle the Remotion project
  let bundleLocation: string;
  try {
    bundleLocation = await bundle({
      entryPoint: getEntryPoint(),
      onProgress: () => {
        // Bundle progress — no-op for server rendering
      },
    });
  } catch (error) {
    return Err({
      message: `Failed to bundle Remotion project: ${error instanceof Error ? error.message : String(error)}`,
      phase: 'bundle',
      details: error,
    });
  }

  // 2. Select the composition and calculate duration
  let composition;
  try {
    composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps: { project },
    });
  } catch (error) {
    return Err({
      message: `Failed to select composition "${compositionId}": ${error instanceof Error ? error.message : String(error)}`,
      phase: 'bundle',
      details: error,
    });
  }

  // 3. Render the video
  try {
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec,
      outputLocation: outputPath,
      inputProps: { project },
      ...(options.crf != null ? { crf: options.crf } : {}),
      ...(options.concurrency != null
        ? { concurrency: options.concurrency }
        : {}),
    });
  } catch (error) {
    return Err({
      message: `Failed to render video: ${error instanceof Error ? error.message : String(error)}`,
      phase: 'render',
      details: error,
    });
  }

  // 4. Calculate result metadata
  const totalDurationMs = project.scenes.reduce(
    (sum, scene) => sum + scene.timing.durationMs,
    0
  );

  let fileSize = 0;
  try {
    const { stat } = await import('node:fs/promises');
    const stats = await stat(outputPath);
    fileSize = stats.size;
  } catch {
    // File size not critical — may not be available
  }

  return Ok({
    outputPath,
    durationMs: totalDurationMs,
    fileSize,
  });
}
