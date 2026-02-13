/**
 * Remotion entry point — registers all compositions for server-side rendering.
 * This file is used by @remotion/bundler during renderVideo().
 * NOT exported as a public API.
 */

import { registerRoot } from 'remotion';
import React from 'react';
import { Composition } from 'remotion';
import type { VideoProject } from '@content-forge/core';
import { LongformVideo } from './compositions/LongformVideo.js';
import { ShortformVideo } from './compositions/ShortformVideo.js';

const FPS = 30;

function msToFrames(ms: number): number {
  return Math.round((ms / 1000) * FPS);
}

// Remotion's Composition expects LooseComponentType — use type assertion
// since inputProps are serialized/deserialized at runtime anyway.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LongformComponent = LongformVideo as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ShortformComponent = ShortformVideo as React.FC<any>;

const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="LongformVideo"
        component={LongformComponent}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={1}
        defaultProps={{ project: {} as VideoProject }}
        calculateMetadata={({ props }) => {
          const project = (props as { project: VideoProject }).project;
          const totalMs = project.scenes?.reduce(
            (sum, s) => sum + s.timing.durationMs,
            0
          ) ?? 1000;
          return { durationInFrames: msToFrames(totalMs) };
        }}
      />
      <Composition
        id="ShortformVideo"
        component={ShortformComponent}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={1}
        defaultProps={{ project: {} as VideoProject }}
        calculateMetadata={({ props }) => {
          const project = (props as { project: VideoProject }).project;
          const totalMs = project.scenes?.reduce(
            (sum, s) => sum + s.timing.durationMs,
            0
          ) ?? 1000;
          return { durationInFrames: msToFrames(totalMs) };
        }}
      />
    </>
  );
};

registerRoot(Root);
