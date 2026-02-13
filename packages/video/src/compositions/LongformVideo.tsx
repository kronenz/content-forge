/**
 * LongformVideo — Root Remotion composition for 16:9 videos
 * Renders scenes sequentially using <Sequence> with proper timing
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
} from 'remotion';
import type {
  EditableScene,
  VideoProject,
  SceneType,
} from '@content-forge/core';
import { SceneComponentMap } from '../scenes/index.js';
import { PresenterOverlay } from './PresenterOverlay.js';
import { SubtitleOverlay } from './SubtitleOverlay.js';

export interface LongformVideoProps {
  project: VideoProject;
}

const FPS = 30;

/**
 * Convert milliseconds to frames at given FPS
 */
function msToFrames(ms: number, fps: number = FPS): number {
  return Math.round((ms / 1000) * fps);
}

/**
 * Extract scene component props from the editable scene data
 */
function getSceneProps(
  scene: EditableScene,
  globalColorScheme: string,
  globalFontFamily: string
): Record<string, unknown> {
  const source = scene.visual.source;
  const baseProps = {
    colorScheme: globalColorScheme,
    fontFamily: globalFontFamily,
  };

  if (source.type === 'remotion-template') {
    return { ...baseProps, ...source.props };
  }

  // For claude-svg, ai-image, etc., derive props from scene data
  if (source.type === 'claude-svg') {
    return {
      ...baseProps,
      svgContent: source.svgContent ?? '',
    };
  }

  return baseProps;
}

/**
 * Get the SceneType for this scene to look up the component
 */
function getSceneType(scene: EditableScene): SceneType {
  const source = scene.visual.source;
  if (source.type === 'remotion-template') {
    return source.templateId;
  }
  if (source.type === 'claude-svg') {
    return 'custom-svg';
  }
  // Default fallback for non-template scenes
  return 'title-card';
}

export const LongformVideo: React.FC<LongformVideoProps> = ({ project }) => {
  const { scenes, globalStyle } = project;
  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#030712' }}>
      {sortedScenes.map((scene) => {
        const durationFrames = msToFrames(scene.timing.durationMs);
        const fromFrame = currentFrame;
        currentFrame += durationFrames;

        const sceneType = getSceneType(scene);
        const SceneComponent = SceneComponentMap[sceneType];
        const sceneProps = getSceneProps(
          scene,
          globalStyle.colorScheme,
          globalStyle.fontFamily
        );

        return (
          <Sequence
            key={scene.id}
            from={fromFrame}
            durationInFrames={durationFrames}
            name={`scene-${scene.id}`}
          >
            {/* Scene visual */}
            <SceneComponent {...sceneProps} />

            {/* Presenter overlay (PiP) */}
            {scene.presenter.enabled && (
              <PresenterOverlay presenter={scene.presenter} />
            )}

            {/* Subtitle overlay */}
            {scene.overlay.subtitles && scene.narration.text && (
              <SubtitleOverlay
                text={scene.narration.text}
                style={scene.overlay.subtitleStyle}
              />
            )}
          </Sequence>
        );
      })}

      {/* Background music */}
      {globalStyle.musicTrackUrl && (
        <Audio src={globalStyle.musicTrackUrl} volume={0.15} />
      )}
    </AbsoluteFill>
  );
};
