/**
 * SVG sanitizer for Claude-generated SVG content
 * Removes potentially dangerous elements and attributes without external dependencies
 */

import { Ok, Err, type Result } from '@content-forge/core';

export interface SanitizeError {
  message: string;
  original: string;
}

export interface SanitizeOptions {
  maxSizeBytes?: number;        // Default: 500KB
  allowedViewBox?: boolean;     // Default: true
  enforceViewBox?: string;      // e.g. "0 0 1920 1080"
}

// Dangerous elements to remove entirely
const DANGEROUS_ELEMENTS = [
  'script', 'iframe', 'object', 'embed', 'applet',
  'foreignObject', 'set', 'link', 'meta',
];

// Dangerous attributes to strip (case-insensitive patterns)
const DANGEROUS_ATTR_PATTERNS = [
  /^on\w+/i,               // onclick, onload, onerror, etc.
  /^xlink:href$/i,         // Can reference external resources (keep internal #refs)
  /^href$/i,               // External links
  /^formaction$/i,
  /^action$/i,
  /^data$/i,               // <object data="...">
];

// Dangerous URL schemes
const DANGEROUS_SCHEMES = ['javascript:', 'data:text/html', 'vbscript:'];

/**
 * Sanitize SVG content from Claude API output
 */
export function sanitizeSvg(
  svgContent: string,
  options: SanitizeOptions = {}
): Result<string, SanitizeError> {
  const maxSize = options.maxSizeBytes ?? 512000; // 500KB

  // Size check
  if (svgContent.length > maxSize) {
    return Err({
      message: `SVG exceeds maximum size: ${svgContent.length} > ${maxSize} bytes`,
      original: svgContent.substring(0, 200),
    });
  }

  // Must contain <svg
  if (!/<svg[\s>]/i.test(svgContent)) {
    return Err({
      message: 'Content does not contain an SVG element',
      original: svgContent.substring(0, 200),
    });
  }

  let sanitized = svgContent;

  // 1. Remove dangerous elements and their contents
  for (const tag of DANGEROUS_ELEMENTS) {
    const regex = new RegExp(`<${tag}[\\s\\S]*?(?:<\\/${tag}>|\\/>)`, 'gi');
    sanitized = sanitized.replace(regex, '');
  }

  // 2. Remove dangerous attributes
  sanitized = sanitized.replace(
    /(<[a-zA-Z][a-zA-Z0-9-]*)((?:\s+[a-zA-Z][a-zA-Z0-9-:]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?)*)(\/?>)/g,
    (match: string, tagOpen: string, attrs: string, tagClose: string) => {
      if (!attrs) return match;

      const cleanedAttrs = attrs.replace(
        /\s+([a-zA-Z][a-zA-Z0-9-:]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g,
        (attrMatch: string, attrName: string, dblVal?: string, sglVal?: string, bareVal?: string) => {
          const name = attrName.toLowerCase();
          const value = dblVal ?? sglVal ?? bareVal ?? '';

          // Check if attribute name is dangerous
          for (const pattern of DANGEROUS_ATTR_PATTERNS) {
            if (pattern.test(name)) {
              // Exception: allow xlink:href and href for internal SVG references (#id)
              if ((name === 'xlink:href' || name === 'href') && value.startsWith('#')) {
                return attrMatch;
              }
              return '';
            }
          }

          // Check if attribute value contains dangerous schemes
          const lowerValue = value.toLowerCase().trim();
          for (const scheme of DANGEROUS_SCHEMES) {
            if (lowerValue.startsWith(scheme)) {
              return '';
            }
          }

          // Check for url() references to external resources in style
          if (name === 'style' && /url\s*\(\s*['"]?https?:/i.test(value)) {
            // Remove external URL references from style, keep the rest
            const cleanStyle = value.replace(/url\s*\([^)]*https?:[^)]*\)/gi, 'none');
            return ` ${attrName}="${cleanStyle}"`;
          }

          return attrMatch;
        }
      );

      return tagOpen + cleanedAttrs + tagClose;
    }
  );

  // 3. Remove external URL references in <style> blocks
  sanitized = sanitized.replace(
    /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_match: string, open: string, content: string, close: string) => {
      const cleanContent = content
        .replace(/url\s*\([^)]*https?:[^)]*\)/gi, 'none')
        .replace(/@import\s+[^;]+;/gi, '');
      return open + cleanContent + close;
    }
  );

  // 4. Enforce viewBox if specified
  if (options.enforceViewBox) {
    sanitized = sanitized.replace(
      /(<svg[^>]*?)(\s+viewBox\s*=\s*"[^"]*")?([^>]*>)/i,
      (_match: string, before: string, _existingViewBox: string, after: string) => {
        const cleanBefore = before.replace(/\s+viewBox\s*=\s*"[^"]*"/i, '');
        return `${cleanBefore} viewBox="${options.enforceViewBox}"${after}`;
      }
    );
  }

  return Ok(sanitized);
}

/**
 * Quick check if SVG content appears safe (no deep sanitization)
 */
export function isSvgSafe(svgContent: string): boolean {
  const lower = svgContent.toLowerCase();

  for (const tag of DANGEROUS_ELEMENTS) {
    if (lower.includes(`<${tag.toLowerCase()}`)) return false;
  }

  if (/\bon\w+\s*=/i.test(svgContent)) return false;
  if (/javascript:/i.test(svgContent)) return false;

  return true;
}
