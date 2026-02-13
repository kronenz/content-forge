const menu = document.getElementById('menu');
const screens = Array.from(document.querySelectorAll('.screen'));
const title = document.getElementById('screen-title');
const desc = document.getElementById('screen-desc');

const labels = {
  dashboard: ['Dashboard', '완성된 서비스의 운영 화면 시나리오'],
  pipelines: ['Pipelines', '수집부터 발행까지 실시간 파이프라인 보드'],
  material: ['Material Detail', '소재 단위 라우팅/승인/출력 계획 화면'],
  editor: ['Video Editor', '씬 타임라인 + 프리뷰 + 인스펙터 구성'],
  analytics: ['Analytics', 'BML 루프 기반 성과 분석 대시보드']
};

menu.addEventListener('click', (event) => {
  const btn = event.target.closest('.menu-item');
  if (!btn) return;

  const screenId = btn.dataset.screen;
  if (!screenId) return;

  document.querySelectorAll('.menu-item').forEach((node) => node.classList.remove('is-active'));
  btn.classList.add('is-active');

  screens.forEach((screen) => screen.classList.toggle('is-visible', screen.id === screenId));

  title.textContent = labels[screenId][0];
  desc.textContent = labels[screenId][1];
});
