/**
 * UploadScene — Remotion composition for manually uploaded media
 * Renders uploaded images with Ken Burns animation or videos with playback.
 */
import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  Img,
  OffthreadVideo,
  interpolate,
} from 'remotion';

interface UploadSceneProps {
  fileUrl: string;
  mediaType: 'image' | 'video';
  animation?: 'ken-burns' | 'zoom' | 'pan' | 'static';
}

export const UploadScene: React.FC<UploadSceneProps> = ({
  fileUrl,
  mediaType,
  animation = 'ken-burns',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (mediaType === 'video') {
    return (
      <OffthreadVideo
        src={fileUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    );
  }

  // Image with animation
  const progress = frame / durationInFrames;

  const getTransform = (): string => {
    switch (animation) {
      case 'ken-burns': {
        const scale = interpolate(progress, [0, 1], [1, 1.15]);
        const x = interpolate(progress, [0, 1], [0, -3]);
        const y = interpolate(progress, [0, 1], [0, -2]);
        return `scale(${scale}) translate(${x}%, ${y}%)`;
      }
      case 'zoom': {
        const scale = interpolate(progress, [0, 1], [1, 1.3]);
        return `scale(${scale})`;
      }
      case 'pan': {
        const x = interpolate(progress, [0, 1], [-5, 5]);
        return `translateX(${x}%)`;
      }
      case 'static':
      default:
        return 'scale(1)';
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <Img
        src={fileUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: getTransform(),
        }}
      />
    </div>
  );
};

export type { UploadSceneProps };
