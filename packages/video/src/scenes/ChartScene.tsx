/**
 * ChartScene — Chart visualization with grow-in animation effect
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { sanitizeSvg } from '../utils/svg-sanitizer.js';

export interface ChartSceneProps {
  svgContent: string;
  title?: string;
  colorScheme: string;
}

export const ChartScene: React.FC<ChartSceneProps> = ({
  svgContent,
  title,
  colorScheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isDark = colorScheme !== 'brand-light';
  const bgColor = isDark ? '#030712' : '#FFFFFF';
  const titleColor = isDark ? '#E2E8F0' : '#1E293B';

  const growIn = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 60 },
  });

  const scaleY = interpolate(growIn, [0, 1], [0, 1]);
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const titleOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const sanitizeResult = sanitizeSvg(svgContent, {
    enforceViewBox: '0 0 1920 1080',
  });
  const safeSvg = sanitizeResult.ok ? sanitizeResult.value : '';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      {title && (
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: titleColor,
            marginBottom: 24,
            textAlign: 'center',
            opacity: titleOpacity,
          }}
        >
          {title}
        </h2>
      )}
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          padding: title ? '0 80px 60px' : '60px 80px',
          transform: `scaleY(${scaleY})`,
          transformOrigin: 'bottom center',
        }}
        dangerouslySetInnerHTML={{ __html: safeSvg }}
      />
    </AbsoluteFill>
  );
};
