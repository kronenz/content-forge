/**
 * CodeHighlightScene — Code block with typewriter-style reveal and optional line highlighting
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface CodeHighlightSceneProps {
  code: string;
  language: string;
  highlightLines?: number[];
  fontFamily: string;
  colorScheme: string;
}

export const CodeHighlightScene: React.FC<CodeHighlightSceneProps> = ({
  code,
  language,
  highlightLines = [],
  fontFamily: _fontFamily,
  colorScheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isDark = colorScheme !== 'brand-light';
  const bgColor = isDark ? '#030712' : '#FFFFFF';
  const codeBlockBg = isDark ? '#0F172A' : '#F1F5F9';
  const textColor = isDark ? '#E2E8F0' : '#1E293B';
  const highlightBg = isDark ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.1)';
  const lineNumColor = isDark ? '#475569' : '#94A3B8';
  const labelColor = isDark ? '#64748B' : '#94A3B8';

  const lines = code.split('\n');
  const totalChars = code.length;
  const charsPerFrame = totalChars / (fps * 2); // Reveal over ~2 seconds
  const visibleChars = Math.floor(frame * charsPerFrame);

  // Calculate which characters are visible per line
  let charCount = 0;
  const visibleLines = lines.map((line) => {
    const lineStart = charCount;
    charCount += line.length + 1; // +1 for newline
    const lineVisibleChars = Math.max(0, Math.min(line.length, visibleChars - lineStart));
    return line.substring(0, lineVisibleChars);
  });

  const containerOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 80px',
        opacity: containerOpacity,
      }}
    >
      <div
        style={{
          backgroundColor: codeBlockBg,
          borderRadius: 16,
          padding: '40px 48px',
          width: '100%',
          maxWidth: 1600,
          overflow: 'hidden',
        }}
      >
        {/* Language label */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: labelColor,
            marginBottom: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {language}
        </div>

        {/* Code lines */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 20,
            lineHeight: 1.7,
          }}
        >
          {visibleLines.map((visibleText, index) => {
            const lineNum = index + 1;
            const isHighlighted = highlightLines.includes(lineNum);

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  backgroundColor: isHighlighted ? highlightBg : 'transparent',
                  borderLeft: isHighlighted ? '3px solid #2563EB' : '3px solid transparent',
                  padding: '2px 12px',
                  marginLeft: -12,
                  marginRight: -12,
                }}
              >
                <span
                  style={{
                    color: lineNumColor,
                    minWidth: 40,
                    textAlign: 'right',
                    marginRight: 24,
                    userSelect: 'none',
                  }}
                >
                  {lineNum}
                </span>
                <span style={{ color: textColor, whiteSpace: 'pre' }}>
                  {visibleText}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
