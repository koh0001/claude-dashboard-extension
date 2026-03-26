/**
 * 가상 스크린샷 생성기
 * 테스트 데이터 기반으로 각 탭의 대시보드 스크린샷을 Playwright로 캡처
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'images', 'screenshots');
mkdirSync(OUT, { recursive: true });

// 번역 데이터
const TRANSLATIONS = {
  ko: {
    overview: 'Overview', tasks: '태스크', messages: '메시지', deps: '의존성',
    activity: '활동 피드', timeline: '타임라인', metrics: '메트릭',
    agentTitle: '에이전트 ({count}명)', taskProgress: '{done}/{total} 완료',
    completed: '완료', inProgress: '진행 중', pending: '대기',
    statsTotal: '전체 태스크', statsActive: '진행 중', statsMsg: '메시지', statsElapsed: '경과',
    searchPlaceholder: '전체 검색...', noActivity: '활동이 없습니다',
    today: '오늘', completionRate: '완료율', agentUtil: '에이전트 활용도',
    filesChanged: '변경된 파일 수', taskVelocity: '태스크 처리 속도',
    assignee: '담당자', status: '상태', blocker: 'blocked by',
    table: '테이블', kanban: '칸반', all: '전체', conversation: '대화', system: '시스템',
    tokenTitle: '토큰 사용량', tokenInput: '입력 토큰', tokenOutput: '출력 토큰',
    tokenCache: '캐시 생성', tokenRead: '캐시 읽기', tokenTotal: '총 토큰',
  },
  en: {
    overview: 'Overview', tasks: 'Tasks', messages: 'Messages', deps: 'Dependencies',
    activity: 'Activity Feed', timeline: 'Timeline', metrics: 'Metrics',
    agentTitle: 'Agents ({count})', taskProgress: '{done}/{total} done',
    completed: 'Completed', inProgress: 'In Progress', pending: 'Pending',
    statsTotal: 'Total Tasks', statsActive: 'Active', statsMsg: 'Messages', statsElapsed: 'Elapsed',
    searchPlaceholder: 'Search everywhere...', noActivity: 'No activity',
    today: 'Today', completionRate: 'Completion Rate', agentUtil: 'Agent Utilization',
    filesChanged: 'Files Changed', taskVelocity: 'Task Velocity',
    assignee: 'Assignee', status: 'Status', blocker: 'blocked by',
    table: 'Table', kanban: 'Kanban', all: 'All', conversation: 'Conversation', system: 'System',
    tokenTitle: 'Token Usage', tokenInput: 'Input Tokens', tokenOutput: 'Output Tokens',
    tokenCache: 'Cache Creation', tokenRead: 'Cache Read', tokenTotal: 'Total Tokens',
  },
  ja: {
    overview: 'Overview', tasks: 'タスク', messages: 'メッセージ', deps: '依存関係',
    activity: 'アクティビティ', timeline: 'タイムライン', metrics: 'メトリクス',
    agentTitle: 'エージェント ({count}名)', taskProgress: '{done}/{total} 完了',
    completed: '完了', inProgress: '進行中', pending: '保留中',
    statsTotal: '全タスク', statsActive: 'アクティブ', statsMsg: 'メッセージ', statsElapsed: '経過',
    searchPlaceholder: '全体検索...', noActivity: 'アクティビティなし',
    today: '今日', completionRate: '完了率', agentUtil: 'エージェント稼働率',
    filesChanged: '変更ファイル数', taskVelocity: 'タスク処理速度',
    assignee: '担当者', status: 'ステータス', blocker: 'blocked by',
    table: 'テーブル', kanban: 'カンバン', all: 'すべて', conversation: '会話', system: 'システム',
    tokenTitle: 'トークン使用量', tokenInput: '入力トークン', tokenOutput: '出力トークン',
    tokenCache: 'キャッシュ作成', tokenRead: 'キャッシュ読取', tokenTotal: '合計トークン',
  },
  zh: {
    overview: 'Overview', tasks: '任务', messages: '消息', deps: '依赖',
    activity: '活动动态', timeline: '时间线', metrics: '指标',
    agentTitle: '代理 ({count}人)', taskProgress: '{done}/{total} 完成',
    completed: '已完成', inProgress: '进行中', pending: '待处理',
    statsTotal: '总任务', statsActive: '活跃', statsMsg: '消息', statsElapsed: '经过',
    searchPlaceholder: '全局搜索...', noActivity: '暂无活动',
    today: '今天', completionRate: '完成率', agentUtil: '代理利用率',
    filesChanged: '变更文件数', taskVelocity: '任务处理速度',
    assignee: '负责人', status: '状态', blocker: 'blocked by',
    table: '表格', kanban: '看板', all: '全部', conversation: '对话', system: '系统',
    tokenTitle: 'Token 用量', tokenInput: '输入 Token', tokenOutput: '输出 Token',
    tokenCache: '缓存创建', tokenRead: '缓存读取', tokenTotal: '总 Token',
  },
};

// 테스트 데이터 (언어별 현지화)
const agents = [
  { name: 'team-lead', type: 'Architecture Lead', model: 'opus', color: '#ffd700', isLead: true, status: 'active', current: 'Review PR #42', done: 3, total: 3 },
  { name: 'backend-dev', type: 'Backend Developer', model: 'sonnet', color: '#4caf50', isLead: false, status: 'active', current: 'Export Service', done: 2, total: 4 },
  { name: 'frontend-dev', type: 'Frontend Developer', model: 'sonnet', color: '#2196f3', isLead: false, status: 'active', current: 'Search & Filter', done: 3, total: 5 },
  { name: 'qa-engineer', type: 'QA Engineer', model: 'haiku', color: '#ff9800', isLead: false, status: 'idle', current: null, done: 0, total: 1 },
];

const TASKS = {
  ko: [
    { id: '1', title: 'Timeline View 탭 구현', status: 'completed', assignee: 'frontend-dev' },
    { id: '2', title: 'Performance Metrics 구현', status: 'completed', assignee: 'frontend-dev' },
    { id: '3', title: 'SVG DAG 그래프 개선', status: 'completed', assignee: 'frontend-dev' },
    { id: '4', title: 'Git Diff 연동 서비스', status: 'completed', assignee: 'backend-dev' },
    { id: '5', title: '검색 및 필터 기능', status: 'in_progress', assignee: 'frontend-dev' },
    { id: '6', title: 'Export 서비스 구현', status: 'in_progress', assignee: 'backend-dev' },
    { id: '7', title: 'MCP 서버 모드 구현', status: 'pending', assignee: 'backend-dev' },
    { id: '8', title: '통합 테스트 및 QA', status: 'pending', assignee: 'qa-engineer' },
  ],
  en: [
    { id: '1', title: 'Implement Timeline View tab', status: 'completed', assignee: 'frontend-dev' },
    { id: '2', title: 'Performance Metrics dashboard', status: 'completed', assignee: 'frontend-dev' },
    { id: '3', title: 'Improve SVG DAG graph', status: 'completed', assignee: 'frontend-dev' },
    { id: '4', title: 'Git Diff integration service', status: 'completed', assignee: 'backend-dev' },
    { id: '5', title: 'Search and filter feature', status: 'in_progress', assignee: 'frontend-dev' },
    { id: '6', title: 'Implement Export service', status: 'in_progress', assignee: 'backend-dev' },
    { id: '7', title: 'MCP server mode', status: 'pending', assignee: 'backend-dev' },
    { id: '8', title: 'Integration testing & QA', status: 'pending', assignee: 'qa-engineer' },
  ],
  ja: [
    { id: '1', title: 'タイムラインビュータブ実装', status: 'completed', assignee: 'frontend-dev' },
    { id: '2', title: 'パフォーマンスメトリクス', status: 'completed', assignee: 'frontend-dev' },
    { id: '3', title: 'SVG DAGグラフ改善', status: 'completed', assignee: 'frontend-dev' },
    { id: '4', title: 'Git Diff連携サービス', status: 'completed', assignee: 'backend-dev' },
    { id: '5', title: '検索・フィルター機能', status: 'in_progress', assignee: 'frontend-dev' },
    { id: '6', title: 'エクスポートサービス実装', status: 'in_progress', assignee: 'backend-dev' },
    { id: '7', title: 'MCPサーバーモード', status: 'pending', assignee: 'backend-dev' },
    { id: '8', title: '統合テスト・QA', status: 'pending', assignee: 'qa-engineer' },
  ],
  zh: [
    { id: '1', title: '实现时间线视图标签', status: 'completed', assignee: 'frontend-dev' },
    { id: '2', title: '性能指标仪表板', status: 'completed', assignee: 'frontend-dev' },
    { id: '3', title: '改进SVG DAG图', status: 'completed', assignee: 'frontend-dev' },
    { id: '4', title: 'Git Diff集成服务', status: 'completed', assignee: 'backend-dev' },
    { id: '5', title: '搜索和过滤功能', status: 'in_progress', assignee: 'frontend-dev' },
    { id: '6', title: '实现导出服务', status: 'in_progress', assignee: 'backend-dev' },
    { id: '7', title: 'MCP服务器模式', status: 'pending', assignee: 'backend-dev' },
    { id: '8', title: '集成测试与QA', status: 'pending', assignee: 'qa-engineer' },
  ],
};

const ACTIVITIES = {
  ko: [
    { time: '09:25', icon: '📝', text: 'CLAUDE.md 수정' },
    { time: '09:24', icon: '⚡', text: 'npm run lint 실행' },
    { time: '09:23', icon: '⚡', text: 'npm run test:run 실행' },
    { time: '09:22', icon: '⚡', text: 'npm run build 실행' },
    { time: '09:21', icon: '📝', text: 'package.json 수정' },
    { time: '09:20', icon: '📝', text: 'extension.ts 수정' },
    { time: '09:19', icon: '📝', text: 'mcp-service.ts 생성' },
    { time: '09:17', icon: '📝', text: 'webhook-service.ts 생성' },
    { time: '09:15', icon: '📝', text: 'export-service.ts 생성' },
    { time: '09:13', icon: '📝', text: 'messages.ts 수정' },
  ],
  en: [
    { time: '09:25', icon: '📝', text: 'Modified CLAUDE.md' },
    { time: '09:24', icon: '⚡', text: 'Ran npm run lint' },
    { time: '09:23', icon: '⚡', text: 'Ran npm run test:run' },
    { time: '09:22', icon: '⚡', text: 'Ran npm run build' },
    { time: '09:21', icon: '📝', text: 'Modified package.json' },
    { time: '09:20', icon: '📝', text: 'Modified extension.ts' },
    { time: '09:19', icon: '📝', text: 'Created mcp-service.ts' },
    { time: '09:17', icon: '📝', text: 'Created webhook-service.ts' },
    { time: '09:15', icon: '📝', text: 'Created export-service.ts' },
    { time: '09:13', icon: '📝', text: 'Modified messages.ts' },
  ],
  ja: [
    { time: '09:25', icon: '📝', text: 'CLAUDE.md 変更' },
    { time: '09:24', icon: '⚡', text: 'npm run lint 実行' },
    { time: '09:23', icon: '⚡', text: 'npm run test:run 実行' },
    { time: '09:22', icon: '⚡', text: 'npm run build 実行' },
    { time: '09:21', icon: '📝', text: 'package.json 変更' },
    { time: '09:20', icon: '📝', text: 'extension.ts 変更' },
    { time: '09:19', icon: '📝', text: 'mcp-service.ts 作成' },
    { time: '09:17', icon: '📝', text: 'webhook-service.ts 作成' },
    { time: '09:15', icon: '📝', text: 'export-service.ts 作成' },
    { time: '09:13', icon: '📝', text: 'messages.ts 変更' },
  ],
  zh: [
    { time: '09:25', icon: '📝', text: '修改 CLAUDE.md' },
    { time: '09:24', icon: '⚡', text: '执行 npm run lint' },
    { time: '09:23', icon: '⚡', text: '执行 npm run test:run' },
    { time: '09:22', icon: '⚡', text: '执行 npm run build' },
    { time: '09:21', icon: '📝', text: '修改 package.json' },
    { time: '09:20', icon: '📝', text: '修改 extension.ts' },
    { time: '09:19', icon: '📝', text: '创建 mcp-service.ts' },
    { time: '09:17', icon: '📝', text: '创建 webhook-service.ts' },
    { time: '09:15', icon: '📝', text: '创建 export-service.ts' },
    { time: '09:13', icon: '📝', text: '修改 messages.ts' },
  ],
};

const MESSAGES = {
  ko: [
    { from: 'backend-dev', to: 'team-lead', content: 'GitService에서 execFile 대신 spawn을 써야 할까요?', time: '09:10', type: 'text' },
    { from: 'team-lead', to: 'backend-dev', content: 'execFile로 충분합니다. maxBuffer를 10MB로 설정하세요.', time: '09:11', type: 'text' },
    { from: 'system', to: 'team-lead', content: 'task_assignment: Export 서비스 → backend-dev', time: '09:12', type: 'system' },
    { from: 'frontend-dev', to: 'team-lead', content: 'Timeline과 Metrics 탭 구현 완료했습니다.', time: '09:15', type: 'text' },
    { from: 'system', to: 'team-lead', content: 'permission_request: fs.writeFileSync 권한 필요', time: '09:18', type: 'permission' },
  ],
  en: [
    { from: 'backend-dev', to: 'team-lead', content: 'Should we use spawn instead of execFile in GitService?', time: '09:10', type: 'text' },
    { from: 'team-lead', to: 'backend-dev', content: 'execFile is fine. Set maxBuffer to 10MB.', time: '09:11', type: 'text' },
    { from: 'system', to: 'team-lead', content: 'task_assignment: Export Service → backend-dev', time: '09:12', type: 'system' },
    { from: 'frontend-dev', to: 'team-lead', content: 'Timeline and Metrics tabs are done.', time: '09:15', type: 'text' },
    { from: 'system', to: 'team-lead', content: 'permission_request: fs.writeFileSync access needed', time: '09:18', type: 'permission' },
  ],
  ja: [
    { from: 'backend-dev', to: 'team-lead', content: 'GitServiceでexecFileの代わりにspawnを使うべきですか？', time: '09:10', type: 'text' },
    { from: 'team-lead', to: 'backend-dev', content: 'execFileで十分です。maxBufferを10MBに設定してください。', time: '09:11', type: 'text' },
    { from: 'system', to: 'team-lead', content: 'task_assignment: エクスポートサービス → backend-dev', time: '09:12', type: 'system' },
    { from: 'frontend-dev', to: 'team-lead', content: 'タイムラインとメトリクスタブの実装完了しました。', time: '09:15', type: 'text' },
    { from: 'system', to: 'team-lead', content: 'permission_request: fs.writeFileSync権限が必要', time: '09:18', type: 'permission' },
  ],
  zh: [
    { from: 'backend-dev', to: 'team-lead', content: 'GitService 中应该用 spawn 替代 execFile 吗？', time: '09:10', type: 'text' },
    { from: 'team-lead', to: 'backend-dev', content: 'execFile 就够了，把 maxBuffer 设为 10MB。', time: '09:11', type: 'text' },
    { from: 'system', to: 'team-lead', content: 'task_assignment: 导出服务 → backend-dev', time: '09:12', type: 'system' },
    { from: 'frontend-dev', to: 'team-lead', content: '时间线和指标标签已完成。', time: '09:15', type: 'text' },
    { from: 'system', to: 'team-lead', content: 'permission_request: 需要 fs.writeFileSync 权限', time: '09:18', type: 'permission' },
  ],
};

function generateHtml(tab, lang) {
  const t = TRANSLATIONS[lang];
  const tasks = TASKS[lang];
  const activities = ACTIVITIES[lang];
  const messages = MESSAGES[lang];
  const statusColors = { completed: '#4caf50', in_progress: '#ff9800', pending: '#9e9e9e' };
  const statusLabels = { completed: t.completed, in_progress: t.inProgress, pending: t.pending };

  const tabs = ['overview','tasks','messages','deps','activity','timeline','metrics'];
  const tabLabels = { overview: t.overview, tasks: t.tasks, messages: t.messages, deps: t.deps, activity: t.activity, timeline: t.timeline, metrics: t.metrics };

  let content = '';

  if (tab === 'overview') {
    content = `<h3>${t.agentTitle.replace('{count}', '4')}</h3>
    <div class="agent-grid">${agents.map(a => `
      <div class="agent-card" style="border-left:3px solid ${a.color}">
        <div class="agent-header">
          <span class="agent-name">${a.isLead ? '👑 ' : ''}${a.name}</span>
          <span class="agent-model">${a.model}</span>
        </div>
        <div class="agent-desc">${a.type}</div>
        <div class="agent-task">${t.taskProgress.replace('{done}',a.done).replace('{total}',a.total)}</div>
        ${a.current ? `<div class="agent-current">▶ ${a.current}</div>` : ''}
      </div>`).join('')}
    </div>`;
  } else if (tab === 'tasks') {
    content = `<div class="view-toggle"><button class="toggle-active">${t.table}</button><button>${t.kanban}</button></div>
    <table class="task-table"><thead><tr><th>ID</th><th>${t.tasks}</th><th>${t.assignee}</th><th>${t.status}</th></tr></thead><tbody>
    ${tasks.map(tk => `<tr><td>#${tk.id}</td><td>${tk.title}</td><td>${tk.assignee}</td>
      <td><span class="badge" style="background:${statusColors[tk.status]}20;color:${statusColors[tk.status]}">${statusLabels[tk.status]}</span></td></tr>`).join('')}
    </tbody></table>
    <div class="footer">${tasks.length} tasks — ${tasks.filter(t=>t.status==='pending').length} pending  ${tasks.filter(t=>t.status==='in_progress').length} in progress  ${tasks.filter(t=>t.status==='completed').length} completed</div>`;
  } else if (tab === 'messages') {
    content = `<div class="msg-filters"><button class="toggle-active">${t.all}</button><button>${t.conversation}</button><button>${t.system}</button></div>
    <div class="msg-list">${messages.map(m => `
      <div class="msg ${m.type}">
        <div class="msg-header"><span class="msg-from">${m.from} → ${m.to}</span><span>${m.time}</span></div>
        <div class="msg-content">${m.content}</div>
      </div>`).join('')}
    </div>`;
  } else if (tab === 'deps') {
    // 노드별 DOM 기반 연결 대신, 각 노드 사이에 인라인 SVG 화살표를 삽입
    const nodeHtml = (id) => {
      const tk = tasks.find(t => t.id === id);
      return `<div class="dag-node" data-id="${id}" style="border-left:3px solid ${statusColors[tk.status]}"><span class="node-id">#${id}</span><span class="node-title">${tk.title.slice(0,22)}</span></div>`;
    };
    const arrow = `<svg width="50" height="20" viewBox="0 0 50 20" class="dag-arrow-svg"><path d="M0 10 L40 10" stroke="#666" stroke-width="1.5" fill="none"/><polygon points="38,6 46,10 38,14" fill="#666"/></svg>`;
    const arrowDown = `<svg width="50" height="40" viewBox="0 0 50 40" class="dag-arrow-svg"><path d="M0 0 C25 0, 25 40, 50 40" stroke="#666" stroke-width="1.5" fill="none"/><polygon points="44,37 52,40 44,43" fill="#666"/></svg>`;

    content = `<h3>${t.deps}</h3>
    <div class="dag-grid">
      <div class="dag-col">
        <div class="layer-title">Layer 0</div>
        ${nodeHtml('1')}${nodeHtml('2')}${nodeHtml('3')}${nodeHtml('4')}
      </div>
      <div class="dag-col dag-arrows-col">
        <div class="layer-title">&nbsp;</div>
        <div class="dag-arrow-row">${arrow}</div>
        <div class="dag-arrow-row">${arrow}</div>
        <div class="dag-arrow-row" style="opacity:0">${arrow}</div>
        <div class="dag-arrow-row">${arrow}</div>
      </div>
      <div class="dag-col">
        <div class="layer-title">Layer 1</div>
        ${nodeHtml('5')}${nodeHtml('6')}${nodeHtml('7')}
      </div>
      <div class="dag-col dag-arrows-col">
        <div class="layer-title">&nbsp;</div>
        <div class="dag-arrow-row">${arrow}</div>
        <div class="dag-arrow-row">${arrow}</div>
        <div class="dag-arrow-row">${arrow}</div>
      </div>
      <div class="dag-col">
        <div class="layer-title">Layer 2</div>
        ${nodeHtml('8')}
      </div>
    </div>`;
  } else if (tab === 'activity') {
    content = `<div class="activity-list">${activities.map(a => `
      <div class="activity-row"><span class="act-time">${a.time}</span><span>${a.icon}</span><span class="act-text">${a.text}</span></div>`).join('')}
    </div>`;
  } else if (tab === 'timeline') {
    content = `<h3>${t.timeline}</h3><div class="timeline">
      <div class="tl-date">${t.today}</div>
      ${activities.slice(0, 7).map(a => `
      <div class="tl-item"><div class="tl-dot"></div><div class="tl-content">
        <div class="tl-header"><span>${a.icon}</span><span class="tl-time">${a.time}</span></div>
        <div class="tl-text">${a.text}</div>
      </div></div>`).join('')}
    </div>`;
  } else if (tab === 'metrics') {
    const fileData = [
      { name: 'dashboard-js.ts', count: 12 }, { name: 'extension.ts', count: 8 },
      { name: 'dashboard-css.ts', count: 6 }, { name: 'messages.ts', count: 4 },
      { name: 'ko.ts', count: 3 }, { name: 'en.ts', count: 3 },
    ];
    content = `<h3>${t.metrics}</h3>
    <div class="metrics-grid">
      <div class="metric-card"><svg viewBox="0 0 36 36" width="60" height="60" class="donut"><circle cx="18" cy="18" r="15.9" fill="none" stroke="#333" stroke-width="3"/><circle cx="18" cy="18" r="15.9" fill="none" stroke="#4caf50" stroke-width="3" stroke-dasharray="50 50" transform="rotate(-90 18 18)"/></svg><div class="donut-label">50%</div><div class="metric-name">${t.completionRate}</div><div class="metric-sub">4/8</div></div>
      <div class="metric-card"><svg viewBox="0 0 36 36" width="60" height="60" class="donut"><circle cx="18" cy="18" r="15.9" fill="none" stroke="#333" stroke-width="3"/><circle cx="18" cy="18" r="15.9" fill="none" stroke="#2196f3" stroke-width="3" stroke-dasharray="75 25" transform="rotate(-90 18 18)"/></svg><div class="donut-label">75%</div><div class="metric-name">${t.agentUtil}</div><div class="metric-sub">4 agents</div></div>
      <div class="metric-card"><div class="metric-icon">📁</div><div class="metric-val">12</div><div class="metric-name">${t.filesChanged}</div></div>
      <div class="metric-card"><div class="metric-icon">📊</div><div class="metric-val">1</div><div class="metric-name">Sessions</div></div>
    </div>
    <h4 style="margin:16px 0 8px">${t.taskVelocity}</h4>
    <div class="velocity">${[2,4,6,8,5,3,7,9,6,4,3,2].map((v,i) => `<div class="vel-wrap"><div class="vel-bar" style="height:${v*10}%"></div><div class="vel-label">${String(i+9).padStart(2,'0')}</div></div>`).join('')}</div>
    <h4 style="margin:16px 0 8px">${t.filesChanged}</h4>
    <div class="heatmap">${fileData.map(f => `<div class="hm-row"><span class="hm-file">${f.name}</span><div class="hm-bar-wrap"><div class="hm-bar" style="width:${(f.count/12)*100}%"></div></div><span class="hm-count">${f.count}</span></div>`).join('')}</div>`;
  } else if (tab === 'tokens') {
    const tkData = { input: 48520, output: 12340, cache: 87340, read: 24680, total: 172880 };
    content = `<h3>${t.tokenTitle}</h3>
    <div class="metrics-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="metric-card"><div class="metric-val" style="color:#2196f3">${(tkData.input/1000).toFixed(1)}K</div><div class="metric-name">${t.tokenInput}</div></div>
      <div class="metric-card"><div class="metric-val" style="color:#4caf50">${(tkData.output/1000).toFixed(1)}K</div><div class="metric-name">${t.tokenOutput}</div></div>
      <div class="metric-card"><div class="metric-val" style="color:#ff9800">${(tkData.cache/1000).toFixed(1)}K</div><div class="metric-name">${t.tokenCache}</div></div>
      <div class="metric-card"><div class="metric-val" style="color:#9c27b0">${(tkData.read/1000).toFixed(1)}K</div><div class="metric-name">${t.tokenRead}</div></div>
    </div>
    <div class="token-total"><span>${t.tokenTotal}</span><span class="token-total-val">${(tkData.total/1000).toFixed(1)}K</span></div>
    <div class="token-ratio">
      <div style="width:${(tkData.input/tkData.total)*100}%;background:#2196f3"></div>
      <div style="width:${(tkData.output/tkData.total)*100}%;background:#4caf50"></div>
      <div style="width:${(tkData.cache/tkData.total)*100}%;background:#ff9800"></div>
      <div style="width:${(tkData.read/tkData.total)*100}%;background:#9c27b0"></div>
    </div>
    <div class="token-legend">
      <span><span class="legend-dot" style="background:#2196f3"></span>${t.tokenInput} ${Math.round(tkData.input/tkData.total*100)}%</span>
      <span><span class="legend-dot" style="background:#4caf50"></span>${t.tokenOutput} ${Math.round(tkData.output/tkData.total*100)}%</span>
      <span><span class="legend-dot" style="background:#ff9800"></span>${t.tokenCache} ${Math.round(tkData.cache/tkData.total*100)}%</span>
      <span><span class="legend-dot" style="background:#9c27b0"></span>${t.tokenRead} ${Math.round(tkData.read/tkData.total*100)}%</span>
    </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#ccc;background:#1e1e1e;padding:12px;max-width:900px}
h3{font-size:14px;margin-bottom:8px;color:#e1e1e1}
h4{font-size:12px;color:#999}
.search{display:flex;align-items:center;gap:8px;padding:6px 10px;background:#2d2d2d;border:1px solid #3c3c3c;border-radius:4px;margin-bottom:8px;color:#888;font-size:12px}
.tabs{display:flex;gap:4px;border-bottom:1px solid #3c3c3c;margin-bottom:10px;padding-bottom:4px}
.tab{padding:4px 12px;background:none;border:none;color:#888;font-size:12px;cursor:pointer;border-bottom:2px solid transparent;border-radius:4px 4px 0 0}
.tab.active{color:#e1e1e1;border-bottom-color:#2196f3}
.tab:hover{color:#e1e1e1;background:#2a2a2a}
.stats{display:flex;gap:12px;padding:8px 12px;background:rgba(255,255,255,.03);border-radius:6px;margin-bottom:10px;align-items:center;flex-wrap:wrap}
.stat{display:flex;align-items:center;gap:4px;font-size:12px}
.stat-val{font-weight:700}
.stat-lbl{color:#888}
.progress{flex:1;min-width:100px;height:6px;background:#333;border-radius:3px;overflow:hidden}
.progress-fill{height:100%;background:#4caf50;border-radius:3px;width:50%}
.agent-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}
.agent-card{padding:10px;background:#2d2d2d;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.agent-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.agent-name{font-weight:600;font-size:13px;color:#e1e1e1}
.agent-model{font-size:10px;color:#888;padding:1px 6px;background:rgba(255,255,255,.06);border-radius:4px}
.agent-desc{color:#888;margin-bottom:4px;font-size:11px}
.agent-task{font-size:11px;color:#888}
.agent-current{font-size:11px;color:#888;margin-top:2px}
.task-table{width:100%;border-collapse:collapse;font-size:12px}
.task-table th{text-align:left;padding:4px 8px;border-bottom:1px solid #3c3c3c;color:#888;font-weight:500}
.task-table td{padding:4px 8px;border-bottom:1px solid rgba(255,255,255,.03)}
.task-table tr:hover td{background:rgba(255,255,255,.04)}
.badge{padding:1px 8px;border-radius:10px;font-size:11px}
.view-toggle{display:flex;gap:2px;margin-bottom:8px}
.view-toggle button{padding:4px 12px;border:1px solid #3c3c3c;background:none;color:#888;font-size:11px;cursor:pointer}
.view-toggle button:first-child{border-radius:4px 0 0 4px}
.view-toggle button:last-child{border-radius:0 4px 4px 0}
.toggle-active{background:#0078d4!important;color:#fff!important;border-color:transparent!important}
.footer{padding:8px 0;margin-top:8px;border-top:1px solid #3c3c3c;font-size:11px;color:#666}
.msg-filters{display:flex;gap:4px;margin-bottom:8px}
.msg-filters button{padding:2px 10px;border:1px solid #3c3c3c;background:none;color:#888;border-radius:12px;font-size:11px;cursor:pointer}
.msg-list{display:flex;flex-direction:column;gap:4px}
.msg{padding:8px 12px;background:rgba(255,255,255,.03);border-radius:6px}
.msg.system{border-left:2px solid #7c4dff}
.msg.permission{border-left:2px solid #e91e63}
.msg-header{display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:4px}
.msg-from{font-weight:600;color:#e1e1e1}
.msg-content{word-break:break-word}
.dag-grid{display:flex;align-items:flex-start;gap:0;padding:8px 0;overflow-x:auto}
.dag-col{display:flex;flex-direction:column;gap:8px;min-width:160px}
.dag-arrows-col{min-width:50px;align-items:center;justify-content:flex-start;padding-top:0}
.dag-arrow-row{height:46px;display:flex;align-items:center;margin-bottom:8px}
.dag-arrow-svg{display:block;overflow:visible}
.dag-layer{display:flex;flex-direction:column;gap:8px;min-width:160px}
.layer-title{font-size:11px;color:#666;text-align:center;margin-bottom:4px}
.dag-node{padding:8px;background:#2d2d2d;border-radius:4px;border:1px solid #3c3c3c;font-size:11px;display:flex;flex-direction:column;gap:2px}
.node-id{font-size:10px;color:#666;font-family:monospace}
.node-title{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dag-arrows{display:flex;flex-direction:column;justify-content:center;color:#555;font-size:16px;gap:20px;padding-top:20px}
.activity-list{display:flex;flex-direction:column;gap:2px}
.activity-row{display:flex;align-items:center;gap:8px;padding:4px 8px;font-size:11px;border-radius:4px}
.activity-row:hover{background:rgba(255,255,255,.04)}
.act-time{color:#666;min-width:36px;font-family:monospace}
.act-text{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.timeline{position:relative;padding-left:24px}
.timeline::before{content:'';position:absolute;left:10px;top:0;bottom:0;width:2px;background:#3c3c3c}
.tl-date{position:relative;padding:4px 8px;margin:8px 0;font-size:11px;font-weight:700;color:#888;background:#1e1e1e;display:inline-block}
.tl-item{position:relative;display:flex;gap:8px;padding:4px 0;margin-bottom:4px}
.tl-dot{position:absolute;left:-18px;top:8px;width:10px;height:10px;border-radius:50%;background:#2196f3;border:2px solid #1e1e1e;z-index:1}
.tl-content{flex:1;padding:4px 8px;background:rgba(255,255,255,.03);border-radius:4px}
.tl-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px}
.tl-time{font-size:11px;color:#666}
.tl-text{font-size:12px}
.metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
.metric-card{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px;background:rgba(255,255,255,.03);border-radius:6px;border:1px solid #3c3c3c;text-align:center;position:relative}
.donut{display:block}
.donut-label{font-size:14px;font-weight:700;margin-top:-40px;margin-bottom:12px}
.metric-icon{font-size:20px}
.metric-val{font-size:20px;font-weight:700}
.metric-name{font-size:10px;color:#888}
.metric-sub{font-size:10px;color:#666}
.velocity{display:flex;align-items:flex-end;gap:4px;height:80px;padding:8px;background:rgba(255,255,255,.03);border-radius:6px;border:1px solid #3c3c3c}
.vel-wrap{flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end}
.vel-bar{width:100%;max-width:20px;background:#2196f3;border-radius:4px 4px 0 0;min-height:2px}
.vel-label{font-size:9px;color:#666;margin-top:4px}
.heatmap{display:flex;flex-direction:column;gap:4px}
.hm-row{display:flex;align-items:center;gap:8px;font-size:11px}
.hm-file{min-width:120px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace}
.hm-bar-wrap{flex:1;height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden}
.hm-bar{height:100%;background:#ff9800;border-radius:4px}
.hm-count{min-width:20px;text-align:right;color:#666}
.token-total{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,.03);border-radius:6px;border:1px solid #3c3c3c;margin-top:8px;font-size:12px;color:#888}
.token-total-val{font-size:18px;font-weight:700;color:#e1e1e1}
.token-ratio{display:flex;height:10px;border-radius:5px;overflow:hidden;margin-top:8px}
.token-ratio>div{height:100%;min-width:3px}
.token-legend{display:flex;gap:16px;margin-top:8px;font-size:11px;color:#888;flex-wrap:wrap}
.legend-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:middle}
</style></head><body>
<div class="search">🔍 ${t.searchPlaceholder}</div>
<div class="tabs">${tabs.map(tb => `<div class="tab ${tb===tab?'active':''}">${tabLabels[tb]}</div>`).join('')}</div>
<div class="stats">
  <div class="stat"><span class="stat-val">📊 8</span><span class="stat-lbl">${t.statsTotal}</span></div>
  <div class="stat"><span class="stat-val">⚡ 2</span><span class="stat-lbl">${t.statsActive}</span></div>
  <div class="stat"><span class="stat-val">💬 14</span><span class="stat-lbl">${t.statsMsg}</span></div>
  <div class="stat"><span class="stat-val">⏱ 25:30</span><span class="stat-lbl">${t.statsElapsed}</span></div>
  <div class="progress"><div class="progress-fill"></div></div>
  <span class="stat-val">50%</span>
</div>
${content}
</body></html>`;
}

async function main() {
  const browser = await chromium.launch();
  const tabsToCapture = ['overview','tasks','messages','deps','activity','timeline','metrics','tokens'];
  const languages = ['ko','en','ja','zh'];

  for (const lang of languages) {
    for (const tab of tabsToCapture) {
      const html = generateHtml(tab, lang);
      const page = await browser.newPage({ viewport: { width: 900, height: 620 } });
      await page.setContent(html, { waitUntil: 'networkidle' });
      const filename = `${tab}-${lang}.png`;
      await page.screenshot({ path: join(OUT, filename), type: 'png' });
      await page.close();
      console.log(`✅ ${filename}`);
    }
  }

  await browser.close();
  console.log(`\n🎉 ${tabsToCapture.length * languages.length} screenshots generated in images/screenshots/`);
}

main().catch(console.error);
