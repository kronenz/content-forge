import './styles.css';

const STORE = 'cf-demo2-state';

const PIPE = {
  text: { label: 'Text', color: '#4f8cff' },
  thread: { label: 'Thread', color: '#1ecad3' },
  snackable: { label: 'Snackable', color: '#aa7bff' },
  longform: { label: 'Longform', color: '#ffb84a' },
  shortform: { label: 'Shortform', color: '#45d98f' },
  webtoon: { label: 'Webtoon', color: '#ff6f96' }
};

const LABELS = {
  studio: ['Studio', '자동화 운영 + 사용자 개입이 함께 동작하는 실제 작업 화면'],
  workflow: ['Workflow', '파이프라인별 단계 진행 상태와 게이트 통과 상황'],
  intervene: ['Intervene', '사람이 직접 승인/수정/재라우팅/재배포를 실행'],
  integrations: ['Integrations', '외부 의존성 키/연동/배포정책 관리']
};

const base = {
  kpi: { throughput: 38, approvalLag: 12, publishRate: 93.2, incidents: 1 },
  queue: [
    { id: 'T-201', material: 'AI GTM 프레임워크', pipeline: 'text', stage: 'writer', priority: 'high', status: 'running' },
    { id: 'T-202', material: 'Threads 성장 실험', pipeline: 'thread', stage: 'guardian', priority: 'normal', status: 'pending' },
    { id: 'T-203', material: '리일스 훅 패턴', pipeline: 'shortform', stage: 'render', priority: 'urgent', status: 'running' },
    { id: 'T-204', material: '브랜드 캐러셀', pipeline: 'snackable', stage: 'publisher', priority: 'normal', status: 'pending' },
    { id: 'T-205', material: '웹툰 스크립트', pipeline: 'webtoon', stage: 'scene', priority: 'normal', status: 'pending' }
  ],
  stream: [
    '[09:20:11] collector merged 14 materials',
    '[09:20:29] strategist routed T-201 -> text',
    '[09:20:41] humanizer pass rate 95%',
    '[09:20:55] publisher queued youtube batch'
  ],
  matrix: {
    text: ['collect done', 'write run', 'review pending', 'publish pending'],
    thread: ['collect done', 'write done', 'review run', 'publish pending'],
    snackable: ['collect done', 'write run', 'design run', 'publish pending'],
    longform: ['collect done', 'script run', 'tts pending', 'render pending'],
    shortform: ['collect done', 'script done', 'render run', 'publish pending'],
    webtoon: ['collect done', 'story run', 'panel pending', 'publish pending']
  },
  gates: [
    { name: 'Fact Check', pass: 17, hold: 2 },
    { name: 'Brand Tone', pass: 22, hold: 1 },
    { name: 'Legal Guard', pass: 24, hold: 0 }
  ],
  approvals: [
    { id: 'A-11', taskId: 'T-201', channel: 'LinkedIn', reason: '톤 조정 필요', status: 'pending' },
    { id: 'A-12', taskId: 'T-203', channel: 'Shorts', reason: 'CTA 과장 표현', status: 'pending' }
  ],
  drafts: [
    { id: 'D-1', channel: 'LinkedIn', body: '초안: 핵심 인사이트 3개를 직관적으로 정리했습니다.' },
    { id: 'D-2', channel: 'Shorts', body: '초안: 3초 훅-문제-해결-CTA 구조를 사용합니다.' }
  ],
  selectedDraft: 'D-1',
  accounts: [
    { id: 'youtube', name: 'YouTube', handle: '@contentforge', on: true },
    { id: 'linkedin', name: 'LinkedIn', handle: 'company/contentforge', on: true },
    { id: 'x', name: 'X', handle: '@contentforge_ai', on: false },
    { id: 'threads', name: 'Threads', handle: '@contentforge', on: false },
    { id: 'instagram', name: 'Instagram', handle: '@contentforge.studio', on: true }
  ],
  keys: { anthropic: '', openrouter: '', elevenlabs: '', supabase: '' },
  policy: { auto: true, approval: true, tz: 'Asia/Seoul', window: '18:00-22:00', retry: 3 }
};

const state = load();
const menu = document.getElementById('menu');
const screens = [...document.querySelectorAll('.screen')];
const title = document.getElementById('title');
const desc = document.getElementById('desc');
const toast = document.getElementById('toast');

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? { ...structuredClone(base), ...JSON.parse(raw) } : structuredClone(base);
  } catch {
    return structuredClone(base);
  }
}

function save() {
  localStorage.setItem(STORE, JSON.stringify(state));
}

function notify(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1300);
}

function pipeBadge(key) {
  const p = PIPE[key];
  return `<span class="pipe" style="--pc:${p.color}"><i></i>${p.label}</span>`;
}

function statusTag(status) {
  const cls = status === 'running' ? 'run' : status === 'pending' ? 'wait' : 'ok';
  return `<em class="tag ${cls}">${status}</em>`;
}

function renderLegend() {
  document.getElementById('pipeline-legend').innerHTML = Object.keys(PIPE).map(pipeBadge).join('');
}

function renderStudio() {
  const k = state.kpi;
  document.getElementById('kpi-grid').innerHTML = `
    <article class="kpi"><p>Throughput/h</p><h3>${k.throughput}</h3></article>
    <article class="kpi"><p>Approval Lag(min)</p><h3>${k.approvalLag}</h3></article>
    <article class="kpi"><p>Publish Success</p><h3>${k.publishRate.toFixed(1)}%</h3></article>
    <article class="kpi"><p>Incidents</p><h3>${k.incidents}</h3></article>`;

  document.getElementById('queue-count').textContent = `${state.queue.length} tasks`;
  document.getElementById('queue-list').innerHTML = state.queue.map((t) => `
    <div class="queue-item" data-task="${t.id}">
      <div class="q-main">
        ${pipeBadge(t.pipeline)}
        <strong>${t.id}</strong>
        <span>${t.material}</span>
      </div>
      <div class="q-side">
        <span class="pri ${t.priority}">${t.priority}</span>
        ${statusTag(t.status)}
      </div>
    </div>`).join('');

  document.getElementById('stream').innerHTML = state.stream.map((s) => `<li>${s}</li>`).join('');
}

function renderWorkflow() {
  document.getElementById('matrix').innerHTML = Object.entries(state.matrix).map(([p, steps]) => `
    <div class="matrix-col">
      <h4>${pipeBadge(p)}</h4>
      ${steps.map((x) => `<p>${x}</p>`).join('')}
    </div>`).join('');

  document.getElementById('gates').innerHTML = state.gates.map((g) => `
    <div class="gate">
      <strong>${g.name}</strong>
      <span>pass ${g.pass}</span>
      <span>hold ${g.hold}</span>
    </div>`).join('');
}

function renderIntervene() {
  document.getElementById('approval-list').innerHTML = state.approvals.map((a) => `
    <li data-aid="${a.id}">
      <div class="a-head"><strong>${a.id}</strong><span>${a.taskId} · ${a.channel}</span></div>
      <p>${a.reason}</p>
      <div class="a-actions">
        <button class="mini approve">Approve</button>
        <button class="mini hold">Hold</button>
        <button class="mini revise">Revise</button>
      </div>
    </li>`).join('');

  document.getElementById('override-task').innerHTML = state.queue.map((q) => `<option value="${q.id}">${q.id} · ${q.material}</option>`).join('');
  document.getElementById('override-pipeline').innerHTML = Object.entries(PIPE).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');

  document.getElementById('draft-select').innerHTML = state.drafts.map((d) => `<option value="${d.id}">${d.id} · ${d.channel}</option>`).join('');
  const d = state.drafts.find((x) => x.id === state.selectedDraft) || state.drafts[0];
  if (d) {
    document.getElementById('draft-select').value = d.id;
    document.getElementById('draft-channel').value = d.channel;
    document.getElementById('draft-body').value = d.body;
  }
}

function renderIntegrations() {
  const f = document.getElementById('keys-form');
  const mask = document.getElementById('mask').checked;
  ['anthropic', 'openrouter', 'elevenlabs', 'supabase'].forEach((k) => {
    f.elements[k].value = state.keys[k];
    f.elements[k].type = mask ? 'password' : 'text';
  });

  document.getElementById('accounts').innerHTML = state.accounts.map((a) => `
    <div class="acc" data-id="${a.id}">
      <div><strong>${a.name}</strong><input class="acc-h" value="${a.handle}" /></div>
      <button class="tag ${a.on ? 'ok' : 'wait'} toggle">${a.on ? 'connected' : 'connect'}</button>
    </div>`).join('');

  const p = document.getElementById('policy-form');
  p.elements.auto.checked = state.policy.auto;
  p.elements.approval.checked = state.policy.approval;
  p.elements.tz.value = state.policy.tz;
  p.elements.window.value = state.policy.window;
  p.elements.retry.value = String(state.policy.retry);
}

function renderAll() {
  renderLegend();
  renderStudio();
  renderWorkflow();
  renderIntervene();
  renderIntegrations();
}

menu.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-screen]');
  if (!btn) return;
  document.querySelectorAll('#menu button').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  const id = btn.dataset.screen;
  screens.forEach((s) => s.classList.toggle('show', s.id === id));
  title.textContent = LABELS[id][0];
  desc.textContent = LABELS[id][1];
});

document.getElementById('go-control-plane').addEventListener('click', () => {
  document.querySelector('#menu button[data-screen="integrations"]').click();
});

document.getElementById('go-intervention').addEventListener('click', () => {
  document.querySelector('#menu button[data-screen="intervene"]').click();
});

document.getElementById('btn-run').addEventListener('click', () => {
  state.stream.unshift(`[${now()}] manual batch start`);
  state.kpi.throughput += 1;
  renderStudio();
  notify('batch started');
});

document.getElementById('btn-emergency').addEventListener('click', () => {
  state.queue.forEach((q) => { if (q.status === 'running') q.status = 'pending'; });
  state.stream.unshift(`[${now()}] emergency pause activated`);
  renderStudio();
  notify('paused running tasks');
});

document.getElementById('approval-list').addEventListener('click', (e) => {
  const li = e.target.closest('li[data-aid]');
  if (!li) return;
  const aid = li.dataset.aid;
  const a = state.approvals.find((x) => x.id === aid);
  if (!a) return;
  if (e.target.classList.contains('approve')) a.status = 'approved';
  if (e.target.classList.contains('hold')) a.status = 'pending';
  if (e.target.classList.contains('revise')) a.status = 'revise';
  state.stream.unshift(`[${now()}] approval ${aid} -> ${a.status}`);
  renderIntervene();
  renderStudio();
  notify(`${aid} ${a.status}`);
});

document.getElementById('override-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const taskId = f.elements[0].value;
  const pipeline = f.elements[1].value;
  const pri = f.elements[2].value;
  const task = state.queue.find((q) => q.id === taskId);
  if (task) {
    task.pipeline = pipeline;
    task.priority = pri;
    state.stream.unshift(`[${now()}] override ${taskId} -> ${PIPE[pipeline].label} (${pri})`);
    renderAll();
    notify('override applied');
  }
});

document.getElementById('btn-retry').addEventListener('click', () => {
  state.stream.unshift(`[${now()}] retry failed tasks`);
  notify('retry queued');
  renderStudio();
});

document.getElementById('btn-redeploy').addEventListener('click', () => {
  state.stream.unshift(`[${now()}] redeploy last successful bundle`);
  notify('redeploy queued');
  renderStudio();
});

document.getElementById('btn-drain').addEventListener('click', () => {
  state.queue = [];
  state.stream.unshift(`[${now()}] queue drained by operator`);
  renderAll();
  notify('queue drained');
});

document.getElementById('draft-select').addEventListener('change', (e) => {
  state.selectedDraft = e.target.value;
  renderIntervene();
});

document.getElementById('btn-rewrite').addEventListener('click', () => {
  const d = state.drafts.find((x) => x.id === state.selectedDraft);
  if (!d) return;
  d.body = `${d.body}\n\n[AI Suggestion] 핵심 메시지를 앞단으로 이동해 가독성을 개선했습니다.`;
  renderIntervene();
  notify('rewrite suggestion added');
});

document.getElementById('btn-approve-draft').addEventListener('click', () => {
  const d = state.drafts.find((x) => x.id === state.selectedDraft);
  if (!d) return;
  d.body = document.getElementById('draft-body').value;
  state.stream.unshift(`[${now()}] draft ${d.id} approved for ${d.channel}`);
  renderStudio();
  notify('draft approved');
});

document.getElementById('keys-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  state.keys.anthropic = f.elements.anthropic.value.trim();
  state.keys.openrouter = f.elements.openrouter.value.trim();
  state.keys.elevenlabs = f.elements.elevenlabs.value.trim();
  state.keys.supabase = f.elements.supabase.value.trim();
  save();
  notify('keys saved');
});

document.getElementById('mask').addEventListener('change', renderIntegrations);

document.getElementById('accounts').addEventListener('click', (e) => {
  const accEl = e.target.closest('.acc');
  if (!accEl) return;
  const acc = state.accounts.find((a) => a.id === accEl.dataset.id);
  if (!acc) return;
  acc.handle = accEl.querySelector('.acc-h').value;
  if (e.target.classList.contains('toggle')) {
    acc.on = !acc.on;
    state.stream.unshift(`[${now()}] account ${acc.name} ${acc.on ? 'connected' : 'disconnected'}`);
  }
  renderIntegrations();
  renderStudio();
  notify('account updated');
});

document.getElementById('policy-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  state.policy.auto = f.elements.auto.checked;
  state.policy.approval = f.elements.approval.checked;
  state.policy.tz = f.elements.tz.value;
  state.policy.window = f.elements.window.value;
  state.policy.retry = Number(f.elements.retry.value || 0);
  save();
  notify('policy saved');
});

function now() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function tick() {
  if (state.queue.length) {
    const q = state.queue[Math.floor(Math.random() * state.queue.length)];
    const allStages = ['collect', 'strategist', 'writer', 'guardian', 'publisher', 'analytics'];
    q.stage = allStages[Math.floor(Math.random() * allStages.length)];
    q.status = Math.random() > 0.55 ? 'running' : 'pending';
  }
  state.kpi.throughput = Math.max(20, state.kpi.throughput + Math.floor((Math.random() - 0.4) * 3));
  state.kpi.approvalLag = Math.max(4, state.kpi.approvalLag + Math.floor((Math.random() - 0.55) * 2));
  state.kpi.publishRate = Math.max(88, Math.min(99, state.kpi.publishRate + (Math.random() - 0.5) * 0.9));
  state.stream.unshift(`[${now()}] auto tick: queue=${state.queue.length}, success=${state.kpi.publishRate.toFixed(1)}%`);
  state.stream = state.stream.slice(0, 10);
  renderStudio();
}

setInterval(() => {
  document.getElementById('clock').textContent = now();
  tick();
}, 4000);

renderAll();
document.getElementById('clock').textContent = now();
