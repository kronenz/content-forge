/**
 * Scene components index — exports all scenes and the SceneComponentMap
 */

import type React from 'react';
import type { SceneType } from '@content-forge/core';

import { TitleCardScene } from './TitleCardScene.js';
import { TextRevealScene } from './TextRevealScene.js';
import { ListRevealScene } from './ListRevealScene.js';
import { CustomSVGScene } from './CustomSVGScene.js';
import { DiagramScene } from './DiagramScene.js';
import { ChartScene } from './ChartScene.js';
import { ComparisonScene } from './ComparisonScene.js';
import { TimelineScene } from './TimelineScene.js';
import { CodeHighlightScene } from './CodeHighlightScene.js';
import { QuoteScene } from './QuoteScene.js';
import { TransitionScene } from './TransitionScene.js';
import { UploadScene } from './UploadScene.js';

export {
  TitleCardScene,
  TextRevealScene,
  ListRevealScene,
  CustomSVGScene,
  DiagramScene,
  ChartScene,
  ComparisonScene,
  TimelineScene,
  CodeHighlightScene,
  QuoteScene,
  TransitionScene,
  UploadScene,
};

export type { TitleCardSceneProps } from './TitleCardScene.js';
export type { TextRevealSceneProps } from './TextRevealScene.js';
export type { ListRevealSceneProps } from './ListRevealScene.js';
export type { CustomSVGSceneProps } from './CustomSVGScene.js';
export type { DiagramSceneProps } from './DiagramScene.js';
export type { ChartSceneProps } from './ChartScene.js';
export type { ComparisonSceneProps } from './ComparisonScene.js';
export type { TimelineSceneProps, TimelineEvent } from './TimelineScene.js';
export type { CodeHighlightSceneProps } from './CodeHighlightScene.js';
export type { QuoteSceneProps } from './QuoteScene.js';
export type { TransitionSceneProps } from './TransitionScene.js';
export type { UploadSceneProps } from './UploadScene.js';

/**
 * Maps SceneType to the corresponding React component.
 * Each component accepts its own props — the caller is responsible
 * for constructing the correct props based on scene data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SceneComponentMap: Record<SceneType, React.FC<any>> = {
  'title-card': TitleCardScene,
  'text-reveal': TextRevealScene,
  'list-reveal': ListRevealScene,
  'custom-svg': CustomSVGScene,
  'diagram': DiagramScene,
  'chart': ChartScene,
  'comparison': ComparisonScene,
  'timeline': TimelineScene,
  'code-highlight': CodeHighlightScene,
  'quote': QuoteScene,
  'infographic': CustomSVGScene, // Infographic reuses CustomSVGScene (SVG-based)
  'transition': TransitionScene,
};
