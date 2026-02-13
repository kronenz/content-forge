import { describe, it, expect } from 'vitest';
import { sanitizeSvg, isSvgSafe } from '../utils/svg-sanitizer.js';

describe('SVG Sanitizer', () => {
  describe('sanitizeSvg', () => {
    it('should pass through clean SVG', () => {
      const svg = '<svg viewBox="0 0 100 100"><rect width="50" height="50" fill="blue"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toContain('<rect');
        expect(result.value).toContain('fill="blue"');
      }
    });

    it('should remove script tags', () => {
      const svg = '<svg><script>alert("xss")</script><rect/></svg>';
      const result = sanitizeSvg(svg);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toContain('<script');
        expect(result.value).not.toContain('alert');
        expect(result.value).toContain('<rect');
      }
    });

    it('should remove onclick attributes', () => {
      const svg = '<svg><rect onclick="alert(1)" fill="red"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toContain('onclick');
        expect(result.value).toContain('fill="red"');
      }
    });

    it('should remove onload attributes', () => {
      const svg = '<svg onload="malicious()"><rect/></svg>';
      const result = sanitizeSvg(svg);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toContain('onload');
      }
    });

    it('should remove foreignObject elements', () => {
      const svg = '<svg><foreignObject><div>html injection</div></foreignObject><rect/></svg>';
      const result = sanitizeSvg(svg);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toContain('foreignObject');
        expect(result.value).not.toContain('html injection');
        expect(result.value).toContain('<rect');
      }
    });

    it('should remove iframe elements', () => {
      const svg = '<svg><iframe src="http://evil.com"></iframe><rect/></svg>';
      const result = sanitizeSvg(svg);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toContain('iframe');
        expect(result.value).not.toContain('evil.com');
      }
    });

    it('should remove javascript: URLs', () => {
      const svg = '<svg><a href="javascript:alert(1)"><rect/></a></svg>';
      const result = sanitizeSvg(svg);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toContain('javascript:');
      }
    });

    it('should allow internal SVG references (#id)', () => {
      const svg = '<svg><defs><linearGradient id="g1"/></defs><rect fill="url(#g1)" href="#g1"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toContain('href="#g1"');
        expect(result.value).toContain('url(#g1)');
      }
    });

    it('should remove external URLs in style attributes', () => {
      const svg = '<svg><rect style="background: url(https://evil.com/tracker.png)"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toContain('evil.com');
      }
    });

    it('should remove @import in style blocks', () => {
      const svg = '<svg><style>@import url("https://evil.com/font.css"); .a{fill:red}</style><rect class="a"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toContain('@import');
        expect(result.value).toContain('.a{fill:red}');
      }
    });

    it('should enforce viewBox when specified', () => {
      const svg = '<svg viewBox="0 0 100 100"><rect/></svg>';
      const result = sanitizeSvg(svg, { enforceViewBox: '0 0 1920 1080' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toContain('viewBox="0 0 1920 1080"');
        expect(result.value).not.toContain('viewBox="0 0 100 100"');
      }
    });

    it('should reject content without SVG element', () => {
      const result = sanitizeSvg('<div>not svg</div>');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('does not contain an SVG');
      }
    });

    it('should reject oversized SVG', () => {
      const hugeSvg = '<svg>' + 'x'.repeat(600000) + '</svg>';
      const result = sanitizeSvg(hugeSvg);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('exceeds maximum size');
      }
    });
  });

  describe('isSvgSafe', () => {
    it('should return true for clean SVG', () => {
      expect(isSvgSafe('<svg><rect fill="blue"/></svg>')).toBe(true);
    });

    it('should return false for script tags', () => {
      expect(isSvgSafe('<svg><script>alert(1)</script></svg>')).toBe(false);
    });

    it('should return false for event handlers', () => {
      expect(isSvgSafe('<svg><rect onclick="x"/></svg>')).toBe(false);
    });

    it('should return false for javascript URLs', () => {
      expect(isSvgSafe('<svg><a href="javascript:void(0)"/></svg>')).toBe(false);
    });

    it('should return false for foreignObject', () => {
      expect(isSvgSafe('<svg><foreignObject/></svg>')).toBe(false);
    });
  });
});
