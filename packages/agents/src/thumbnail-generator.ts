/**
 * Thumbnail generation utility - generates SVG thumbnails using Claude
 */

import { Ok, Err, type Result } from '@content-forge/core';
import { callClaude, type ClaudeApiConfig } from '@content-forge/pipelines';
import type { AgentError } from './types.js';

export interface ThumbnailRequest {
  title: string;
  style: 'bold-text' | 'cinematic' | 'minimal';
  aspectRatio: '16:9' | '9:16';
  brandColors?: { primary: string; accent: string };
}

export interface ThumbnailResult {
  svgContent: string;
  width: number;
  height: number;
}

const DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
};

const STYLE_PROMPTS: Record<string, string> = {
  'bold-text': `Create a thumbnail with large, bold title text as the focal point.
Use a gradient background with vibrant colors.
The text should be centered and highly readable.
Add a subtle shadow or outline to the text for contrast.`,

  'cinematic': `Create a cinematic thumbnail with an abstract visual background.
Use dramatic lighting effects and gradients.
Place the title text subtly at the bottom or top.
Focus on creating visual intrigue with geometric shapes and depth.`,

  'minimal': `Create a clean, minimal thumbnail.
Use a solid or very subtle gradient background.
Feature clean typography with generous whitespace.
Keep the design elegant and uncluttered.`,
};

/**
 * Generate a thumbnail SVG using Claude
 */
export async function generateThumbnail(
  request: ThumbnailRequest,
  claudeApiConfig: ClaudeApiConfig,
): Promise<Result<ThumbnailResult, AgentError>> {
  const dims = DIMENSIONS[request.aspectRatio] ?? { width: 1920, height: 1080 };
  const stylePrompt = STYLE_PROMPTS[request.style] ?? STYLE_PROMPTS['bold-text'];

  const primaryColor = request.brandColors?.primary ?? '#2563EB';
  const accentColor = request.brandColors?.accent ?? '#F59E0B';

  const systemPrompt = `You are an SVG thumbnail designer. Generate a single SVG element with the specified dimensions.
Output ONLY the raw SVG markup, no explanation or code blocks.
The SVG must:
- Have the exact viewBox="0 0 ${dims.width} ${dims.height}"
- Use xmlns="http://www.w3.org/2000/svg"
- Be self-contained (no external resources)
- Use only safe SVG elements (rect, circle, ellipse, line, polyline, polygon, path, text, tspan, g, defs, linearGradient, radialGradient, stop, clipPath, mask, filter)`;

  const userMessage = `Create a thumbnail SVG (${dims.width}x${dims.height}) for: "${request.title}"

Style: ${stylePrompt}

Brand colors:
- Primary: ${primaryColor}
- Accent: ${accentColor}

Generate the SVG now.`;

  const result = await callClaude(
    [{ role: 'user', content: userMessage }],
    systemPrompt,
    claudeApiConfig,
  );

  if (!result.ok) {
    return Err({
      agent: 'thumbnail-generator',
      message: `Claude API error: ${result.error.message}`,
      cause: result.error,
    });
  }

  // Extract SVG from response
  const svgContent = extractSvg(result.value);

  if (!svgContent) {
    return Err({
      agent: 'thumbnail-generator',
      message: 'No SVG content found in Claude response',
    });
  }

  return Ok({
    svgContent,
    width: dims.width,
    height: dims.height,
  });
}

/**
 * Extract SVG content from a response string
 */
function extractSvg(response: string): string | null {
  const svgMatch = response.match(/<svg[\s\S]*<\/svg>/i);
  if (svgMatch) {
    return svgMatch[0];
  }
  return null;
}
