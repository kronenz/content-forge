/**
 * Prompt templates for Claude SVG visual generation
 * Maps each SceneType to instructions for Claude API
 */

import type { SceneType } from '@content-forge/core';

/** Scene types where Claude generates SVG markup */
const SVG_SCENE_TYPES: Set<SceneType> = new Set([
  'diagram', 'chart', 'timeline', 'infographic',
  'comparison', 'custom-svg', 'title-card', 'quote',
]);

/** Scene types where Claude returns JSON template props */
const TEMPLATE_SCENE_TYPES: Set<SceneType> = new Set([
  'text-reveal', 'list-reveal', 'code-highlight',
]);

/** Scene types that use neither (transition) */
const PASSTHROUGH_SCENE_TYPES: Set<SceneType> = new Set([
  'transition',
]);

/** System prompt shared by all SVG generation calls */
export const SVG_SYSTEM_PROMPT = [
  'You are a visual designer creating SVG graphics for video scenes.',
  'Output ONLY valid SVG markup, no explanation text.',
  "Use viewBox='0 0 1920 1080' for 16:9 content.",
  'Use clean, modern design with these brand colors: #2563EB (primary blue), #06B6D4 (cyan accent), #F8FAFC (light text on dark).',
  "Add data-anim='fade-in' or data-anim='slide-in' attributes to elements that should animate.",
  'Keep SVG simple and performant. No embedded images or external references.',
].join('\n');

/** System prompt for template props generation */
export const TEMPLATE_SYSTEM_PROMPT = [
  'You are a visual designer creating template properties for video scenes.',
  'Return a JSON object with the template props, NOT SVG markup.',
  'Output ONLY valid JSON, no explanation text.',
].join('\n');

/** Scene-type-specific user prompt instructions */
const SCENE_TEMPLATES: Record<SceneType, string> = {
  'diagram':
    'Generate a clear SVG diagram. Use clean lines, labeled boxes, arrows. Viewport: 1920x1080. Use modern colors. Include animation targets with data-anim attributes.',
  'chart':
    'Generate an SVG chart (bar/line/pie). Clean data visualization. Viewport: 1920x1080. Label axes and data points.',
  'timeline':
    'Generate an SVG horizontal timeline. Events flow left to right. Use milestone markers. Viewport: 1920x1080.',
  'infographic':
    'Generate an SVG infographic layout. Key statistics with icons. Clean modern design. Viewport: 1920x1080.',
  'comparison':
    'Generate a two-column SVG comparison. Left vs Right. Clear visual differentiation. Viewport: 1920x1080.',
  'title-card':
    'Generate an SVG title card with a prominent title and subtitle. Gradient background. Viewport: 1920x1080.',
  'quote':
    'Generate an SVG quote card with decorative quotation marks, the quote text, and author attribution. Viewport: 1920x1080.',
  'custom-svg':
    'Generate an SVG visualization based on the description. Viewport: 1920x1080. Modern, clean design.',
  'code-highlight':
    'Return a JSON object with template props: { "code": "<the code snippet>", "language": "<programming language>", "highlightLines": [<line numbers to highlight>] }',
  'text-reveal':
    'Return a JSON object with template props: { "lines": ["<line 1>", "<line 2>", ...] }',
  'list-reveal':
    'Return a JSON object with template props: { "title": "<list title>", "items": ["<item 1>", "<item 2>", ...] }',
  'transition':
    '',
};

/**
 * Get the prompt template for a given scene type
 */
export function getVisualPromptTemplate(sceneType: SceneType): string {
  return SCENE_TEMPLATES[sceneType];
}

/**
 * Get the system prompt appropriate for the scene type
 */
export function getSystemPrompt(sceneType: SceneType): string {
  if (TEMPLATE_SCENE_TYPES.has(sceneType)) {
    return TEMPLATE_SYSTEM_PROMPT;
  }
  return SVG_SYSTEM_PROMPT;
}

/**
 * Check if a scene type produces SVG output (vs JSON template props)
 */
export function isSvgSceneType(sceneType: SceneType): boolean {
  return SVG_SCENE_TYPES.has(sceneType);
}

/**
 * Check if a scene type produces JSON template props
 */
export function isTemplateSceneType(sceneType: SceneType): boolean {
  return TEMPLATE_SCENE_TYPES.has(sceneType);
}

/**
 * Check if a scene type is a passthrough (no Claude generation needed)
 */
export function isPassthroughSceneType(sceneType: SceneType): boolean {
  return PASSTHROUGH_SCENE_TYPES.has(sceneType);
}
