import { describe, it, expect } from 'vitest';
import {
  getSceneInfo,
  getAllSceneTypes,
  getClaudeSvgSceneTypes,
  getSceneTypesByCategory,
} from '../utils/scene-registry.js';

describe('Scene Registry', () => {
  it('should return info for all 12 scene types', () => {
    expect(getAllSceneTypes()).toHaveLength(12);
  });

  it('should return correct info for title-card', () => {
    const info = getSceneInfo('title-card');
    expect(info.type).toBe('title-card');
    expect(info.label).toBe('타이틀 카드');
    expect(info.category).toBe('text');
    expect(info.presenterDefault).toBe(true);
    expect(info.supportsClaudeSvg).toBe(true);
  });

  it('should return correct info for diagram', () => {
    const info = getSceneInfo('diagram');
    expect(info.supportsClaudeSvg).toBe(true);
    expect(info.category).toBe('data');
    expect(info.presenterDefault).toBe(false);
  });

  it('should return Claude SVG compatible types', () => {
    const svgTypes = getClaudeSvgSceneTypes();
    expect(svgTypes.length).toBeGreaterThan(0);
    svgTypes.forEach(t => expect(t.supportsClaudeSvg).toBe(true));
    const typeNames = svgTypes.map(t => t.type);
    expect(typeNames).toContain('diagram');
    expect(typeNames).toContain('chart');
    expect(typeNames).toContain('infographic');
    expect(typeNames).not.toContain('text-reveal');
    expect(typeNames).not.toContain('transition');
  });

  it('should filter by category', () => {
    const dataTypes = getSceneTypesByCategory('data');
    dataTypes.forEach(t => expect(t.category).toBe('data'));
    expect(dataTypes.map(t => t.type)).toContain('chart');
    expect(dataTypes.map(t => t.type)).toContain('diagram');

    const textTypes = getSceneTypesByCategory('text');
    textTypes.forEach(t => expect(t.category).toBe('text'));
    expect(textTypes.map(t => t.type)).toContain('text-reveal');
  });

  it('should have positive default durations for all types', () => {
    getAllSceneTypes().forEach(t => {
      expect(t.defaultDurationMs).toBeGreaterThan(0);
    });
  });
});
