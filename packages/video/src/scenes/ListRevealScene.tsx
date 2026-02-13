/**
 * ListRevealScene — Title appears first, then list items stagger in with scale-up animation
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface ListRevealSceneProps {
  title: string;
  items: string[];
  fontFamily: string;
  colorScheme: string;
}

const ITEM_STAGGER_FRAMES = 10;
const TITLE_DURATION_FRAMES = 15;

export const ListRevealScene: React.FC<ListRevealSceneProps> = ({
  title,
  items,
  fontFamily,
  colorScheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isDark = colorScheme !== 'brand-light';
  const bgColor = isDark ? '#030712' : '#FFFFFF';
  const titleColor = isDark ? '#E2E8F0' : '#1E293B';
  const itemColor = isDark ? '#CBD5E1' : '#334155';
  const bulletColor = '#2563EB';

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
  });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        padding: '60px 120px',
        fontFamily,
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <h2
        style={{
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 40,
          color: titleColor,
          opacity: titleOpacity,
          margin: 0,
          paddingBottom: 40,
        }}
      >
        {title}
      </h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item, index) => {
          const delay = TITLE_DURATION_FRAMES + index * ITEM_STAGGER_FRAMES;
          const progress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 15, stiffness: 100 },
          });

          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const scale = interpolate(progress, [0, 1], [0.8, 1]);

          return (
            <li
              key={index}
              style={{
                fontSize: 28,
                marginBottom: 20,
                paddingLeft: 28,
                position: 'relative',
                color: itemColor,
                opacity,
                transform: `scale(${scale})`,
                transformOrigin: 'left center',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 10,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: bulletColor,
                  display: 'inline-block',
                }}
              />
              {item}
            </li>
          );
        })}
      </ul>
    </AbsoluteFill>
  );
};
