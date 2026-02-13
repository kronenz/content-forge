/**
 * SubtitleOverlay — Subtitle text overlay at bottom center
 * Supports styles: minimal, bold, karaoke
 */

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import type { SubtitleStyle } from '@content-forge/core';

export interface SubtitleOverlayProps {
  text: string;
  style?: SubtitleStyle;
}

function getSubtitleStyles(subtitleStyle: SubtitleStyle): React.CSSProperties {
  switch (subtitleStyle) {
    case 'bold':
      return {
        fontSize: 32,
        fontWeight: 800,
        color: '#FFFFFF',
        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: '12px 32px',
        borderRadius: 8,
      };
    case 'karaoke':
      return {
        fontSize: 28,
        fontWeight: 700,
        color: '#FFFFFF',
        textShadow: '0 0 10px #2563EB, 0 0 20px #2563EB',
        padding: '12px 32px',
      };
    case 'minimal':
    default:
      return {
        fontSize: 24,
        fontWeight: 500,
        color: '#E2E8F0',
        textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        padding: '8px 24px',
      };
  }
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  text,
  style: subtitleStyle = 'minimal',
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  if (!text) {
    return null;
  }

  const styleProps = getSubtitleStyles(subtitleStyle);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity,
        }}
      >
        <div
          style={{
            ...styleProps,
            maxWidth: '80%',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
