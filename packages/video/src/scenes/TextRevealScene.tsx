/**
 * TextRevealScene — Text lines appear one by one with slide-in + fade animation
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface TextRevealSceneProps {
  lines: string[];
  fontFamily: string;
  colorScheme: string;
}

const LINE_STAGGER_FRAMES = 12;

export const TextRevealScene: React.FC<TextRevealSceneProps> = ({
  lines,
  fontFamily,
  colorScheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isDark = colorScheme !== 'brand-light';
  const bgColor = isDark ? '#030712' : '#FFFFFF';
  const textColor = isDark ? '#E2E8F0' : '#1E293B';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        justifyContent: 'center',
        padding: '80px 120px',
        fontFamily,
      }}
    >
      {lines.map((line, index) => {
        const delay = index * LINE_STAGGER_FRAMES;
        const progress = spring({
          frame: Math.max(0, frame - delay),
          fps,
          config: { damping: 18, stiffness: 80 },
        });

        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const translateX = interpolate(progress, [0, 1], [-40, 0]);

        return (
          <div
            key={index}
            style={{
              fontSize: 48,
              fontWeight: 600,
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
              color: textColor,
              opacity,
              transform: `translateX(${translateX}px)`,
              marginBottom: 16,
            }}
          >
            {line}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
