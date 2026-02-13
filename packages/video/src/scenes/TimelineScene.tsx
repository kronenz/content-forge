/**
 * TimelineScene — Events appear sequentially along a vertical timeline
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface TimelineEvent {
  year: string;
  label: string;
}

export interface TimelineSceneProps {
  events: TimelineEvent[];
  colorScheme: string;
  fontFamily: string;
}

const EVENT_STAGGER_FRAMES = 10;

export const TimelineScene: React.FC<TimelineSceneProps> = ({
  events,
  colorScheme,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isDark = colorScheme !== 'brand-light';
  const bgColor = isDark ? '#030712' : '#FFFFFF';
  const yearColor = '#2563EB';
  const labelColor = isDark ? '#E2E8F0' : '#1E293B';
  const lineColor = isDark ? '#334155' : '#CBD5E1';
  const dotColor = '#2563EB';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        fontFamily,
        justifyContent: 'center',
        padding: '60px 160px',
      }}
    >
      <div style={{ position: 'relative', paddingLeft: 60 }}>
        {/* Vertical line */}
        <div
          style={{
            position: 'absolute',
            left: 20,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: lineColor,
          }}
        />

        {events.map((event, index) => {
          const delay = index * EVENT_STAGGER_FRAMES;
          const progress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 15, stiffness: 80 },
          });

          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const translateX = interpolate(progress, [0, 1], [-30, 0]);

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 40,
                position: 'relative',
                opacity,
                transform: `translateX(${translateX}px)`,
              }}
            >
              {/* Dot */}
              <div
                style={{
                  position: 'absolute',
                  left: -48,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: dotColor,
                  border: `3px solid ${bgColor}`,
                }}
              />
              {/* Year */}
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: yearColor,
                  minWidth: 100,
                  marginRight: 24,
                }}
              >
                {event.year}
              </span>
              {/* Label */}
              <span
                style={{
                  fontSize: 26,
                  color: labelColor,
                  lineHeight: 1.4,
                }}
              >
                {event.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
