/**
 * Scene-level avatar on/off auto-recommendation logic
 * Recommends whether an avatar presenter should be enabled for each scene
 * based on scene type and narration content
 */

import type { SceneType, VideoScriptScene, PresenterGesture } from '@content-forge/core';

export interface AvatarRecommendation {
  sceneId: string;
  enabled: boolean;
  gesture: PresenterGesture;
  reason: string;
}

/**
 * Recommend avatar on/off for each scene based on scene type and content
 */
export function recommendAvatarSettings(
  scenes: VideoScriptScene[]
): AvatarRecommendation[] {
  return scenes.map((scene) => {
    const { enabled, gesture, reason } = getRecommendation(
      scene.sceneType,
      scene.narration
    );
    return { sceneId: scene.id, enabled, gesture, reason };
  });
}

const NARRATION_LENGTH_THRESHOLD = 200;

function getRecommendation(
  sceneType: SceneType,
  narration: string
): { enabled: boolean; gesture: PresenterGesture; reason: string } {
  const hasLongNarration = narration.length > NARRATION_LENGTH_THRESHOLD;

  switch (sceneType) {
    case 'title-card':
      return {
        enabled: false,
        gesture: 'talking',
        reason: 'Title cards let the title shine without presenter distraction',
      };

    case 'text-reveal':
      return {
        enabled: true,
        gesture: 'explaining',
        reason: 'Presenter adds credibility to text reveals',
      };

    case 'list-reveal':
      return {
        enabled: true,
        gesture: 'explaining',
        reason: 'Presenter adds credibility to list reveals',
      };

    case 'diagram':
      return {
        enabled: false,
        gesture: 'explaining',
        reason: 'Diagrams need full screen for visual clarity',
      };

    case 'chart':
      return {
        enabled: false,
        gesture: 'explaining',
        reason: 'Charts need full screen for data readability',
      };

    case 'timeline':
      return {
        enabled: false,
        gesture: 'explaining',
        reason: 'Timelines need full screen for visual clarity',
      };

    case 'infographic':
      return {
        enabled: false,
        gesture: 'explaining',
        reason: 'Infographics need full screen for data visualization',
      };

    case 'comparison':
      return {
        enabled: true,
        gesture: 'pointing',
        reason: 'Presenter guides the viewer through comparisons',
      };

    case 'code-highlight':
      return {
        enabled: false,
        gesture: 'explaining',
        reason: 'Code highlights need full screen for readability',
      };

    case 'quote':
      return {
        enabled: false,
        gesture: 'talking',
        reason: 'Quotes should stand alone for maximum impact',
      };

    case 'custom-svg':
      return {
        enabled: false,
        gesture: 'explaining',
        reason: 'Custom SVG content takes priority by default',
      };

    case 'transition':
      return {
        enabled: false,
        gesture: 'talking',
        reason: 'Transitions are too brief for presenter presence',
      };

    default: {
      // Fallback: use narration length to decide
      if (hasLongNarration) {
        return {
          enabled: true,
          gesture: 'talking',
          reason: 'Long narration benefits from presenter presence',
        };
      }
      return {
        enabled: false,
        gesture: 'talking',
        reason: 'Short narration does not require a presenter',
      };
    }
  }
}
