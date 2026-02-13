# ContentForge 발행 모듈

## 규칙
- 모든 퍼블리셔는 BasePublisher 클래스를 상속
- 퍼블리셔 인터페이스: publish(content: ChannelContent) → Promise<Result<PublishResult, PublishError>>
- 모든 API 호출: 재시도 3회 + 지수 백오프
- rate limit 핸들링 필수
- 발행 결과는 Supabase publications 테이블에 기록

## 채널별 포맷
@docs/channel-formats.md 참조

## 향후 개선 (TODO)
- PublisherSpec 데이터화: 채널별 길이 제한, 포맷, API 모드를 데이터로 분리
- 공통 validateBySpec() 사용으로 채널별 중복 검증 코드 축소
- adapter 계층 분리: MockAdapter (개발용) / RealAdapter (운영용)
