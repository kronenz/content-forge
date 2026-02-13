/**
 * PresenterOverlay — PiP overlay component for AI avatar
 * Positioned, sized, and shaped based on ScenePresenter config
 */

import React from 'react';
import {
  AbsoluteFill,
  Video,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {
  PresenterPosition,
  PresenterSize,
  PresenterShape,
  ScenePresenter,
} from '@content-forge/core';

export interface PresenterOverlayProps {
  presenter: ScenePresenter;
}

function getPositionStyle(position: PresenterPosition): React.CSSProperties {
  switch (position) {
    case 'bottom-left':
      return { bottom: 24, left: 24 };
    case 'center-right':
      return { top: '50%', right: 24, transform: 'translateY(-50%)' };
    case 'bottom-right':
    default:
      return { bottom: 24, right: 24 };
  }
}

function getSizePx(size: PresenterSize): number {
  switch (size) {
    case 'small':
      return 160;
    case 'large':
      return 320;
    case 'medium':
    default:
      return 220;
  }
}

function getShapeStyle(shape: PresenterShape, sizePx: number): React.CSSProperties {
  switch (shape) {
    case 'circle':
      return { width: sizePx, height: sizePx, borderRadius: '50%' };
    case 'rounded':
      return { width: sizePx, height: sizePx, borderRadius: 16 };
    case 'full-body':
      return { width: sizePx, height: sizePx * 1.5, borderRadius: 16 };
    default:
      return { width: sizePx, height: sizePx, borderRadius: '50%' };
  }
}

export const PresenterOverlay: React.FC<PresenterOverlayProps> = ({
  presenter,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!presenter.enabled) {
    return null;
  }

  const sizePx = getSizePx(presenter.size);
  const positionStyle = getPositionStyle(presenter.position);
  const shapeStyle = getShapeStyle(presenter.shape, sizePx);

  // Enter animation
  let enterOpacity = 1;
  let enterTransform = '';

  switch (presenter.enterAnimation) {
    case 'fade-in': {
      enterOpacity = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: 'clamp',
      });
      break;
    }
    case 'slide-in': {
      const slideProgress = spring({
        frame,
        fps,
        config: { damping: 18, stiffness: 80 },
      });
      const translateY = interpolate(slideProgress, [0, 1], [100, 0]);
      enterOpacity = interpolate(slideProgress, [0, 1], [0, 1]);
      enterTransform = `translateY(${translateY}px)`;
      break;
    }
    case 'pop': {
      const popProgress = spring({
        frame,
        fps,
        config: { damping: 12, stiffness: 200 },
      });
      const scale = interpolate(popProgress, [0, 1], [0, 1]);
      enterOpacity = interpolate(popProgress, [0, 1], [0, 1]);
      enterTransform = `scale(${scale})`;
      break;
    }
  }

  // Merge transforms from position (center-right uses translateY) and enter animation
  const combinedTransform = [
    positionStyle.transform as string | undefined,
    enterTransform,
  ].filter(Boolean).join(' ');

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          ...positionStyle,
          ...shapeStyle,
          transform: combinedTransform || undefined,
          opacity: enterOpacity,
          overflow: 'hidden',
          border: '3px solid rgba(255,255,255,0.2)',
          background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {presenter.videoUrl ? (
          <Video
            src={presenter.videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{ fontSize: sizePx * 0.3, color: 'white' }}>A</span>
        )}
      </div>
    </AbsoluteFill>
  );
};
