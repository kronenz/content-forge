/**
 * Scene type registry — maps SceneType to rendering metadata
 * Used by both server renderer (Remotion) and client preview (HTML/CSS)
 */

import type { SceneType } from '@content-forge/core';

export interface SceneTypeInfo {
  type: SceneType;
  label: string;
  description: string;
  category: 'text' | 'data' | 'media' | 'transition';
  supportsClaudeSvg: boolean;    // Can Claude generate SVG for this type?
  presenterDefault: boolean;      // Default presenter on/off
  defaultDurationMs: number;
}

const SCENE_REGISTRY: Record<SceneType, SceneTypeInfo> = {
  'title-card': {
    type: 'title-card',
    label: '타이틀 카드',
    description: '영상 타이틀 + 서브타이틀 + 그라디언트 배경',
    category: 'text',
    supportsClaudeSvg: true,
    presenterDefault: true,
    defaultDurationMs: 5000,
  },
  'text-reveal': {
    type: 'text-reveal',
    label: '텍스트 리빌',
    description: '핵심 텍스트가 순차적으로 등장',
    category: 'text',
    supportsClaudeSvg: false,
    presenterDefault: false,
    defaultDurationMs: 6000,
  },
  'diagram': {
    type: 'diagram',
    label: '다이어그램',
    description: '플로우 차트, 아키텍처 다이어그램, 프로세스 흐름',
    category: 'data',
    supportsClaudeSvg: true,
    presenterDefault: false,
    defaultDurationMs: 8000,
  },
  'chart': {
    type: 'chart',
    label: '차트',
    description: '막대/라인/파이 차트, 데이터 시각화',
    category: 'data',
    supportsClaudeSvg: true,
    presenterDefault: true,
    defaultDurationMs: 8000,
  },
  'comparison': {
    type: 'comparison',
    label: '비교',
    description: '좌우 비교 레이아웃, Before/After',
    category: 'data',
    supportsClaudeSvg: true,
    presenterDefault: true,
    defaultDurationMs: 7000,
  },
  'timeline': {
    type: 'timeline',
    label: '타임라인',
    description: '시간순 이벤트, 역사적 흐름',
    category: 'data',
    supportsClaudeSvg: true,
    presenterDefault: false,
    defaultDurationMs: 10000,
  },
  'code-highlight': {
    type: 'code-highlight',
    label: '코드 하이라이트',
    description: '구문 강조된 코드 블록',
    category: 'text',
    supportsClaudeSvg: false,
    presenterDefault: false,
    defaultDurationMs: 8000,
  },
  'quote': {
    type: 'quote',
    label: '인용문',
    description: '인용문 + 출처, 장식적 레이아웃',
    category: 'text',
    supportsClaudeSvg: true,
    presenterDefault: true,
    defaultDurationMs: 5000,
  },
  'list-reveal': {
    type: 'list-reveal',
    label: '리스트 리빌',
    description: '번호/불릿 리스트가 순차 등장',
    category: 'text',
    supportsClaudeSvg: false,
    presenterDefault: true,
    defaultDurationMs: 8000,
  },
  'infographic': {
    type: 'infographic',
    label: '인포그래픽',
    description: '데이터 + 아이콘 조합 복합 시각화',
    category: 'data',
    supportsClaudeSvg: true,
    presenterDefault: false,
    defaultDurationMs: 10000,
  },
  'transition': {
    type: 'transition',
    label: '트랜지션',
    description: '씬 간 전환 효과',
    category: 'transition',
    supportsClaudeSvg: false,
    presenterDefault: false,
    defaultDurationMs: 1500,
  },
  'custom-svg': {
    type: 'custom-svg',
    label: '커스텀 SVG',
    description: 'Claude가 생성한 커스텀 SVG 시각화',
    category: 'media',
    supportsClaudeSvg: true,
    presenterDefault: false,
    defaultDurationMs: 8000,
  },
};

/**
 * Get scene type info
 */
export function getSceneInfo(type: SceneType): SceneTypeInfo {
  return SCENE_REGISTRY[type];
}

/**
 * Get all scene types
 */
export function getAllSceneTypes(): SceneTypeInfo[] {
  return Object.values(SCENE_REGISTRY);
}

/**
 * Get scene types that support Claude SVG generation
 */
export function getClaudeSvgSceneTypes(): SceneTypeInfo[] {
  return Object.values(SCENE_REGISTRY).filter(s => s.supportsClaudeSvg);
}

/**
 * Get scene types by category
 */
export function getSceneTypesByCategory(category: SceneTypeInfo['category']): SceneTypeInfo[] {
  return Object.values(SCENE_REGISTRY).filter(s => s.category === category);
}
