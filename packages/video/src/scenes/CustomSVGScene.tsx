/**
 * CustomSVGScene — Renders sanitized SVG content with animation directives
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { AnimationDirective } from '@content-forge/core';
import { sanitizeSvg } from '../utils/svg-sanitizer.js';

export interface CustomSVGSceneProps {
  svgContent: string;
  animationDirectives?: AnimationDirective[];
}

/**
 * Build a CSS stylesheet from animation directives for targeted SVG elements
 */
function buildDirectiveStyles(
  directives: AnimationDirective[],
  frame: number,
  fps: number
): string {
  return directives
    .map((d) => {
      const startFrame = (d.delayMs / 1000) * fps;
      const endFrame = startFrame + (d.durationMs / 1000) * fps;
      const progress = interpolate(frame, [startFrame, endFrame], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

      switch (d.type) {
        case 'fade-in':
          return `${d.target} { opacity: ${progress}; }`;
        case 'slide-in':
          return `${d.target} { opacity: ${progress}; transform: translateX(${interpolate(progress, [0, 1], [-40, 0])}px); }`;
        case 'scale-up':
          return `${d.target} { opacity: ${progress}; transform: scale(${interpolate(progress, [0, 1], [0.5, 1])}); }`;
        case 'draw-path': {
          const dashOffset = interpolate(progress, [0, 1], [1000, 0]);
          return `${d.target} { stroke-dasharray: 1000; stroke-dashoffset: ${dashOffset}; }`;
        }
        case 'typewriter':
          return `${d.target} { opacity: ${progress > 0 ? 1 : 0}; }`;
        default:
          return '';
      }
    })
    .join('\n');
}

export const CustomSVGScene: React.FC<CustomSVGSceneProps> = ({
  svgContent,
  animationDirectives = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sanitizeResult = sanitizeSvg(svgContent, {
    enforceViewBox: '0 0 1920 1080',
  });

  const safeSvg = sanitizeResult.ok ? sanitizeResult.value : '';
  const directiveStyles = buildDirectiveStyles(animationDirectives, frame, fps);

  // Fade-in for the whole SVG container
  const containerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: containerOpacity,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: directiveStyles }} />
      <div
        style={{ width: '100%', height: '100%' }}
        dangerouslySetInnerHTML={{ __html: safeSvg }}
      />
    </AbsoluteFill>
  );
};
