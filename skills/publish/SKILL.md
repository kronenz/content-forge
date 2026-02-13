---
name: publish-checklist
description: 16개 채널 발행 전 검증 절차
---

# Publish Checklist Skill

## 발행 전 공통 검증
- [ ] 콘텐츠 포맷이 대상 채널 규격에 맞는지
- [ ] 채널 참조가 canonical 형식인지 (normalizeChannel 적용)
- [ ] 이미지/미디어 첨부 시 크기/해상도 규격 확인
- [ ] 예약 발행 시간이 채널별 최적 시간대인지
- [ ] 브랜드 가디언 검증 통과 여부
- [ ] 휴먼라이크 필터 통과 여부

## 채널별 특수 검증

### 텍스트 채널
- Medium: 제목 60자 이내, 태그 5개 이내
- LinkedIn: CTA 포함 여부, 해시태그 3~5개
- X Thread: 트윗당 280자, 넘버링 포함
- Threads: 500자 이내, 이미지 선택적
- Newsletter: 제목줄 40자 이내, unsubscribe 링크
- Blog: SEO 메타 태그, 카테고리 지정
- Brunch: 소제목 포함, 커버 이미지
- Kakao: 카드 형식 준수

### 영상 채널
- YouTube: 썸네일, 설명, 태그, 카테고리
- Shorts/Reels/TikTok: 9:16 비율, 60초 이내, 자막

### 이미지 채널
- IG Carousel: 1:1 비율, 2~10장
- IG Single: 1:1 비율, 캡션 2200자 이내
- IG Story: 9:16 비율, 3~5장

## 발행 실패 대응
1. 401/403: API 키/토큰 만료 확인
2. 429: rate limit 대기 후 재시도 (지수 백오프)
3. 500: 3회 재시도 후 알림 발송
4. 타임아웃: 네트워크 상태 확인 후 재시도

## 학습된 발행 패턴
<!-- 발행 작업 중 발견된 패턴을 여기에 누적 -->
