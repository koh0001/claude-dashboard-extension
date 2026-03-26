/**
 * 대시보드 클라이언트 JS — WebView 내부 실행
 * 주의: 템플릿 리터럴 안에서 실행되므로 var 사용, innerHTML 금지
 */

export function getDashboardJs(): string {
  return `(function() {
  // vscode API
  var vscode = acquireVsCodeApi();

  // === 1. State Management ===
  var state = {
    currentTab: 'overview',
    teams: {},
    currentTeam: null,
    translations: {},
    locale: 'ko',
    activities: [],
    messageFilter: 'all',
    taskView: 'table',
    searchQuery: '',
    todoItems: [],
    tokenUsage: { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0 }
  };

  function t(key, params) {
    var text = state.translations[key] || key;
    if (params) {
      Object.keys(params).forEach(function(k) {
        // replaceAll 대신 split+join (ES2015 호환, ReDoS 방지)
        text = text.split('{' + k + '}').join(String(params[k]));
      });
    }
    return text;
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatTime(ts) {
    var d = new Date(ts);
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    var s = String(d.getSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  function formatDuration(ms) {
    if (ms < 0) ms = 0;
    var totalSec = Math.floor(ms / 1000);
    var hours = Math.floor(totalSec / 3600);
    var minutes = Math.floor((totalSec % 3600) / 60);
    var seconds = totalSec % 60;
    var pad = function(n) { return String(n).padStart(2, '0'); };
    if (hours > 0) {
      return hours + ':' + pad(minutes) + ':' + pad(seconds);
    }
    return pad(minutes) + ':' + pad(seconds);
  }

  // === 2. Tab Navigation ===
  function switchTab(tab) {
    state.currentTab = tab;
    var tabs = document.querySelectorAll('.cfm-tab');
    var panels = document.querySelectorAll('.cfm-panel');
    tabs.forEach(function(t) {
      var isActive = t.getAttribute('data-tab') === tab;
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    panels.forEach(function(p) {
      var isActive = p.id === 'panel-' + tab;
      p.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
    renderCurrentTab();
    vscode.postMessage({ type: 'changeTab', tab: tab });
  }

  // === 3. Renderers ===
  function getSnap() {
    if (!state.currentTeam || !state.teams[state.currentTeam]) return null;
    return state.teams[state.currentTeam];
  }

  function renderAll() {
    renderTabLabels();
    renderStatsBar();
    renderCurrentTab();
  }

  function renderTabLabels() {
    var el;
    el = document.getElementById('tab-overview');
    if (el) el.textContent = t('view.overview');
    el = document.getElementById('tab-tasks');
    if (el) el.textContent = t('view.tasks');
    el = document.getElementById('tab-messages');
    if (el) el.textContent = t('view.messages');
    el = document.getElementById('tab-deps');
    if (el) el.textContent = t('view.deps');
    el = document.getElementById('tab-activity');
    if (el) el.textContent = t('activity.title');
    el = document.getElementById('tab-timeline');
    if (el) el.textContent = t('timeline.title');
    el = document.getElementById('tab-metrics');
    if (el) el.textContent = t('metrics.title');
    var skip = document.getElementById('skip-link');
    if (skip) skip.textContent = t('a11y.skipToContent');
    var searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.setAttribute('placeholder', t('search.globalPlaceholder'));
  }

  function renderStatsBar() {
    var snap = getSnap();
    var bar = document.getElementById('stats-bar');
    if (!bar) return;
    bar.textContent = '';
    if (!snap) return;

    var items = [
      { icon: '\\u{1F4CA}', value: snap.stats.totalTasks, label: t('stats.tasks') },
      { icon: '\\u26A1', value: snap.stats.activeTasks, label: t('stats.active') },
      { icon: '\\u{1F4AC}', value: snap.stats.totalMessages, label: t('stats.messages') },
      { icon: '\\u23F1', value: formatTime(Date.now()), label: t('stats.elapsed') }
    ];

    items.forEach(function(item) {
      var div = document.createElement('div');
      div.className = 'cfm-stat';
      var val = document.createElement('span');
      val.className = 'cfm-stat-value';
      val.textContent = item.icon + ' ' + item.value;
      var lbl = document.createElement('span');
      lbl.className = 'cfm-stat-label';
      lbl.textContent = item.label;
      div.appendChild(val);
      div.appendChild(lbl);
      bar.appendChild(div);
    });

    // 진행률 바
    var rate = snap.stats.totalTasks > 0
      ? Math.round((snap.stats.completedTasks / snap.stats.totalTasks) * 100)
      : 0;
    var pb = document.createElement('div');
    pb.className = 'cfm-progress-bar';
    pb.setAttribute('role', 'progressbar');
    pb.setAttribute('aria-valuenow', String(rate));
    pb.setAttribute('aria-valuemin', '0');
    pb.setAttribute('aria-valuemax', '100');
    pb.setAttribute('aria-label', t('a11y.progressBar', { percent: rate }));
    var fill = document.createElement('div');
    fill.className = 'cfm-progress-fill';
    fill.style.width = rate + '%';
    pb.appendChild(fill);
    bar.appendChild(pb);

    var pct = document.createElement('span');
    pct.className = 'cfm-stat-value';
    pct.textContent = rate + '%';
    bar.appendChild(pct);
  }

  function renderCurrentTab() {
    var snap = getSnap();
    switch (state.currentTab) {
      case 'overview': renderOverview(snap); break;
      case 'tasks': renderTasks(snap); break;
      case 'messages': renderMessages(snap); break;
      case 'deps': renderDeps(snap); break;
      case 'activity': renderActivity(); break;
      case 'timeline': renderTimeline(snap); break;
      case 'metrics': renderMetrics(snap); break;
    }
  }

  // --- Overview ---
  function renderOverview(snap) {
    var panel = document.getElementById('panel-overview');
    if (!panel) return;
    panel.textContent = '';
    if (!snap) { renderEmpty(panel, 'empty.noTeams', 'empty.noTeamsHint'); return; }

    var title = document.createElement('h3');
    title.textContent = t('agent.sectionTitle', { count: snap.agents.length });
    title.style.marginBottom = 'var(--cfm-space-sm)';
    panel.appendChild(title);

    var grid = document.createElement('div');
    grid.className = 'cfm-agent-grid';

    snap.agents.forEach(function(agent) {
      var card = document.createElement('div');
      card.className = 'cfm-agent-card';
      card.setAttribute('data-status', agent.status);
      card.style.setProperty('--agent-color', agent.color);

      var header = document.createElement('div');
      header.className = 'cfm-agent-header';
      var name = document.createElement('span');
      name.className = 'cfm-agent-name';
      name.textContent = (agent.isLead ? '\\u{1F451} ' : '') + escapeHtml(agent.name);
      var model = document.createElement('span');
      model.className = 'cfm-agent-model';
      model.textContent = agent.model;
      header.appendChild(name);
      header.appendChild(model);
      card.appendChild(header);

      var desc = document.createElement('div');
      desc.className = 'cfm-agent-desc';
      desc.textContent = escapeHtml(agent.description);
      card.appendChild(desc);

      var progress = document.createElement('div');
      progress.className = 'cfm-agent-task';
      progress.textContent = t('agent.taskProgress', {
        completed: agent.completedTaskCount,
        total: agent.totalTaskCount
      });
      card.appendChild(progress);

      if (agent.currentTask) {
        var cur = document.createElement('div');
        cur.className = 'cfm-agent-task';
        cur.textContent = '\\u{25B6} ' + escapeHtml(agent.currentTask);
        card.appendChild(cur);
      }

      grid.appendChild(card);
    });

    panel.appendChild(grid);
  }

  // --- Tasks ---
  function renderTasks(snap) {
    var panel = document.getElementById('panel-tasks');
    if (!panel) return;
    panel.textContent = '';
    if (!snap || snap.tasks.length === 0) { renderEmpty(panel, 'empty.noTasks'); return; }

    // 검색 필터 적용
    var filteredSnap = snap;
    if (state.searchQuery) {
      filteredSnap = Object.assign({}, snap, {
        tasks: snap.tasks.filter(function(task) {
          return matchesSearch(task.title) || matchesSearch(task.assignee) || matchesSearch('#' + task.id);
        })
      });
      if (filteredSnap.tasks.length === 0) { renderEmpty(panel, 'search.noResults'); return; }
    }

    // 뷰 토글 (Table / Kanban)
    var toggle = document.createElement('div');
    toggle.className = 'cfm-view-toggle';
    ['table', 'kanban'].forEach(function(v) {
      var btn = document.createElement('button');
      btn.className = 'cfm-view-toggle-btn';
      btn.setAttribute('aria-pressed', state.taskView === v ? 'true' : 'false');
      btn.textContent = v === 'table' ? t('task.viewTable') : t('task.viewKanban');
      btn.addEventListener('click', function() {
        state.taskView = v;
        renderTasks(snap);
      });
      toggle.appendChild(btn);
    });
    panel.appendChild(toggle);

    if (state.taskView === 'kanban') {
      renderTaskKanban(panel, filteredSnap.tasks);
    } else {
      renderTaskTable(panel, filteredSnap.tasks);
    }

    // 푸터 요약
    var footer = document.createElement('div');
    footer.className = 'cfm-footer';
    var counts = { pending: 0, in_progress: 0, completed: 0 };
    filteredSnap.tasks.forEach(function(task) { counts[task.status] = (counts[task.status] || 0) + 1; });
    footer.textContent = filteredSnap.tasks.length + ' tasks — '
      + counts.pending + ' pending  '
      + counts.in_progress + ' in progress  '
      + counts.completed + ' completed';
    panel.appendChild(footer);
  }

  function renderTaskTable(panel, tasks) {
    var table = document.createElement('table');
    table.className = 'cfm-task-table';
    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    [t('task.headerId'), t('task.headerTask'), t('task.headerAssignee'), t('task.headerStatus'), t('task.headerDuration'), t('task.headerTokens')].forEach(function(h) {
      var th = document.createElement('th');
      th.textContent = h;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    // 토큰 추정용: 전체 활동 시간 범위와 총 토큰
    var totalTokens = state.tokenUsage.totalTokens;
    var allActivities = state.activities;

    var tbody = document.createElement('tbody');
    tasks.forEach(function(task) {
      var tr = document.createElement('tr');
      var tdId = document.createElement('td');
      tdId.textContent = '#' + task.id;
      var tdTitle = document.createElement('td');
      tdTitle.textContent = escapeHtml(task.title);
      var tdOwner = document.createElement('td');
      tdOwner.textContent = escapeHtml(task.assignee || '-');
      var tdStatus = document.createElement('td');
      var badge = document.createElement('span');
      badge.className = 'cfm-status-badge';
      badge.setAttribute('data-status', task.status);
      badge.textContent = t('status.' + (task.status === 'in_progress' ? 'inProgress' : task.status));
      tdStatus.appendChild(badge);

      // 소요시간 (상태 변경 기반)
      var tdDuration = document.createElement('td');
      if (task.createdAt) {
        var endTime = task.completedAt || Date.now();
        var durationMs = endTime - task.createdAt;
        tdDuration.textContent = formatDuration(durationMs);
      } else {
        tdDuration.textContent = '-';
      }

      // 추정 토큰 (시간 구간 기반)
      var tdTokens = document.createElement('td');
      if (task.createdAt && totalTokens > 0) {
        var taskStart = task.createdAt;
        var taskEnd = task.completedAt || Date.now();
        var taskActivities = allActivities.filter(function(a) {
          return a.timestamp >= taskStart && a.timestamp <= taskEnd;
        });
        var totalActivitiesInRange = allActivities.length || 1;
        var estimatedTokens = Math.round(totalTokens * (taskActivities.length / totalActivitiesInRange));
        var tokenSpan = document.createElement('span');
        tokenSpan.className = 'cfm-estimated';
        tokenSpan.title = t('task.estimated');
        if (estimatedTokens >= 1000) {
          tokenSpan.textContent = '~' + (estimatedTokens / 1000).toFixed(1) + 'K';
        } else {
          tokenSpan.textContent = '~' + estimatedTokens;
        }
        tdTokens.appendChild(tokenSpan);
      } else {
        tdTokens.textContent = '-';
      }

      tr.appendChild(tdId);
      tr.appendChild(tdTitle);
      tr.appendChild(tdOwner);
      tr.appendChild(tdStatus);
      tr.appendChild(tdDuration);
      tr.appendChild(tdTokens);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    panel.appendChild(table);
  }

  function renderTaskKanban(panel, tasks) {
    var columns = [
      { status: 'pending', label: t('status.pending') },
      { status: 'in_progress', label: t('status.inProgress') },
      { status: 'completed', label: t('status.completed') }
    ];

    var board = document.createElement('div');
    board.className = 'cfm-kanban';

    columns.forEach(function(col) {
      var colDiv = document.createElement('div');
      colDiv.className = 'cfm-kanban-column';
      colDiv.setAttribute('data-status', col.status);

      // 컬럼 헤더
      var header = document.createElement('div');
      header.className = 'cfm-kanban-header';
      var headerLabel = document.createElement('span');
      headerLabel.textContent = col.label;
      header.appendChild(headerLabel);

      var colTasks = tasks.filter(function(task) { return task.status === col.status; });
      var countBadge = document.createElement('span');
      countBadge.className = 'cfm-kanban-count';
      countBadge.textContent = String(colTasks.length);
      header.appendChild(countBadge);
      colDiv.appendChild(header);

      // 카드들
      colTasks.forEach(function(task) {
        var card = document.createElement('div');
        card.className = 'cfm-kanban-card';

        var cardId = document.createElement('div');
        cardId.className = 'cfm-kanban-card-id';
        cardId.textContent = '#' + task.id;
        card.appendChild(cardId);

        var cardTitle = document.createElement('div');
        cardTitle.className = 'cfm-kanban-card-title';
        cardTitle.textContent = escapeHtml(task.title);
        card.appendChild(cardTitle);

        var cardAssignee = document.createElement('div');
        cardAssignee.className = 'cfm-kanban-card-assignee';
        cardAssignee.textContent = escapeHtml(task.assignee || '-');
        card.appendChild(cardAssignee);

        // blockedBy 표시
        if (task.blockedBy && task.blockedBy.length > 0) {
          var blocker = document.createElement('div');
          blocker.className = 'cfm-kanban-card-blocker';
          blocker.textContent = 'blocked by: #' + task.blockedBy.join(', #');
          card.appendChild(blocker);
        }

        colDiv.appendChild(card);
      });

      board.appendChild(colDiv);
    });

    panel.appendChild(board);
  }

  // --- Messages ---
  function renderMessages(snap) {
    var panel = document.getElementById('panel-messages');
    if (!panel) return;
    panel.textContent = '';
    if (!snap || snap.messages.length === 0) { renderEmpty(panel, 'empty.noMessages', 'empty.noMessagesHint'); return; }

    // 필터 버튼
    var filters = document.createElement('div');
    filters.className = 'cfm-message-filters';
    ['all', 'text', 'system'].forEach(function(f) {
      var btn = document.createElement('button');
      btn.className = 'cfm-filter-btn';
      btn.setAttribute('aria-pressed', state.messageFilter === f ? 'true' : 'false');
      btn.textContent = f === 'all' ? t('message.filterAll')
        : f === 'text' ? t('message.filterConversation')
        : t('message.filterSystem');
      btn.addEventListener('click', function() {
        state.messageFilter = f;
        renderMessages(snap);
      });
      filters.appendChild(btn);
    });
    panel.appendChild(filters);

    var list = document.createElement('div');
    list.className = 'cfm-message-list';

    var msgs = snap.messages;
    if (state.messageFilter !== 'all') {
      msgs = msgs.filter(function(m) { return m.type === state.messageFilter; });
    }

    msgs.forEach(function(msg) {
      var div = document.createElement('div');
      div.className = 'cfm-message';
      div.setAttribute('data-type', msg.type);

      var header = document.createElement('div');
      header.className = 'cfm-message-header';
      var from = document.createElement('span');
      from.className = 'cfm-message-from';
      from.textContent = escapeHtml(msg.from) + ' \\u2192 ' + escapeHtml(msg.to);
      var time = document.createElement('span');
      time.textContent = formatTime(msg.timestamp);
      header.appendChild(from);
      header.appendChild(time);
      div.appendChild(header);

      var content = document.createElement('div');
      content.className = 'cfm-message-content';
      content.textContent = escapeHtml(msg.content.slice(0, 500));
      div.appendChild(content);

      list.appendChild(div);
    });

    panel.appendChild(list);
  }

  // --- Deps (SVG 기반 DAG 그래프) ---
  function renderDeps(snap) {
    var panel = document.getElementById('panel-deps');
    if (!panel) return;
    panel.textContent = '';
    if (!snap || !snap.depsLayers || snap.depsLayers.length === 0) {
      renderEmpty(panel, 'empty.noDeps', 'empty.noDepsHint');
      return;
    }

    var title = document.createElement('h3');
    title.textContent = t('deps.sectionTitle');
    title.style.marginBottom = 'var(--cfm-space-sm)';
    panel.appendChild(title);

    var wrapper = document.createElement('div');
    wrapper.className = 'cfm-dag-wrapper';

    var graph = document.createElement('div');
    graph.className = 'cfm-deps-graph';

    // 노드 DOM 참조 맵
    var nodeElements = {};

    snap.depsLayers.forEach(function(layer, i) {
      var col = document.createElement('div');
      col.className = 'cfm-deps-layer';
      var layerTitle = document.createElement('div');
      layerTitle.className = 'cfm-deps-layer-title';
      layerTitle.textContent = 'Layer ' + i;
      col.appendChild(layerTitle);

      layer.forEach(function(taskId) {
        var task = snap.tasks.find(function(t) { return t.id === taskId; });
        var node = document.createElement('div');
        node.className = 'cfm-deps-node';
        node.setAttribute('data-status', task ? task.status : 'pending');
        node.setAttribute('data-task-id', taskId);

        var idSpan = document.createElement('span');
        idSpan.className = 'cfm-deps-node-id';
        idSpan.textContent = '#' + taskId;
        node.appendChild(idSpan);

        if (task) {
          var titleSpan = document.createElement('span');
          titleSpan.className = 'cfm-deps-node-title';
          titleSpan.textContent = escapeHtml(task.title.slice(0, 25));
          node.appendChild(titleSpan);
        }

        col.appendChild(node);
        nodeElements[taskId] = node;
      });

      graph.appendChild(col);
    });

    wrapper.appendChild(graph);

    // SVG 컨테이너 (크기는 레이아웃 후 설정)
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'cfm-dag-svg');
    wrapper.appendChild(svg);
    panel.appendChild(wrapper);

    // 레이아웃 완료 후 실제 DOM 위치 기반 연결선 그리기
    requestAnimationFrame(function() {
      var wrapperRect = wrapper.getBoundingClientRect();
      svg.setAttribute('width', String(wrapper.scrollWidth));
      svg.setAttribute('height', String(wrapper.scrollHeight));

      snap.tasks.forEach(function(task) {
        if (!task.blocks || task.blocks.length === 0) return;
        var fromEl = nodeElements[task.id];
        if (!fromEl) return;

        task.blocks.forEach(function(targetId) {
          var toEl = nodeElements[targetId];
          if (!toEl) return;

          var fromRect = fromEl.getBoundingClientRect();
          var toRect = toEl.getBoundingClientRect();

          // wrapper 기준 상대 좌표
          var x1 = fromRect.right - wrapperRect.left;
          var y1 = fromRect.top + fromRect.height / 2 - wrapperRect.top;
          var x2 = toRect.left - wrapperRect.left;
          var y2 = toRect.top + toRect.height / 2 - wrapperRect.top;

          // 베지에 커브
          var midX = (x1 + x2) / 2;
          var d = 'M ' + x1 + ' ' + y1
            + ' C ' + midX + ' ' + y1 + ', ' + midX + ' ' + y2
            + ', ' + x2 + ' ' + y2;

          var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          line.setAttribute('d', d);
          line.setAttribute('class', 'cfm-dag-edge');
          svg.appendChild(line);

          // 화살표 (도착 노드 왼쪽에 위치)
          var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          arrow.setAttribute('points',
            (x2 - 8) + ',' + (y2 - 4) + ' ' +
            x2 + ',' + y2 + ' ' +
            (x2 - 8) + ',' + (y2 + 4));
          arrow.setAttribute('class', 'cfm-dag-arrow');
          svg.appendChild(arrow);
        });
      });
    });
  }

  // --- Activity ---
  function renderActivity() {
    var panel = document.getElementById('panel-activity');
    if (!panel) return;
    panel.textContent = '';
    if (state.activities.length === 0) {
      renderEmpty(panel, 'activity.noActivity', 'activity.noActivityHint');
      return;
    }

    var list = document.createElement('div');
    list.className = 'cfm-activity-list';

    var icons = {
      file_edit: '\\u{1F4DD}',
      command: '\\u26A1',
      task_change: '\\u2705',
      message: '\\u{1F4AC}',
      error: '\\u274C'
    };

    var filteredActivities = state.activities;
    if (state.searchQuery) {
      filteredActivities = filteredActivities.filter(function(a) { return matchesSearch(a.summary); });
    }
    filteredActivities.slice(-100).reverse().forEach(function(item) {
      var div = document.createElement('div');
      div.className = 'cfm-activity-item';

      var time = document.createElement('span');
      time.className = 'cfm-activity-time';
      time.textContent = formatTime(item.timestamp);

      var icon = document.createElement('span');
      icon.className = 'cfm-activity-icon';
      icon.textContent = icons[item.type] || '\\u2022';

      var text = document.createElement('span');
      text.className = 'cfm-activity-text';
      text.textContent = escapeHtml(item.summary);

      div.appendChild(time);
      div.appendChild(icon);
      div.appendChild(text);
      list.appendChild(div);
    });

    panel.appendChild(list);
  }

  // --- Timeline ---
  function renderTimeline(snap) {
    var panel = document.getElementById('panel-timeline');
    if (!panel) return;
    panel.textContent = '';

    // 타임라인 이벤트 수집 (활동 + 팀 이벤트)
    var events = [];
    state.activities.forEach(function(item) {
      events.push({ timestamp: item.timestamp, type: item.type, summary: item.summary, detail: item.detail || '' });
    });
    if (snap) {
      snap.tasks.forEach(function(task) {
        if (task.status === 'completed') {
          events.push({ timestamp: Date.now() - 60000, type: 'task_change', summary: '#' + task.id + ' ' + escapeHtml(task.title), detail: 'completed' });
        }
      });
    }

    // 검색 필터
    if (state.searchQuery) {
      var q = state.searchQuery.toLowerCase();
      events = events.filter(function(e) { return e.summary.toLowerCase().indexOf(q) !== -1; });
    }

    events.sort(function(a, b) { return b.timestamp - a.timestamp; });
    events = events.slice(0, 100);

    if (events.length === 0) {
      renderEmpty(panel, 'timeline.noEvents', 'timeline.noEventsHint');
      return;
    }

    var icons = {
      file_edit: '\\u{1F4DD}',
      command: '\\u26A1',
      task_change: '\\u2705',
      message: '\\u{1F4AC}',
      error: '\\u274C'
    };

    var title = document.createElement('h3');
    title.textContent = t('timeline.title');
    title.style.marginBottom = 'var(--cfm-space-sm)';
    panel.appendChild(title);

    var timeline = document.createElement('div');
    timeline.className = 'cfm-timeline';

    var lastDate = '';
    events.forEach(function(ev) {
      var d = new Date(ev.timestamp);
      var dateStr = d.toLocaleDateString();
      var today = new Date().toLocaleDateString();

      // 날짜 구분선
      if (dateStr !== lastDate) {
        lastDate = dateStr;
        var dateDiv = document.createElement('div');
        dateDiv.className = 'cfm-timeline-date';
        dateDiv.textContent = dateStr === today ? t('timeline.today') : dateStr;
        timeline.appendChild(dateDiv);
      }

      var item = document.createElement('div');
      item.className = 'cfm-timeline-item';
      item.setAttribute('data-type', ev.type);

      var dot = document.createElement('div');
      dot.className = 'cfm-timeline-dot';

      var content = document.createElement('div');
      content.className = 'cfm-timeline-content';

      var header = document.createElement('div');
      header.className = 'cfm-timeline-header';
      var icon = document.createElement('span');
      icon.textContent = icons[ev.type] || '\\u2022';
      var time = document.createElement('span');
      time.className = 'cfm-timeline-time';
      time.textContent = formatTime(ev.timestamp);
      header.appendChild(icon);
      header.appendChild(time);
      content.appendChild(header);

      var text = document.createElement('div');
      text.className = 'cfm-timeline-text';
      text.textContent = escapeHtml(ev.summary);
      content.appendChild(text);

      if (ev.detail) {
        var detail = document.createElement('div');
        detail.className = 'cfm-timeline-detail';
        detail.textContent = escapeHtml(ev.detail);
        content.appendChild(detail);
      }

      item.appendChild(dot);
      item.appendChild(content);
      timeline.appendChild(item);
    });

    panel.appendChild(timeline);
  }

  // --- Metrics ---
  function renderMetrics(snap) {
    var panel = document.getElementById('panel-metrics');
    if (!panel) return;
    panel.textContent = '';

    if (!snap && state.activities.length === 0) {
      renderEmpty(panel, 'metrics.noData', 'metrics.noDataHint');
      return;
    }

    var title = document.createElement('h3');
    title.textContent = t('metrics.title');
    title.style.marginBottom = 'var(--cfm-space-md)';
    panel.appendChild(title);

    // 메트릭 카드 그리드
    var grid = document.createElement('div');
    grid.className = 'cfm-metrics-grid';

    // 1. 완료율 도넛
    var completionRate = 0;
    var totalTasks = 0;
    var completedTasks = 0;
    if (snap) {
      totalTasks = snap.stats.totalTasks;
      completedTasks = snap.stats.completedTasks;
      completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }
    grid.appendChild(createMetricDonut(t('metrics.completionRate'), completionRate, completedTasks + '/' + totalTasks, '#4caf50'));

    // 2. 에이전트 활용도
    var agentUtil = 0;
    if (snap && snap.agents.length > 0) {
      var activeCount = snap.agents.filter(function(a) { return a.status === 'active'; }).length;
      agentUtil = Math.round((activeCount / snap.agents.length) * 100);
    }
    grid.appendChild(createMetricDonut(t('metrics.agentUtilization'), agentUtil, (snap ? snap.agents.length : 0) + ' agents', '#2196f3'));

    // 3. 변경 파일 수
    var fileEdits = {};
    state.activities.forEach(function(a) {
      if (a.type === 'file_edit' && a.detail) fileEdits[a.detail] = (fileEdits[a.detail] || 0) + 1;
    });
    var fileCount = Object.keys(fileEdits).length;
    grid.appendChild(createMetricCard(t('metrics.filesChanged'), String(fileCount), '\\u{1F4C1}'));

    // 4. 세션 수
    grid.appendChild(createMetricCard(t('metrics.totalSessions'), '1', '\\u{1F4CA}'));

    // 5. 메시지 수
    var msgCount = snap ? snap.stats.totalMessages : 0;
    grid.appendChild(createMetricCard(t('stats.messages'), String(msgCount), '\\u{1F4AC}'));

    // 6. 경과 시간
    var elapsed = snap ? formatDuration(snap.stats.elapsedMs) : '-';
    grid.appendChild(createMetricCard(t('metrics.avgDuration'), elapsed, '\\u23F1'));

    panel.appendChild(grid);

    // 태스크 처리 속도 바 차트 (활동 없어도 빈 차트 표시)
    {
      var velocityTitle = document.createElement('h4');
      velocityTitle.textContent = t('metrics.taskVelocity');
      velocityTitle.style.margin = 'var(--cfm-space-lg) 0 var(--cfm-space-sm)';
      panel.appendChild(velocityTitle);

      var chart = document.createElement('div');
      chart.className = 'cfm-velocity-chart';

      // 시간대별 활동 수 (최근 12시간, 1시간 단위)
      var now = Date.now();
      var hourBuckets = [];
      for (var h = 11; h >= 0; h--) {
        var start = now - (h + 1) * 3600000;
        var end = now - h * 3600000;
        var count = state.activities.filter(function(a) { return a.timestamp >= start && a.timestamp < end; }).length;
        hourBuckets.push({ hour: new Date(end).getHours(), count: count });
      }
      var maxCount = Math.max.apply(null, hourBuckets.map(function(b) { return b.count; })) || 1;

      hourBuckets.forEach(function(bucket) {
        var bar = document.createElement('div');
        bar.className = 'cfm-velocity-bar-wrap';
        var fill = document.createElement('div');
        fill.className = 'cfm-velocity-bar';
        fill.style.height = Math.round((bucket.count / maxCount) * 100) + '%';
        var label = document.createElement('div');
        label.className = 'cfm-velocity-label';
        label.textContent = String(bucket.hour).padStart(2, '0');
        bar.appendChild(fill);
        bar.appendChild(label);
        chart.appendChild(bar);
      });

      panel.appendChild(chart);
    }

    // 파일 히트맵 (상위 10개, 항상 표시)
    var fileEntries = Object.keys(fileEdits).map(function(f) { return { file: f, count: fileEdits[f] }; });
    fileEntries.sort(function(a, b) { return b.count - a.count; });
    var hmTitle = document.createElement('h4');
    hmTitle.textContent = t('metrics.filesChanged');
    hmTitle.style.margin = 'var(--cfm-space-lg) 0 var(--cfm-space-sm)';
    panel.appendChild(hmTitle);

    if (fileEntries.length > 0) {
      var heatmap = document.createElement('div');
      heatmap.className = 'cfm-heatmap';
      var hmMax = fileEntries[0].count;
      fileEntries.slice(0, 10).forEach(function(entry) {
        var row = document.createElement('div');
        row.className = 'cfm-heatmap-row';
        var fname = document.createElement('span');
        fname.className = 'cfm-heatmap-file';
        fname.textContent = entry.file.split('/').pop() || entry.file;
        fname.title = entry.file;
        var barWrap = document.createElement('div');
        barWrap.className = 'cfm-heatmap-bar-wrap';
        var bar = document.createElement('div');
        bar.className = 'cfm-heatmap-bar';
        bar.style.width = Math.round((entry.count / hmMax) * 100) + '%';
        var cnt = document.createElement('span');
        cnt.className = 'cfm-heatmap-count';
        cnt.textContent = String(entry.count);
        barWrap.appendChild(bar);
        row.appendChild(fname);
        row.appendChild(barWrap);
        row.appendChild(cnt);
        heatmap.appendChild(row);
      });
      panel.appendChild(heatmap);
    } else {
      var hmEmpty = document.createElement('div');
      hmEmpty.className = 'cfm-empty';
      hmEmpty.style.padding = 'var(--cfm-space-md)';
      hmEmpty.textContent = t('metrics.noDataHint');
      panel.appendChild(hmEmpty);
    }

    // 토큰 사용량 섹션
    var tk = state.tokenUsage;
    var tokenTitle = document.createElement('h4');
    tokenTitle.textContent = t('token.title');
    tokenTitle.style.margin = 'var(--cfm-space-lg) 0 var(--cfm-space-sm)';
    panel.appendChild(tokenTitle);

    var tokenGrid = document.createElement('div');
    tokenGrid.className = 'cfm-metrics-grid';

    function formatTokenCount(n) {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return String(n);
    }

    var tokenItems = [
      { label: t('token.input'), value: tk.inputTokens, color: '#2196f3' },
      { label: t('token.output'), value: tk.outputTokens, color: '#4caf50' },
      { label: t('token.cacheCreate'), value: tk.cacheCreationTokens, color: '#ff9800' },
      { label: t('token.cacheRead'), value: tk.cacheReadTokens, color: '#9c27b0' },
    ];
    tokenItems.forEach(function(item) {
      var card = document.createElement('div');
      card.className = 'cfm-metric-card';
      var val = document.createElement('div');
      val.className = 'cfm-metric-value';
      val.style.color = item.color;
      val.textContent = formatTokenCount(item.value);
      var lbl = document.createElement('div');
      lbl.className = 'cfm-metric-label';
      lbl.textContent = item.label;
      card.appendChild(val);
      card.appendChild(lbl);
      tokenGrid.appendChild(card);
    });
    panel.appendChild(tokenGrid);

    // 총 토큰 바
    var totalBar = document.createElement('div');
    totalBar.className = 'cfm-token-total';
    var totalLabel = document.createElement('span');
    totalLabel.textContent = t('token.total');
    var totalValue = document.createElement('span');
    totalValue.className = 'cfm-token-total-value';
    totalValue.textContent = formatTokenCount(tk.totalTokens);
    totalBar.appendChild(totalLabel);
    totalBar.appendChild(totalValue);
    panel.appendChild(totalBar);

    // 토큰 비율 바
    if (tk.totalTokens > 0) {
      var ratioBar = document.createElement('div');
      ratioBar.className = 'cfm-token-ratio';
      var segments = [
        { pct: (tk.inputTokens / tk.totalTokens) * 100, color: '#2196f3' },
        { pct: (tk.outputTokens / tk.totalTokens) * 100, color: '#4caf50' },
        { pct: (tk.cacheCreationTokens / tk.totalTokens) * 100, color: '#ff9800' },
        { pct: (tk.cacheReadTokens / tk.totalTokens) * 100, color: '#9c27b0' },
      ];
      segments.forEach(function(seg) {
        if (seg.pct > 0) {
          var s = document.createElement('div');
          s.className = 'cfm-token-segment';
          s.style.width = seg.pct + '%';
          s.style.background = seg.color;
          ratioBar.appendChild(s);
        }
      });
      panel.appendChild(ratioBar);
    }
  }

  function createMetricDonut(label, percent, subtitle, color) {
    var card = document.createElement('div');
    card.className = 'cfm-metric-card';
    var donut = document.createElement('div');
    donut.className = 'cfm-donut-container';
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 36 36');
    svg.setAttribute('class', 'cfm-donut-svg');
    svg.setAttribute('width', '72');
    svg.setAttribute('height', '72');
    var track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    track.setAttribute('cx', '18'); track.setAttribute('cy', '18'); track.setAttribute('r', '15.9155');
    track.setAttribute('class', 'cfm-donut-track');
    var fill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    fill.setAttribute('cx', '18'); fill.setAttribute('cy', '18'); fill.setAttribute('r', '15.9155');
    fill.setAttribute('class', 'cfm-donut-fill');
    if (color) fill.style.stroke = color;
    fill.setAttribute('stroke-dasharray', percent + ' ' + (100 - percent));
    svg.appendChild(track);
    svg.appendChild(fill);
    donut.appendChild(svg);
    var pctLabel = document.createElement('div');
    pctLabel.className = 'cfm-donut-pct';
    pctLabel.textContent = percent + '%';
    if (color) pctLabel.style.color = color;
    donut.appendChild(pctLabel);
    card.appendChild(donut);
    var labelEl = document.createElement('div');
    labelEl.className = 'cfm-metric-label';
    labelEl.textContent = label;
    card.appendChild(labelEl);
    var sub = document.createElement('div');
    sub.className = 'cfm-metric-sub';
    sub.textContent = subtitle;
    card.appendChild(sub);
    return card;
  }

  function createMetricCard(label, value, icon) {
    var card = document.createElement('div');
    card.className = 'cfm-metric-card';
    var iconEl = document.createElement('div');
    iconEl.className = 'cfm-metric-icon';
    iconEl.textContent = icon;
    card.appendChild(iconEl);
    var valEl = document.createElement('div');
    valEl.className = 'cfm-metric-value';
    valEl.textContent = value;
    card.appendChild(valEl);
    var labelEl = document.createElement('div');
    labelEl.className = 'cfm-metric-label';
    labelEl.textContent = label;
    card.appendChild(labelEl);
    return card;
  }

  // --- Search Filter ---
  function matchesSearch(text) {
    if (!state.searchQuery) return true;
    return text.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1;
  }

  // --- Empty State ---
  function renderEmpty(container, messageKey, hintKey) {
    var div = document.createElement('div');
    div.className = 'cfm-empty';
    var iconEl = document.createElement('div');
    iconEl.className = 'cfm-empty-icon';
    iconEl.textContent = '\\u{1F50D}';
    div.appendChild(iconEl);
    var msg = document.createElement('div');
    msg.textContent = t(messageKey);
    div.appendChild(msg);
    if (hintKey) {
      var hint = document.createElement('div');
      hint.className = 'cfm-empty-hint';
      hint.textContent = t(hintKey);
      div.appendChild(hint);
    }
    container.appendChild(div);
  }

  // === 4. Message Handler ===
  var ALLOWED_MSG_TYPES = ['init', 'snapshotUpdate', 'translationsUpdate', 'activityUpdate', 'themeChanged', 'todoUpdate', 'tokenUpdate'];
  window.addEventListener('message', function(event) {
    var msg = event.data;
    if (!msg || typeof msg.type !== 'string') return;
    if (ALLOWED_MSG_TYPES.indexOf(msg.type) === -1) return;
    switch (msg.type) {
      case 'init':
        state.teams = msg.data.teams || {};
        state.currentTeam = msg.data.currentTeam;
        state.translations = msg.translations || {};
        state.locale = msg.locale || 'ko';
        renderAll();
        break;
      case 'snapshotUpdate':
        state.teams[msg.teamName] = msg.data;
        if (!state.currentTeam) state.currentTeam = msg.teamName;
        renderStatsBar();
        renderCurrentTab();
        break;
      case 'translationsUpdate':
        state.translations = msg.translations || {};
        state.locale = msg.locale || 'ko';
        renderAll();
        break;
      case 'activityUpdate':
        if (msg.items && msg.items.length > 0) {
          state.activities = state.activities.concat(msg.items).slice(-200);
          // TODO 항목 추출 (TodoWrite 도구 호출)
          msg.items.forEach(function(item) {
            if (item.type === 'command' && item.summary && item.summary.indexOf('TodoWrite') !== -1) {
              state.todoItems.push(item);
            }
          });
          if (state.currentTab === 'activity') renderActivity();
          if (state.currentTab === 'timeline') renderTimeline(getSnap());
          if (state.currentTab === 'metrics') renderMetrics(getSnap());
        }
        break;
      case 'todoUpdate':
        if (msg.items) {
          state.todoItems = msg.items;
        }
        break;
      case 'tokenUpdate':
        if (msg.usage) {
          state.tokenUsage = msg.usage;
          if (state.currentTab === 'metrics') renderMetrics(getSnap());
        }
        break;
    }
  });

  // === 5. Event Binding ===
  document.addEventListener('DOMContentLoaded', function() {
    // 탭 클릭
    document.querySelectorAll('.cfm-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        switchTab(tab.getAttribute('data-tab'));
      });
    });

    // 키보드 탭 전환 (1-7, 입력 필드에서는 무시)
    document.addEventListener('keydown', function(e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      var tabs = ['overview', 'tasks', 'messages', 'deps', 'activity', 'timeline', 'metrics'];
      var num = parseInt(e.key);
      if (num >= 1 && num <= 7) switchTab(tabs[num - 1]);
      // Ctrl+F or Cmd+F → 검색 포커스
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        var si = document.getElementById('search-input');
        if (si) si.focus();
      }
    });

    // 검색 입력 처리 (debounce)
    var searchTimer = null;
    var searchEl = document.getElementById('search-input');
    if (searchEl) {
      searchEl.addEventListener('input', function(e) {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(function() {
          state.searchQuery = e.target.value || '';
          renderCurrentTab();
        }, 150);
      });
    }

    // ready 메시지 전송
    vscode.postMessage({ type: 'ready' });
  });
})();`;
}
