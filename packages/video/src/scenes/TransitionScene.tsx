/**
 * TransitionScene — Simple transition effect between scenes (fade, slide, zoom)
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { TransitionType } from '@content-forge/core';

export interface TransitionSceneProps {
  type: TransitionType;
  colorScheme: string;
}

export const TransitionScene: React.FC<TransitionSceneProps> = ({
  type,
  colorScheme,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const isDark = colorScheme !== 'brand-light';
  const bgColor = isDark ? '#030712' : '#FFFFFF';
  const midpoint = durationInFrames / 2;

  let style: React.CSSProperties = {
    backgroundColor: bgColor,
  };

  switch (type) {
    case 'fade': {
      const opacity = frame < midpoint
        ? interpolate(frame, [0, midpoint], [0, 1], { extrapolateRight: 'clamp' })
        : interpolate(frame, [midpoint, durationInFrames], [1, 0], { extrapolateRight: 'clamp' });
      style = { ...style, opacity };
      break;
    }
    case 'slide': {
      const translateX = frame < midpoint
        ? interpolate(frame, [0, midpoint], [-1920, 0], { extrapolateRight: 'clamp' })
        : interpolate(frame, [midpoint, durationInFrames], [0, 1920], { extrapolateRight: 'clamp' });
      style = { ...style, transform: `translateX(${translateX}px)` };
      break;
    }
    case 'zoom': {
      const scale = frame < midpoint
        ? interpolate(frame, [0, midpoint], [0, 1], { extrapolateRight: 'clamp' })
        : interpolate(frame, [midpoint, durationInFrames], [1, 3], { extrapolateRight: 'clamp' });
      const opacity = frame < midpoint
        ? interpolate(frame, [0, midpoint], [0, 1], { extrapolateRight: 'clamp' })
        : interpolate(frame, [midpoint, durationInFrames], [1, 0], { extrapolateRight: 'clamp' });
      style = { ...style, transform: `scale(${scale})`, opacity };
      break;
    }
    case 'cut':
    default: {
      const opacity = frame < midpoint ? 0 : 1;
      style = { ...style, opacity };
      break;
    }
  }

  return <AbsoluteFill style={style} />;
};
