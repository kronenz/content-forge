/**
 * QuoteScene — Large centered quote with quotation marks and author attribution
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface QuoteSceneProps {
  quote: string;
  author?: string;
  fontFamily: string;
  colorScheme: string;
}

export const QuoteScene: React.FC<QuoteSceneProps> = ({
  quote,
  author,
  fontFamily,
  colorScheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isDark = colorScheme !== 'brand-light';
  const bgColor = isDark ? '#030712' : '#FFFFFF';
  const quoteColor = isDark ? '#E2E8F0' : '#1E293B';
  const authorColor = isDark ? '#94A3B8' : '#64748B';
  const decorColor = '#2563EB';

  const quoteProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 60 },
  });
  const quoteOpacity = interpolate(quoteProgress, [0, 1], [0, 1]);
  const quoteScale = interpolate(quoteProgress, [0, 1], [0.95, 1]);

  const authorOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
        padding: '80px 120px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: 1400,
          opacity: quoteOpacity,
          transform: `scale(${quoteScale})`,
        }}
      >
        {/* Opening quote mark */}
        <div
          style={{
            fontSize: 120,
            color: decorColor,
            opacity: 0.5,
            lineHeight: 0.5,
            marginBottom: 20,
          }}
        >
          {'\u201C'}
        </div>

        {/* Quote text */}
        <blockquote
          style={{
            fontSize: 42,
            fontWeight: 500,
            fontStyle: 'italic',
            color: quoteColor,
            lineHeight: 1.5,
            margin: 0,
            padding: '0 40px',
          }}
        >
          {quote}
        </blockquote>

        {/* Author */}
        {author && (
          <p
            style={{
              fontSize: 24,
              color: authorColor,
              marginTop: 32,
              opacity: authorOpacity,
            }}
          >
            — {author}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
