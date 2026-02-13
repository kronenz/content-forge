import './styles.css';

const STORAGE_KEY = 'contentforge-system-demo-v2';

const labels = {
  'system-map': ['System Map', '수집부터 BML 피드백까지 전체 구조를 한 화면에'],
  packages: ['Package Topology', 'monorepo 경계와 의존 방향 시각화'],
  operations: ['Agent Operations', '큐/락/에이전트 실행상태 모니터링'],
  factory: ['Content Factory', '소재 선별과 채널 변환 출력 흐름'],
  intervention: ['Intervention Desk', '자동화 루프에 사용자 의사결정을 주입하는 운영 화면'],
  video: ['Video Pipeline', '씬 기반 멀티모달 제작 파이프라인'],
  distribution: ['Distribution', '16채널 배포/일정/BML 루프'],
  'control-plane': ['Control Plane', 'API/계정/배포 정책 관리']
};

const PIPELINES = {
  text: { label: 'Text', color: '#3b82f6' },
  thread: { label: 'Thread', color: '#06b6d4' },
  snackable: { label: 'Snackable', color: '#8b5cf6' },
  longform: { label: 'Longform', color: '#f59e0b' },
  shortform: { label: 'Shortform', color: '#22c55e' },
  webtoon: { label: 'Webtoon', color: '#fb7185' }
};

const CHANNEL_PIPELINE = {
  Medium: 'text',
  LinkedIn: 'text',
  X: 'thread',
  Threads: 'thread',
  Brunch: 'text',
  Newsletter: 'text',
  Blog: 'text',
  Kakao: 'thread',
  YouTube: 'longform',
  Shorts: 'shortform',
  Reels: 'shortform',
  TikTok: 'shortform',
  'IG Carousel': 'snackable',
  'IG Single': 'snackable',
  'IG Story': 'snackable',
  Webtoon: 'webtoon'
};

const defaultState = {
  progress: 23,
  activeFlowIndex: 0,
  flow: ['Collect(8)', 'Materials DB', 'Strategist', 'Pipeline Router', 'Writer', 'Humanizer', 'Guardian', 'Publisher(16)', 'Analytics/BML'],
  runtime: [
    'Queue depth: 17',
    'Active workers: 6',
    'Lock collisions: 0',
    'Pipeline success: 94.8%'
  ],
  invariants: [
    'Result<T,E> pattern (throw 최소화)',
    'ESM import .js extension',
    'No secret in source',
    'Core 중심 의존 방향 유지'
  ],
  packages: [
    { name: '@content-forge/core', role: 'types/result/logger/schemas', status: 'stable' },
    { name: '@content-forge/collectors', role: 'rss/trend/bookmark + scorer', status: 'stable' },
    { name: '@content-forge/agents', role: '7 agents implemented, 3 planned', status: 'active' },
    { name: '@content-forge/pipelines', role: 'text/snackable + video stages', status: 'active' },
    { name: '@content-forge/publishers', role: '11 adapters + mock pattern', status: 'active' },
    { name: '@content-forge/analytics', role: 'collector + weekly report', status: 'stable' },
    { name: '@content-forge/video', role: 'scene/render/sanitize', status: 'active' },
    { name: '@content-forge/web', role: 'editor scaffolding', status: 'planned' },
    { name: '@content-forge/cli', role: 'manual execution entry', status: 'stable' }
  ],
  tasks: [
    { pipeline: 'text', text: 'writer: medium draft 2' },
    { pipeline: 'thread', text: 'writer: x-thread split 1' },
    { pipeline: 'snackable', text: 'snackable: carousel 4 slides' },
    { pipeline: 'longform', text: 'video: script stage ready' },
    { pipeline: 'shortform', text: 'shortform: subtitles sync' },
    { pipeline: 'webtoon', text: 'webtoon: scene panel render' }
  ],
  events: [
    { pipeline: 'longform', text: '[15:41:07] strategist.assign pipeline=longform' },
    { pipeline: 'text', text: '[15:41:10] writer.generate channel=linkedin' },
    { pipeline: 'thread', text: '[15:41:12] guardian.validate thread=result=pass' },
    { pipeline: 'snackable', text: '[15:41:14] ig-carousel assets ready' }
  ],
  agentHealth: [
    ['CollectorAgent', 'running'],
    ['StrategistAgent', 'running'],
    ['ResearcherAgent', 'idle'],
    ['WriterAgent', 'running'],
    ['GuardianAgent', 'running'],
    ['PublisherAgent', 'running'],
    ['HumanizerAgent', 'idle']
  ],
  locks: ['task:collect-102 held by collector-1', 'task:write-331 held by writer-1'],
  materials: [
    'AI Agent 배포 안정화 전략 (score 9.2)',
    'RAG 품질 측정 프레임워크 (score 8.7)',
    'Shorts 성과 해석 가이드 (score 8.1)'
  ],
  materialCatalog: [
    { id: 'mat-102', title: 'AI Agent 배포 안정화 전략' },
    { id: 'mat-221', title: 'RAG 품질 측정 프레임워크' },
    { id: 'mat-337', title: 'Shorts 성과 해석 가이드' }
  ],
  outputs: [
    { name: 'Medium Longform', status: 'Approved', pipeline: 'text' },
    { name: 'LinkedIn Insight', status: 'Drafting', pipeline: 'text' },
    { name: 'X Thread', status: 'Drafting', pipeline: 'thread' },
    { name: 'IG Carousel', status: 'Pending', pipeline: 'snackable' },
    { name: 'YouTube Longform', status: 'Scripting', pipeline: 'longform' }
  ],
  channelSpecs: [
    { pipeline: 'text', text: 'medium 2000-4000' },
    { pipeline: 'text', text: 'linkedin 300-800' },
    { pipeline: 'thread', text: 'x-thread 5-15 tweets' },
    { pipeline: 'snackable', text: 'ig-story 3-5 frames' }
  ],
  scenes: [
    { name: 'Hook Title', visual: 'title-card', presenter: 'ON', tts: '6.2s', transition: 'fade 300ms' },
    { name: 'Problem Diagram', visual: 'claude-svg', presenter: 'OFF', tts: '11.8s', transition: 'slide 450ms' },
    { name: 'Comparison Chart', visual: 'chart', presenter: 'ON', tts: '9.6s', transition: 'zoom 420ms' },
    { name: 'CTA', visual: 'text-reveal', presenter: 'ON', tts: '7.5s', transition: 'fade 400ms' }
  ],
  selectedScene: 0,
  channels: [
    { name: 'Medium', status: 'connected' }, { name: 'LinkedIn', status: 'connected' }, { name: 'X', status: 'pending' }, { name: 'Threads', status: 'pending' },
    { name: 'Brunch', status: 'connected' }, { name: 'Newsletter', status: 'connected' }, { name: 'Blog', status: 'connected' }, { name: 'Kakao', status: 'pending' },
    { name: 'YouTube', status: 'connected' }, { name: 'Shorts', status: 'connected' }, { name: 'Reels', status: 'connected' }, { name: 'TikTok', status: 'pending' },
    { name: 'IG Carousel', status: 'connected' }, { name: 'IG Single', status: 'connected' }, { name: 'IG Story', status: 'connected' }, { name: 'Webtoon', status: 'planned' }
  ],
  calendar: [
    { pipeline: 'text', text: '09:30 LinkedIn' },
    { pipeline: 'text', text: '11:00 Medium' },
    { pipeline: 'longform', text: '19:30 YouTube' },
    { pipeline: 'shortform', text: '20:10 Shorts' },
    { pipeline: 'snackable', text: '21:00 IG Carousel' }
  ],
  bml: ['Build: diagram-heavy shorts', 'Measure: avg watch +18%', 'Learn: presenter ON in intro works', 'Action: next week apply 40%'],
  approvals: [
    { id: 'ap-1', materialId: 'mat-102', channel: 'LinkedIn', status: 'pending', reason: '톤 조정 필요' },
    { id: 'ap-2', materialId: 'mat-221', channel: 'Medium', status: 'pending', reason: '팩트 체크 필요' },
    { id: 'ap-3', materialId: 'mat-337', channel: 'Shorts', status: 'pending', reason: 'CTA 수정 필요' }
  ],
  drafts: [
    { id: 'dr-101', channel: 'LinkedIn', body: '현재 초안: 실무 적용 포인트 3가지를 강조합니다.' },
    { id: 'dr-201', channel: 'Medium', body: '현재 초안: 아키텍처 배경, 설계 선택 이유, 운영 체크리스트를 포함합니다.' },
    { id: 'dr-301', channel: 'Shorts', body: '현재 초안: 30초 훅 -> 20초 문제 -> 10초 CTA 구조입니다.' }
  ],
  selectedDraftId: 'dr-101',
  config: {
    keys: { anthropic: '', openrouter: '', elevenlabs: '', supabase: '' },
    accounts: [
      { id: 'youtube', name: 'YouTube', handle: '@contentforge', connected: true },
      { id: 'linkedin', name: 'LinkedIn', handle: 'company/contentforge', connected: true },
      { id: 'x', name: 'X', handle: '@contentforge_ai', connected: false },
      { id: 'threads', name: 'Threads', handle: '@contentforge', connected: false },
      { id: 'instagram', name: 'Instagram', handle: '@contentforge.studio', connected: true }
    ],
    policy: {
      autoPublish: true,
      requireApproval: true,
      timezone: 'Asia/Seoul',
      window: '18:00-22:00',
      retryCount: 3
    }
  }
};

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function normalizeStateShape(s) {
  if (s.tasks?.length && typeof s.tasks[0] === 'string') {
    s.tasks = s.tasks.map((t, i) => ({ pipeline: Object.keys(PIPELINES)[i % 6], text: t }));
  }
  if (s.events?.length && typeof s.events[0] === 'string') {
    s.events = s.events.map((t, i) => ({ pipeline: Object.keys(PIPELINES)[i % 6], text: t }));
  }
  if (s.outputs?.length && Array.isArray(s.outputs[0])) {
    s.outputs = s.outputs.map(([name, status], i) => ({ name, status, pipeline: Object.keys(PIPELINES)[i % 6] }));
  }
  if (s.channelSpecs?.length && typeof s.channelSpecs[0] === 'string') {
    s.channelSpecs = s.channelSpecs.map((text, i) => ({ pipeline: Object.keys(PIPELINES)[i % 6], text }));
  }
  if (s.channels?.length && Array.isArray(s.channels[0])) {
    s.channels = s.channels.map(([name, status]) => ({ name, status }));
  }
  if (s.calendar?.length && typeof s.calendar[0] === 'string') {
    s.calendar = s.calendar.map((text, i) => ({ pipeline: Object.keys(PIPELINES)[i % 6], text }));
  }
  return s;
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(defaultState);
    return normalizeStateShape({ ...clone(defaultState), ...JSON.parse(raw) });
  } catch {
    return clone(defaultState);
  }
}
const state = loadState();

const menu = document.getElementById('menu');
const screens = Array.from(document.querySelectorAll('.screen'));
const title = document.getElementById('screen-title');
const desc = document.getElementById('screen-desc');
const toast = document.getElementById('toast');

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1300);
}

function badge(status) {
  if (status === 'connected' || status === 'Approved' || status === 'stable') return '<em class="badge ok">ok</em>';
  if (status === 'running' || status === 'active' || status === 'Drafting') return '<em class="badge run">run</em>';
  return '<em class="badge wait">pending</em>';
}

function pipelineBadge(pipeline) {
  const meta = PIPELINES[pipeline] || { label: pipeline, color: '#64748b' };
  return `<span class="pipe-badge" style="--pipe-color:${meta.color}"><i class="pipe-dot"></i>${meta.label}</span>`;
}

function setScreen(id) {
  document.querySelectorAll('.menu-item').forEach((n) => n.classList.remove('is-active'));
  const target = document.querySelector(`.menu-item[data-screen="${id}"]`);
  if (target) target.classList.add('is-active');
  screens.forEach((s) => s.classList.toggle('is-visible', s.id === id));
  title.textContent = labels[id][0];
  desc.textContent = labels[id][1];
}

function renderSystemMap() {
  document.getElementById('flow-strip').innerHTML = state.flow.map((x, i) =>
    `<div class="flow-node ${i === state.activeFlowIndex ? 'active' : ''}">${x}</div>${i < state.flow.length - 1 ? '<div class="flow-arrow">→</div>' : ''}`
  ).join('');
  document.getElementById('runtime-snapshot').innerHTML = state.runtime.map((x) => `<li><span>${x}</span>${badge('active')}</li>`).join('');
  document.getElementById('invariants-list').innerHTML = state.invariants.map((x) => `<li>${x}</li>`).join('');
  document.getElementById('global-progress').style.width = `${state.progress}%`;
  document.getElementById('progress-text').textContent = `${state.progress}% complete`;
  document.getElementById('counter-queue').textContent = state.runtime[0].replace('Queue depth: ', '');
  document.getElementById('counter-workers').textContent = state.runtime[1].replace('Active workers: ', '');
  document.getElementById('counter-success').textContent = state.runtime[3].replace('Pipeline success: ', '');
  document.getElementById('pipeline-legend').innerHTML = Object.entries(PIPELINES)
    .map(([id]) => pipelineBadge(id))
    .join('');
  document.getElementById('pipeline-lanes').innerHTML = Object.entries(PIPELINES)
    .map(([id, meta]) => {
      const count = state.tasks.filter((t) => t.pipeline === id).length;
      return `<div class="pipeline-lane" style="--pipe-color:${meta.color}"><p>${meta.label}</p><span>${count} active jobs</span></div>`;
    })
    .join('');
}

function renderPackages() {
  document.getElementById('package-grid').innerHTML = state.packages
    .map((p) => `<div class="pkg-card"><h3>${p.name}</h3><p>${p.role}</p>${badge(p.status)}</div>`)
    .join('');
  document.getElementById('dependency-lines').innerHTML =
    '<p>@content-forge/core</p><p>↳ collectors / agents / pipelines / publishers / analytics / video / web / cli</p><p>룰: core만 공통 의존점으로 사용</p>';
}

function renderOperations() {
  document.getElementById('task-queue').innerHTML = state.tasks
    .map((t) => `<li>${pipelineBadge(t.pipeline)}<span>${t.text}</span></li>`)
    .join('');
  document.getElementById('agent-health').innerHTML = state.agentHealth.map(([n, s]) => `<li><span>${n}</span>${badge(s)}</li>`).join('');
  document.getElementById('lock-monitor').innerHTML = state.locks.map((x) => `<li>${x}</li>`).join('');
  document.getElementById('event-stream').innerHTML = state.events
    .map((x) => `<li>${pipelineBadge(x.pipeline)}${x.text}</li>`)
    .join('');
}

function renderFactory() {
  document.getElementById('material-inbox').innerHTML = state.materials.map((m) => `<li>${m}</li>`).join('');
  document.getElementById('transformation-outputs').innerHTML = state.outputs
    .map((o) => `<li><span>${pipelineBadge(o.pipeline)} ${o.name}</span>${badge(o.status)}</li>`)
    .join('');
  document.getElementById('channel-specs').innerHTML = state.channelSpecs
    .map((c) => `<span style="border-color:${PIPELINES[c.pipeline].color}66;color:${PIPELINES[c.pipeline].color}">${PIPELINES[c.pipeline].label} · ${c.text}</span>`)
    .join('');
}

function renderIntervention() {
  document.getElementById('approval-queue').innerHTML = state.approvals.map((a) => `
    <li data-approval-id="${a.id}">
      <div class="approval-head">
        <span>${a.materialId} · ${a.channel}</span>
        ${badge(a.status === 'pending' ? 'waiting' : a.status)}
      </div>
      <p>${a.reason}</p>
      <div class="approval-actions">
        <button class="mini-btn approve">Approve</button>
        <button class="mini-btn hold">Hold</button>
        <button class="mini-btn revise">Revise</button>
      </div>
    </li>
  `).join('');

  document.getElementById('override-material').innerHTML = state.materialCatalog
    .map((m) => `<option value="${m.id}">${m.id} · ${m.title}</option>`)
    .join('');
  document.getElementById('override-pipeline').innerHTML = Object.entries(PIPELINES)
    .map(([k, v]) => `<option value="${k}">${v.label}</option>`)
    .join('');

  document.getElementById('draft-selector').innerHTML = state.drafts
    .map((d) => `<option value="${d.id}">${d.id} · ${d.channel}</option>`)
    .join('');
  const selectedDraft = state.drafts.find((d) => d.id === state.selectedDraftId) || state.drafts[0];
  if (selectedDraft) {
    document.getElementById('draft-selector').value = selectedDraft.id;
    document.getElementById('draft-channel').value = selectedDraft.channel;
    document.getElementById('draft-body').value = selectedDraft.body;
  }
}

function renderVideo() {
  document.getElementById('scene-list').innerHTML = state.scenes.map((s, i) =>
    `<li data-scene="${i}" class="${i === state.selectedScene ? 'active' : ''}">${String(i + 1).padStart(2, '0')} ${s.name}</li>`).join('');
  const s = state.scenes[state.selectedScene];
  document.getElementById('preview-label').textContent = `Scene ${state.selectedScene + 1} · ${s.name}`;
  document.getElementById('inspector-visual').textContent = s.visual;
  document.getElementById('inspector-presenter').textContent = s.presenter;
  document.getElementById('inspector-tts').textContent = s.tts;
  document.getElementById('inspector-transition').textContent = s.transition;
}

function renderDistribution() {
  document.getElementById('channel-status').innerHTML = state.channels
    .map((c) => `<li><span>${pipelineBadge(CHANNEL_PIPELINE[c.name] || 'text')} ${c.name}</span>${badge(c.status)}</li>`)
    .join('');
  document.getElementById('publish-calendar').innerHTML = state.calendar
    .map((c) => `<li>${pipelineBadge(c.pipeline)} ${c.text}</li>`)
    .join('');
  document.getElementById('bml-loop').innerHTML = state.bml.map((x) => `<li>${x}</li>`).join('');
}

function renderControlPlane() {
  const apiForm = document.getElementById('api-form');
  const mask = document.getElementById('mask-toggle').checked;
  ['anthropic', 'openrouter', 'elevenlabs', 'supabase'].forEach((k) => {
    apiForm.elements[k].value = state.config.keys[k] || '';
    apiForm.elements[k].type = mask ? 'password' : 'text';
  });

  document.getElementById('account-list').innerHTML = state.config.accounts.map((a) =>
    `<div class="account-item" data-id="${a.id}"><div><p class="account-name">${a.name}</p><input class="account-handle" value="${a.handle}" /></div><button class="connect-btn ${a.connected ? 'badge ok' : 'badge wait'}">${a.connected ? 'Connected' : 'Connect'}</button></div>`
  ).join('');

  const pf = document.getElementById('policy-form');
  pf.elements.autoPublish.checked = state.config.policy.autoPublish;
  pf.elements.requireApproval.checked = state.config.policy.requireApproval;
  pf.elements.timezone.value = state.config.policy.timezone;
  pf.elements.window.value = state.config.policy.window;
  pf.elements.retryCount.value = String(state.config.policy.retryCount);
}

function renderAll() {
  renderSystemMap();
  renderPackages();
  renderOperations();
  renderFactory();
  renderIntervention();
  renderVideo();
  renderDistribution();
  renderControlPlane();
}

menu.addEventListener('click', (e) => {
  const btn = e.target.closest('.menu-item');
  if (!btn) return;
  setScreen(btn.dataset.screen);
});

document.getElementById('go-control-plane').addEventListener('click', () => setScreen('control-plane'));
document.getElementById('go-intervention').addEventListener('click', () => setScreen('intervention'));

document.getElementById('scene-list').addEventListener('click', (e) => {
  const li = e.target.closest('li[data-scene]');
  if (!li) return;
  state.selectedScene = Number(li.dataset.scene);
  renderVideo();
});

document.getElementById('api-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  state.config.keys.anthropic = form.elements.anthropic.value.trim();
  state.config.keys.openrouter = form.elements.openrouter.value.trim();
  state.config.keys.elevenlabs = form.elements.elevenlabs.value.trim();
  state.config.keys.supabase = form.elements.supabase.value.trim();
  saveState();
  showToast('API dependencies saved');
});

document.getElementById('mask-toggle').addEventListener('change', renderControlPlane);

document.getElementById('account-list').addEventListener('click', (e) => {
  const item = e.target.closest('.account-item');
  if (!item) return;
  const id = item.dataset.id;
  const acc = state.config.accounts.find((a) => a.id === id);
  if (!acc) return;
  const handle = item.querySelector('.account-handle').value;
  if (e.target.classList.contains('connect-btn')) {
    acc.connected = !acc.connected;
    const pipeline = CHANNEL_PIPELINE[acc.name] || 'text';
    state.calendar.unshift({ pipeline, text: `${acc.name} ${acc.connected ? '연동' : '해제'} 반영` });
    state.calendar = state.calendar.slice(0, 8);
  }
  acc.handle = handle;
  saveState();
  renderControlPlane();
  renderDistribution();
});

document.getElementById('policy-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  state.config.policy.autoPublish = form.elements.autoPublish.checked;
  state.config.policy.requireApproval = form.elements.requireApproval.checked;
  state.config.policy.timezone = form.elements.timezone.value;
  state.config.policy.window = form.elements.window.value;
  state.config.policy.retryCount = Number(form.elements.retryCount.value || 0);
  saveState();
  showToast('Governance policy saved');
});

document.getElementById('approval-queue').addEventListener('click', (e) => {
  const li = e.target.closest('li[data-approval-id]');
  if (!li) return;
  const id = li.dataset.approvalId;
  const item = state.approvals.find((a) => a.id === id);
  if (!item) return;

  let nextStatus = item.status;
  if (e.target.classList.contains('approve')) nextStatus = 'connected';
  if (e.target.classList.contains('hold')) nextStatus = 'pending';
  if (e.target.classList.contains('revise')) nextStatus = 'running';
  item.status = nextStatus;

  state.events.unshift({
    pipeline: CHANNEL_PIPELINE[item.channel] || 'text',
    text: `[${new Date().toLocaleTimeString('ko-KR')}] approval.${id} -> ${nextStatus}`
  });
  state.events = state.events.slice(0, 10);
  renderIntervention();
  renderOperations();
  showToast(`Approval ${id} updated`);
});

document.getElementById('override-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const materialId = form.elements.materialId.value;
  const pipeline = form.elements.pipeline.value;
  const priority = form.elements.priority.value;
  state.tasks.unshift({ pipeline, text: `override: ${materialId} -> ${PIPELINES[pipeline].label} (${priority})` });
  state.tasks = state.tasks.slice(0, 8);
  state.events.unshift({ pipeline, text: `[${new Date().toLocaleTimeString('ko-KR')}] route.override ${materialId}` });
  state.events = state.events.slice(0, 10);
  renderSystemMap();
  renderOperations();
  showToast('Manual override applied');
});

document.getElementById('btn-pause').addEventListener('click', () => {
  state.agentHealth = state.agentHealth.map(([n]) => [n, 'idle']);
  state.events.unshift({ pipeline: 'text', text: `[${new Date().toLocaleTimeString('ko-KR')}] ops.pause active pipelines` });
  state.events = state.events.slice(0, 10);
  renderOperations();
  showToast('Active pipelines paused');
});

document.getElementById('btn-retry').addEventListener('click', () => {
  state.tasks.unshift({ pipeline: 'thread', text: 'retry: failed tasks re-queued' });
  state.tasks = state.tasks.slice(0, 8);
  renderSystemMap();
  renderOperations();
  showToast('Retry triggered');
});

document.getElementById('btn-republish').addEventListener('click', () => {
  state.calendar.unshift({ pipeline: 'text', text: 'manual republish bundle queued' });
  state.calendar = state.calendar.slice(0, 8);
  renderDistribution();
  showToast('Republish queued');
});

document.getElementById('btn-drain').addEventListener('click', () => {
  state.runtime[0] = 'Queue depth: 0';
  renderSystemMap();
  showToast('Queue drained (simulated)');
});

document.getElementById('draft-selector').addEventListener('change', (e) => {
  state.selectedDraftId = e.target.value;
  renderIntervention();
});

document.getElementById('draft-request-rewrite').addEventListener('click', () => {
  const d = state.drafts.find((x) => x.id === state.selectedDraftId);
  if (!d) return;
  d.body = `${d.body}\n\n[AI Rewrite Suggestion] 구조를 더 간결하게 재작성했습니다.`;
  renderIntervention();
  showToast('Rewrite suggestion added');
});

document.getElementById('draft-save').addEventListener('click', () => {
  const d = state.drafts.find((x) => x.id === state.selectedDraftId);
  if (!d) return;
  d.body = document.getElementById('draft-body').value;
  state.events.unshift({ pipeline: CHANNEL_PIPELINE[d.channel] || 'text', text: `[${new Date().toLocaleTimeString('ko-KR')}] draft.${d.id} approved` });
  state.events = state.events.slice(0, 10);
  renderOperations();
  showToast('Draft saved and approved');
});

function tick() {
  const task = state.tasks[Math.floor(Math.random() * state.tasks.length)];
  const pipe = state.agentHealth[Math.floor(Math.random() * state.agentHealth.length)];
  pipe[1] = Math.random() > 0.66 ? 'idle' : 'running';
  state.runtime[0] = `Queue depth: ${Math.max(5, Math.floor(8 + Math.random() * 24))}`;
  state.runtime[1] = `Active workers: ${Math.max(3, Math.floor(4 + Math.random() * 5))}`;
  state.runtime[3] = `Pipeline success: ${(92 + Math.random() * 6).toFixed(1)}%`;
  state.progress = (state.progress + Math.floor(Math.random() * 9) + 2) % 101;
  state.activeFlowIndex = (state.activeFlowIndex + 1) % state.flow.length;
  state.bml[1] = `Measure: avg watch +${(12 + Math.random() * 9).toFixed(1)}%`;
  const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  state.tasks.unshift({ pipeline: task.pipeline, text: `${now} ${task.text}` });
  state.tasks = state.tasks.slice(0, 8);
  state.events.unshift({ pipeline: task.pipeline, text: `[${now}] ${task.text}` });
  state.events = state.events.slice(0, 10);
  renderSystemMap();
  renderOperations();
  renderDistribution();
}

setInterval(() => {
  document.getElementById('clock-chip').textContent = `Updated ${new Date().toLocaleTimeString('ko-KR')}`;
  tick();
}, 5000);

renderAll();
document.getElementById('clock-chip').textContent = `Updated ${new Date().toLocaleTimeString('ko-KR')}`;
