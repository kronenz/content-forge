/**
 * Tests for scene components — validates SceneComponentMap and scene registry alignment
 * Note: Actual React rendering tests require jsdom/happy-dom environment.
 * These tests verify the component map, exports, and prop structures.
 */

import { describe, it, expect } from 'vitest';
import type { SceneType } from '@content-forge/core';

// Import the scene component map and individual exports
import { SceneComponentMap } from '../scenes/index.js';

// All scene types from the core types
const ALL_SCENE_TYPES: SceneType[] = [
  'title-card', 'text-reveal', 'diagram', 'chart',
  'comparison', 'timeline', 'code-highlight', 'quote',
  'list-reveal', 'infographic', 'transition', 'custom-svg',
];

describe('SceneComponentMap', () => {
  it('should have a component for every SceneType', () => {
    for (const sceneType of ALL_SCENE_TYPES) {
      expect(SceneComponentMap[sceneType]).toBeDefined();
      expect(typeof SceneComponentMap[sceneType]).toBe('function');
    }
  });

  it('should have exactly 12 entries (one per SceneType)', () => {
    expect(Object.keys(SceneComponentMap)).toHaveLength(12);
  });

  it('should map infographic to CustomSVGScene', () => {
    expect(SceneComponentMap['infographic']).toBe(SceneComponentMap['custom-svg']);
  });

  it('should have unique components for non-shared scene types', () => {
    const uniqueComponents = new Set(
      Object.entries(SceneComponentMap)
        .filter(([key]) => key !== 'infographic')
        .map(([, comp]) => comp)
    );
    // All non-infographic entries should be unique
    expect(uniqueComponents.size).toBe(11);
  });
});

describe('Scene exports', () => {
  it('should export all scene components individually', async () => {
    const scenes = await import('../scenes/index.js');
    expect(scenes.TitleCardScene).toBeDefined();
    expect(scenes.TextRevealScene).toBeDefined();
    expect(scenes.ListRevealScene).toBeDefined();
    expect(scenes.CustomSVGScene).toBeDefined();
    expect(scenes.DiagramScene).toBeDefined();
    expect(scenes.ChartScene).toBeDefined();
    expect(scenes.ComparisonScene).toBeDefined();
    expect(scenes.TimelineScene).toBeDefined();
    expect(scenes.CodeHighlightScene).toBeDefined();
    expect(scenes.QuoteScene).toBeDefined();
    expect(scenes.TransitionScene).toBeDefined();
  });

  it('should export SceneComponentMap', async () => {
    const scenes = await import('../scenes/index.js');
    expect(scenes.SceneComponentMap).toBeDefined();
    expect(typeof scenes.SceneComponentMap).toBe('object');
  });
});
