# Web Editor Module Rules

## Purpose
Vue 3 기반 씬 에디터 프론트엔드 (Style L 디자인).

## Rules
- Vue 3 Composition API + `<script setup lang="ts">` 전용
- Tailwind CSS만 사용 (인라인 style 지양)
- 아이콘: lucide-vue-next 전용 (이모지 절대 금지)
- Dark-first 테마: Slate-950 base, Blue-600 primary, Cyan-500 accent
- 카드: ring-1 ring-slate-800/50 (border 대신), rounded-xl
- 모든 데이터는 현재 mock (백엔드 API 연동 대기 중)

## 향후 개선 (TODO)
- 백엔드 API 연동 (Express/Fastify)
- packages/video-contracts에서 타입 import
- 버전 히스토리 (비주얼 되돌리기)
- 수동 업로드 + Remotion 통합
