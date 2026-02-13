/**
 * Tests for avatar-recommender.ts — scene-level avatar recommendation logic
 */

import { describe, it, expect } from 'vitest';
import { recommendAvatarSettings } from '../avatar/avatar-recommender.js';
import type { VideoScriptScene, SceneType } from '@content-forge/core';

function makeScene(
  id: string,
  sceneType: SceneType,
  narration: string
): VideoScriptScene {
  return {
    id,
    sceneType,
    narration,
    visualPrompt: 'test prompt',
    presenterEnabled: false,
  };
}

describe('recommendAvatarSettings', () => {
  describe('scene type recommendations', () => {
    it('should recommend OFF for title-card', () => {
      const scenes = [makeScene('s1', 'title-card', 'Welcome to the video')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].sceneId).toBe('s1');
      expect(recommendations[0].enabled).toBe(false);
      expect(recommendations[0].reason).toBeTruthy();
    });

    it('should recommend ON with explaining for text-reveal', () => {
      const scenes = [makeScene('s1', 'text-reveal', 'Key points')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].enabled).toBe(true);
      expect(recommendations[0].gesture).toBe('explaining');
    });

    it('should recommend ON with explaining for list-reveal', () => {
      const scenes = [makeScene('s1', 'list-reveal', 'Item list')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].enabled).toBe(true);
      expect(recommendations[0].gesture).toBe('explaining');
    });

    it('should recommend OFF for diagram', () => {
      const scenes = [makeScene('s1', 'diagram', 'Architecture overview')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].enabled).toBe(false);
    });

    it('should recommend OFF for chart', () => {
      const scenes = [makeScene('s1', 'chart', 'Revenue data')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].enabled).toBe(false);
    });

    it('should recommend OFF for timeline', () => {
      const scenes = [makeScene('s1', 'timeline', 'History of events')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].enabled).toBe(false);
    });

    it('should recommend OFF for infographic', () => {
      const scenes = [makeScene('s1', 'infographic', 'Data visualization')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].enabled).toBe(false);
    });

    it('should recommend ON with pointing for comparison', () => {
      const scenes = [makeScene('s1', 'comparison', 'Before vs After')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].enabled).toBe(true);
      expect(recommendations[0].gesture).toBe('pointing');
    });

    it('should recommend OFF for code-highlight', () => {
      const scenes = [makeScene('s1', 'code-highlight', 'Code example')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].enabled).toBe(false);
    });

    it('should recommend OFF for quote', () => {
      const scenes = [makeScene('s1', 'quote', 'Famous quote')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].enabled).toBe(false);
    });

    it('should recommend OFF for custom-svg', () => {
      const scenes = [makeScene('s1', 'custom-svg', 'Custom graphic')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].enabled).toBe(false);
    });

    it('should recommend OFF for transition', () => {
      const scenes = [makeScene('s1', 'transition', 'Next section')];
      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].enabled).toBe(false);
    });
  });

  describe('batch recommendations', () => {
    it('should handle multiple scenes', () => {
      const scenes = [
        makeScene('s1', 'title-card', 'Welcome'),
        makeScene('s2', 'text-reveal', 'Key insight'),
        makeScene('s3', 'diagram', 'Architecture'),
        makeScene('s4', 'comparison', 'Before vs after'),
        makeScene('s5', 'transition', 'Next'),
      ];

      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations).toHaveLength(5);
      expect(recommendations[0].sceneId).toBe('s1');
      expect(recommendations[0].enabled).toBe(false); // title-card
      expect(recommendations[1].sceneId).toBe('s2');
      expect(recommendations[1].enabled).toBe(true); // text-reveal
      expect(recommendations[2].sceneId).toBe('s3');
      expect(recommendations[2].enabled).toBe(false); // diagram
      expect(recommendations[3].sceneId).toBe('s4');
      expect(recommendations[3].enabled).toBe(true); // comparison
      expect(recommendations[4].sceneId).toBe('s5');
      expect(recommendations[4].enabled).toBe(false); // transition
    });

    it('should handle empty scenes array', () => {
      const recommendations = recommendAvatarSettings([]);
      expect(recommendations).toEqual([]);
    });
  });

  describe('every recommendation has a reason', () => {
    it('should provide non-empty reason for all scene types', () => {
      const allTypes: SceneType[] = [
        'title-card', 'text-reveal', 'diagram', 'chart',
        'comparison', 'timeline', 'code-highlight', 'quote',
        'list-reveal', 'infographic', 'transition', 'custom-svg',
      ];

      const scenes = allTypes.map((type, i) =>
        makeScene(`s${i}`, type, 'Sample narration')
      );

      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations).toHaveLength(allTypes.length);
      recommendations.forEach((rec) => {
        expect(rec.reason).toBeTruthy();
        expect(rec.reason.length).toBeGreaterThan(0);
      });
    });
  });

  describe('gesture assignments', () => {
    it('should assign appropriate gestures per scene type', () => {
      const scenes = [
        makeScene('s1', 'text-reveal', 'explaining content'),
        makeScene('s2', 'list-reveal', 'list items'),
        makeScene('s3', 'comparison', 'comparing items'),
      ];

      const recommendations = recommendAvatarSettings(scenes);

      expect(recommendations[0].gesture).toBe('explaining');
      expect(recommendations[1].gesture).toBe('explaining');
      expect(recommendations[2].gesture).toBe('pointing');
    });
  });
});
