# Video Module Rules

## Purpose
Remotion 기반 영상 렌더링, 씬 컴포넌트, 아바타 클라이언트, 비주얼 프로바이더.

## Rules
- Remotion은 서버 렌더링 전용 (클라이언트 번들에 포함 금지)
- SVG 새니타이징은 보안 필수 사항: 악성 payload 회귀 테스트 유지
- dangerouslySetInnerHTML 경로는 반드시 sanitize 경계를 거쳐야 함
- Scene props는 Zod 스키마로 사전 검증 권장
- 비주얼 프로바이더는 BaseImageProvider/BaseVideoProvider/BaseStockProvider 상속

## 향후 개선 (TODO)
- 렌더 성능 budget 도입 (프레임 드랍 기준)
- Scene props 전체 Zod 검증
- packages/video-contracts로 web 패키지와의 타입 공유 분리
