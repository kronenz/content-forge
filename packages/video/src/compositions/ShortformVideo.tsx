/**
 * ShortformVideo — Root Remotion composition for 9:16 videos (Shorts/Reels/TikTok)
 * Vertical layout, subtitles always enabled, optimized for 60-second content
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

export interface ShortformVideoProps {
  project: VideoProject;
}

const FPS = 30;

function msToFrames(ms: number, fps: number = FPS): number {
  return Math.round((ms / 1000) * fps);
}

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

  if (source.type === 'claude-svg') {
    return {
      ...baseProps,
      svgContent: source.svgContent ?? '',
    };
  }

  return baseProps;
}

function getSceneType(scene: EditableScene): SceneType {
  const source = scene.visual.source;
  if (source.type === 'remotion-template') {
    return source.templateId;
  }
  if (source.type === 'claude-svg') {
    return 'custom-svg';
  }
  return 'title-card';
}

export const ShortformVideo: React.FC<ShortformVideoProps> = ({ project }) => {
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

            {/* Presenter overlay */}
            {scene.presenter.enabled && (
              <PresenterOverlay presenter={scene.presenter} />
            )}

            {/* Subtitles always enabled for shortform */}
            {scene.narration.text && (
              <SubtitleOverlay
                text={scene.narration.text}
                style={scene.overlay.subtitleStyle ?? 'bold'}
              />
            )}
          </Sequence>
        );
      })}

      {/* Background music */}
      {globalStyle.musicTrackUrl && (
        <Audio src={globalStyle.musicTrackUrl} volume={0.2} />
      )}
    </AbsoluteFill>
  );
};
