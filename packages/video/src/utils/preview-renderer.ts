/**
 * Preview renderer — generates HTML for editor iframe preview
 * No Remotion dependency, pure HTML/CSS/SVG rendering
 */

import type {
  EditableScene, SceneType, VideoProjectStyle
} from '@content-forge/core';
import { sanitizeSvg } from './svg-sanitizer.js';

export interface PreviewOptions {
  width: number;           // Default: 1920
  height: number;          // Default: 1080
  backgroundColor: string; // Default: '#030712' (Slate 950)
  fontFamily: string;      // Default: 'Inter, sans-serif'
}

const DEFAULT_OPTIONS: PreviewOptions = {
  width: 1920,
  height: 1080,
  backgroundColor: '#030712',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

/**
 * Generate preview HTML for a single scene
 */
export function renderScenePreview(
  scene: EditableScene,
  style?: Partial<VideoProjectStyle>,
  options?: Partial<PreviewOptions>
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const bgColor = opts.backgroundColor;
  const font = opts.fontFamily;

  const visualHtml = renderVisualContent(scene, opts);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${opts.width}px;
    height: ${opts.height}px;
    background: ${bgColor};
    font-family: ${font};
    color: #FFFFFF;
    overflow: hidden;
  }
  .scene-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .visual-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .visual-content svg {
    max-width: 100%;
    max-height: 100%;
  }
  .narration-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 24px 40px;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    font-size: 24px;
    line-height: 1.5;
    color: #E2E8F0;
  }
  .presenter-pip {
    position: absolute;
    bottom: 24px;
    right: 24px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563EB, #06B6D4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    color: white;
    border: 3px solid rgba(255,255,255,0.2);
  }
  .presenter-pip.hidden { display: none; }
  .title-card {
    text-align: center;
    padding: 80px;
  }
  .title-card h1 {
    font-size: 72px;
    font-weight: 700;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #2563EB, #06B6D4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 24px;
  }
  .title-card p {
    font-size: 28px;
    color: #94A3B8;
  }
  .text-reveal {
    padding: 80px 120px;
    font-size: 48px;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: -0.01em;
  }
  .list-reveal {
    padding: 60px 120px;
  }
  .list-reveal h2 {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 40px;
    color: #E2E8F0;
  }
  .list-reveal li {
    font-size: 28px;
    margin-bottom: 20px;
    padding-left: 20px;
    list-style: none;
    position: relative;
    color: #CBD5E1;
  }
  .list-reveal li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 12px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2563EB;
  }
  .code-block {
    padding: 60px 80px;
    background: #0F172A;
    border-radius: 16px;
    margin: 40px 80px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 22px;
    line-height: 1.6;
    color: #E2E8F0;
    white-space: pre-wrap;
  }
  .quote-block {
    padding: 80px 120px;
    text-align: center;
  }
  .quote-block blockquote {
    font-size: 42px;
    font-weight: 500;
    font-style: italic;
    color: #E2E8F0;
    position: relative;
    padding: 0 40px;
  }
  .quote-block blockquote::before {
    content: '"';
    font-size: 120px;
    color: #2563EB;
    position: absolute;
    top: -40px;
    left: -20px;
    opacity: 0.5;
  }
  .placeholder-visual {
    text-align: center;
    color: #475569;
    font-size: 24px;
  }
  .placeholder-visual .icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
</style>
</head>
<body>
<div class="scene-container">
  <div class="visual-content">
    ${visualHtml}
  </div>
  <div class="narration-bar">${escapeHtml(scene.narration.text)}</div>
  <div class="presenter-pip ${scene.presenter.enabled ? '' : 'hidden'}">A</div>
</div>
</body>
</html>`;
}

/**
 * Render visual content based on source type
 */
function renderVisualContent(scene: EditableScene, opts: PreviewOptions): string {
  const source = scene.visual.source;
  const narration = scene.narration.text;

  switch (source.type) {
    case 'claude-svg': {
      if (source.svgContent) {
        const result = sanitizeSvg(source.svgContent, {
          enforceViewBox: `0 0 ${opts.width} ${opts.height}`,
        });
        return result.ok ? result.value : renderPlaceholder('SVG 생성 오류', source.prompt);
      }
      return renderPlaceholder('SVG 생성 대기', source.prompt);
    }

    case 'ai-image': {
      if (source.imageUrl) {
        return `<img src="${escapeHtml(source.imageUrl)}" style="width:100%;height:100%;object-fit:cover;" alt="AI generated" />`;
      }
      return renderPlaceholder('AI 이미지 생성 대기', source.prompt);
    }

    case 'ai-video': {
      if (source.videoUrl) {
        return `<video src="${escapeHtml(source.videoUrl)}" style="width:100%;height:100%;object-fit:cover;" muted></video>`;
      }
      return renderPlaceholder('AI 영상 생성 대기', source.prompt);
    }

    case 'remotion-template': {
      return renderTemplatePreview(source.templateId, source.props, narration);
    }

    case 'stock': {
      if (source.selectedUrl) {
        return `<img src="${escapeHtml(source.selectedUrl)}" style="width:100%;height:100%;object-fit:cover;" alt="Stock" />`;
      }
      return renderPlaceholder('스톡 이미지 검색', source.query);
    }

    case 'screen-recording': {
      return `<video src="${escapeHtml(source.recordingUrl)}" style="width:100%;height:100%;object-fit:contain;" muted></video>`;
    }

    case 'manual-upload': {
      if (!source.fileUrl) {
        return renderPlaceholder('파일 업로드 대기', '이미지 또는 영상을 업로드하세요');
      }
      return `<img src="${escapeHtml(source.fileUrl)}" style="width:100%;height:100%;object-fit:contain;" alt="Uploaded" />`;
    }

    default:
      return renderPlaceholder('알 수 없는 소스', '');
  }
}

/**
 * Render Remotion template as static HTML preview
 */
function renderTemplatePreview(
  templateId: SceneType,
  props: Record<string, unknown>,
  narration: string
): string {
  const title = (props.title as string) || narration.substring(0, 50);
  const subtitle = (props.subtitle as string) || '';
  const items = (props.items as string[]) || [];
  const code = (props.code as string) || '';
  const quote = (props.quote as string) || narration;

  switch (templateId) {
    case 'title-card':
      return `<div class="title-card"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div>`;

    case 'text-reveal':
      return `<div class="text-reveal">${escapeHtml(narration)}</div>`;

    case 'list-reveal': {
      const listItems = items.length > 0
        ? items.map(item => `<li>${escapeHtml(String(item))}</li>`).join('')
        : narration.split(/[.。]/).filter(s => s.trim()).map(s => `<li>${escapeHtml(s.trim())}</li>`).join('');
      return `<div class="list-reveal"><h2>${escapeHtml(title)}</h2><ul>${listItems}</ul></div>`;
    }

    case 'code-highlight':
      return `<div class="code-block">${escapeHtml(code || narration)}</div>`;

    case 'quote':
      return `<div class="quote-block"><blockquote>${escapeHtml(quote)}</blockquote></div>`;

    default:
      return renderPlaceholder(templateId, narration.substring(0, 80));
  }
}

/**
 * Render placeholder for scenes not yet generated
 */
function renderPlaceholder(label: string, detail: string): string {
  return `<div class="placeholder-visual">
    <div class="icon">&#9634;</div>
    <div>${escapeHtml(label)}</div>
    <div style="margin-top:8px;font-size:16px;color:#334155;">${escapeHtml(detail.substring(0, 100))}</div>
  </div>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
