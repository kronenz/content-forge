import type { VideoProject, EditableScene } from '@/types/video';

function createScene(id: string, order: number, narration: string, _sourceType: string): EditableScene {
  return {
    id,
    order,
    narration: {
      text: narration,
      voiceId: 'alloy',
      status: 'ready',
      durationMs: Math.floor(narration.length * 80),
    },
    visual: {
      source: { type: 'claude-svg' as const, prompt: `Visual for: ${narration.slice(0, 40)}...` },
      status: 'draft',
      versions: [],
    },
    presenter: {
      enabled: false,
      avatarProfileId: '',
      position: 'bottom-right',
      size: 'small',
      shape: 'circle',
      background: 'transparent',
      gesture: 'talking',
      lipSync: true,
      enterAnimation: 'fade-in',
      status: 'draft',
    },
    overlay: {
      subtitles: true,
      subtitleStyle: 'minimal',
      watermark: false,
    },
    timing: {
      durationMs: Math.floor(narration.length * 80),
      transitionIn: 'fade',
      transitionDurationMs: 500,
    },
  };
}

export const mockProjects: VideoProject[] = [
  {
    id: 'proj-001',
    title: 'AI 트렌드 2026 총정리',
    materialId: 'mat-001',
    aspectRatio: '16:9',
    scenes: [
      createScene('scene-001', 0, '안녕하세요, 오늘은 2026년 AI 트렌드를 총정리해보겠습니다.', 'claude-svg'),
      createScene('scene-002', 1, '첫 번째 트렌드는 멀티모달 AI의 대중화입니다. GPT-5와 Claude 4가 텍스트, 이미지, 비디오를 동시에 처리합니다.', 'claude-svg'),
      createScene('scene-003', 2, '두 번째는 AI 에이전트의 실용화입니다. 자율적으로 작업을 수행하는 AI 시스템이 기업에 도입되고 있습니다.', 'ai-image'),
      createScene('scene-004', 3, '세 번째는 오픈소스 AI의 약진입니다. Llama 4, Mistral Large 등이 상용 모델과 경쟁하고 있습니다.', 'claude-svg'),
      createScene('scene-005', 4, '마지막으로 AI 규제의 본격화입니다. EU AI Act가 시행되며 글로벌 규제 프레임워크가 형성되고 있습니다.', 'claude-svg'),
    ],
    globalStyle: {
      colorScheme: 'brand-dark',
      fontFamily: 'Inter',
    },
    status: 'editing',
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-02-12T14:30:00Z',
  },
  {
    id: 'proj-002',
    title: 'Pinia 상태관리 튜토리얼',
    materialId: 'mat-002',
    aspectRatio: '16:9',
    scenes: [
      createScene('scene-006', 0, 'Vue 3에서 Pinia를 활용한 상태관리 패턴을 알아봅시다.', 'claude-svg'),
      createScene('scene-007', 1, 'Pinia는 Vuex의 후속으로, 더 간결한 API와 TypeScript 지원을 제공합니다.', 'claude-svg'),
      createScene('scene-008', 2, 'defineStore를 사용해 스토어를 정의하고, Composition API 스타일로 상태를 관리합니다.', 'remotion-template'),
    ],
    globalStyle: {
      colorScheme: 'brand-dark',
      fontFamily: 'Inter',
    },
    status: 'scripting',
    createdAt: '2026-02-08T11:00:00Z',
    updatedAt: '2026-02-11T16:00:00Z',
  },
  {
    id: 'proj-003',
    title: '30초 제품 소개 숏폼',
    materialId: 'mat-003',
    aspectRatio: '9:16',
    scenes: [
      createScene('scene-009', 0, '이 앱 하나면 콘텐츠 제작이 자동화됩니다!', 'ai-video'),
      createScene('scene-010', 1, '소스 수집부터 멀티채널 배포까지, ContentForge가 모두 처리합니다.', 'ai-image'),
    ],
    globalStyle: {
      colorScheme: 'brand-light',
      fontFamily: 'Inter',
    },
    status: 'complete',
    createdAt: '2026-02-05T08:00:00Z',
    updatedAt: '2026-02-09T12:00:00Z',
  },
];
