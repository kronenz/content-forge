/**
 * Visual prompt templates tests
 */

import { describe, it, expect } from 'vitest';
import type { SceneType } from '@content-forge/core';
import {
  getVisualPromptTemplate,
  getSystemPrompt,
  isSvgSceneType,
  isTemplateSceneType,
  isPassthroughSceneType,
  SVG_SYSTEM_PROMPT,
  TEMPLATE_SYSTEM_PROMPT,
} from '../visual-prompt-templates.js';

const ALL_SCENE_TYPES: SceneType[] = [
  'title-card', 'text-reveal', 'diagram', 'chart',
  'comparison', 'timeline', 'code-highlight', 'quote',
  'list-reveal', 'infographic', 'transition', 'custom-svg',
];

const SVG_TYPES: SceneType[] = [
  'diagram', 'chart', 'timeline', 'infographic',
  'comparison', 'custom-svg', 'title-card', 'quote',
];

const TEMPLATE_TYPES: SceneType[] = [
  'text-reveal', 'list-reveal', 'code-highlight',
];

const PASSTHROUGH_TYPES: SceneType[] = [
  'transition',
];

describe('visual-prompt-templates', () => {
  describe('getVisualPromptTemplate', () => {
    it('should return a template for every SceneType', () => {
      for (const sceneType of ALL_SCENE_TYPES) {
        const template = getVisualPromptTemplate(sceneType);
        // transition is intentionally empty
        if (sceneType === 'transition') {
          expect(template).toBe('');
        } else {
          expect(template).toBeTruthy();
          expect(typeof template).toBe('string');
          expect(template.length).toBeGreaterThan(0);
        }
      }
    });

    it('should include viewport instructions for SVG templates', () => {
      for (const sceneType of SVG_TYPES) {
        const template = getVisualPromptTemplate(sceneType);
        expect(template).toContain('1920x1080');
      }
    });

    it('should request JSON output for template scene types', () => {
      for (const sceneType of TEMPLATE_TYPES) {
        const template = getVisualPromptTemplate(sceneType);
        expect(template).toContain('JSON');
      }
    });

    it('should include scene-specific instructions', () => {
      expect(getVisualPromptTemplate('diagram')).toContain('diagram');
      expect(getVisualPromptTemplate('chart')).toContain('chart');
      expect(getVisualPromptTemplate('timeline')).toContain('timeline');
      expect(getVisualPromptTemplate('infographic')).toContain('infographic');
      expect(getVisualPromptTemplate('comparison')).toContain('comparison');
      expect(getVisualPromptTemplate('code-highlight')).toContain('code');
      expect(getVisualPromptTemplate('list-reveal')).toContain('items');
      expect(getVisualPromptTemplate('text-reveal')).toContain('lines');
    });
  });

  describe('getSystemPrompt', () => {
    it('should return SVG system prompt for SVG scene types', () => {
      for (const sceneType of SVG_TYPES) {
        expect(getSystemPrompt(sceneType)).toBe(SVG_SYSTEM_PROMPT);
      }
    });

    it('should return template system prompt for template scene types', () => {
      for (const sceneType of TEMPLATE_TYPES) {
        expect(getSystemPrompt(sceneType)).toBe(TEMPLATE_SYSTEM_PROMPT);
      }
    });

    it('should return SVG system prompt for passthrough types', () => {
      // Passthrough types fall through to SVG system prompt (not used in practice)
      for (const sceneType of PASSTHROUGH_TYPES) {
        expect(getSystemPrompt(sceneType)).toBe(SVG_SYSTEM_PROMPT);
      }
    });
  });

  describe('SVG_SYSTEM_PROMPT', () => {
    it('should include SVG generation instructions', () => {
      expect(SVG_SYSTEM_PROMPT).toContain('SVG');
      expect(SVG_SYSTEM_PROMPT).toContain('viewBox');
      expect(SVG_SYSTEM_PROMPT).toContain('1920');
      expect(SVG_SYSTEM_PROMPT).toContain('1080');
    });

    it('should include brand colors', () => {
      expect(SVG_SYSTEM_PROMPT).toContain('#2563EB');
      expect(SVG_SYSTEM_PROMPT).toContain('#06B6D4');
      expect(SVG_SYSTEM_PROMPT).toContain('#F8FAFC');
    });

    it('should include animation instructions', () => {
      expect(SVG_SYSTEM_PROMPT).toContain('data-anim');
    });
  });

  describe('TEMPLATE_SYSTEM_PROMPT', () => {
    it('should request JSON output', () => {
      expect(TEMPLATE_SYSTEM_PROMPT).toContain('JSON');
    });

    it('should explicitly say no SVG', () => {
      expect(TEMPLATE_SYSTEM_PROMPT).toContain('NOT SVG');
    });
  });

  describe('isSvgSceneType', () => {
    it('should return true for SVG scene types', () => {
      for (const sceneType of SVG_TYPES) {
        expect(isSvgSceneType(sceneType)).toBe(true);
      }
    });

    it('should return false for non-SVG scene types', () => {
      for (const sceneType of [...TEMPLATE_TYPES, ...PASSTHROUGH_TYPES]) {
        expect(isSvgSceneType(sceneType)).toBe(false);
      }
    });
  });

  describe('isTemplateSceneType', () => {
    it('should return true for template scene types', () => {
      for (const sceneType of TEMPLATE_TYPES) {
        expect(isTemplateSceneType(sceneType)).toBe(true);
      }
    });

    it('should return false for non-template scene types', () => {
      for (const sceneType of [...SVG_TYPES, ...PASSTHROUGH_TYPES]) {
        expect(isTemplateSceneType(sceneType)).toBe(false);
      }
    });
  });

  describe('isPassthroughSceneType', () => {
    it('should return true for transition', () => {
      expect(isPassthroughSceneType('transition')).toBe(true);
    });

    it('should return false for non-passthrough types', () => {
      for (const sceneType of [...SVG_TYPES, ...TEMPLATE_TYPES]) {
        expect(isPassthroughSceneType(sceneType)).toBe(false);
      }
    });
  });

  describe('scene type coverage', () => {
    it('should cover every SceneType exactly once across SVG, template, and passthrough', () => {
      const covered = new Set([...SVG_TYPES, ...TEMPLATE_TYPES, ...PASSTHROUGH_TYPES]);
      const allTypes = new Set(ALL_SCENE_TYPES);

      expect(covered.size).toBe(allTypes.size);
      for (const t of allTypes) {
        expect(covered.has(t)).toBe(true);
      }
    });

    it('should not have overlapping categories', () => {
      for (const t of SVG_TYPES) {
        expect(TEMPLATE_TYPES).not.toContain(t);
        expect(PASSTHROUGH_TYPES).not.toContain(t);
      }
      for (const t of TEMPLATE_TYPES) {
        expect(PASSTHROUGH_TYPES).not.toContain(t);
      }
    });
  });
});
