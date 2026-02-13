/**
 * ComparisonScene — Side-by-side comparison with slide-in animation
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface ComparisonSceneProps {
  leftLabel: string;
  rightLabel: string;
  leftItems: string[];
  rightItems: string[];
  colorScheme: string;
  fontFamily: string;
}

export const ComparisonScene: React.FC<ComparisonSceneProps> = ({
  leftLabel,
  rightLabel,
  leftItems,
  rightItems,
  colorScheme,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isDark = colorScheme !== 'brand-light';
  const bgColor = isDark ? '#030712' : '#FFFFFF';
  const labelColor = isDark ? '#E2E8F0' : '#1E293B';
  const itemColor = isDark ? '#CBD5E1' : '#475569';
  const dividerColor = isDark ? '#334155' : '#CBD5E1';

  const leftSlide = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 80 },
  });
  const rightSlide = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 18, stiffness: 80 },
  });

  const leftTranslateX = interpolate(leftSlide, [0, 1], [-100, 0]);
  const leftOpacity = interpolate(leftSlide, [0, 1], [0, 1]);
  const rightTranslateX = interpolate(rightSlide, [0, 1], [100, 0]);
  const rightOpacity = interpolate(rightSlide, [0, 1], [0, 1]);

  const panelStyle: React.CSSProperties = {
    flex: 1,
    padding: '60px 60px',
    display: 'flex',
    flexDirection: 'column',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 700,
    color: labelColor,
    marginBottom: 32,
  };

  const itemStyle: React.CSSProperties = {
    fontSize: 24,
    color: itemColor,
    marginBottom: 16,
    lineHeight: 1.5,
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        flexDirection: 'row',
        fontFamily,
      }}
    >
      {/* Left panel */}
      <div
        style={{
          ...panelStyle,
          opacity: leftOpacity,
          transform: `translateX(${leftTranslateX}px)`,
        }}
      >
        <div style={labelStyle}>{leftLabel}</div>
        {leftItems.map((item, i) => (
          <div key={i} style={itemStyle}>
            {item}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          width: 2,
          backgroundColor: dividerColor,
          margin: '60px 0',
        }}
      />

      {/* Right panel */}
      <div
        style={{
          ...panelStyle,
          opacity: rightOpacity,
          transform: `translateX(${rightTranslateX}px)`,
        }}
      >
        <div style={labelStyle}>{rightLabel}</div>
        {rightItems.map((item, i) => (
          <div key={i} style={itemStyle}>
            {item}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
