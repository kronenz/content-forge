/**
 * DiagramScene — SVG diagram with optional title and fade-in animation
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { sanitizeSvg } from '../utils/svg-sanitizer.js';

export interface DiagramSceneProps {
  svgContent: string;
  title?: string;
  colorScheme: string;
}

export const DiagramScene: React.FC<DiagramSceneProps> = ({
  svgContent,
  title,
  colorScheme,
}) => {
  const frame = useCurrentFrame();

  const isDark = colorScheme !== 'brand-light';
  const bgColor = isDark ? '#030712' : '#FFFFFF';
  const titleColor = isDark ? '#E2E8F0' : '#1E293B';

  const opacity = interpolate(frame, [0, 20], [0, 1], {
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
          alignItems: 'center',
          padding: title ? '0 80px 60px' : '60px 80px',
        }}
        dangerouslySetInnerHTML={{ __html: safeSvg }}
      />
    </AbsoluteFill>
  );
};
