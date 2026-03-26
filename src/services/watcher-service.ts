/**
 * WatcherService — core TeamWatcher를 VS Code 라이프사이클에 맞게 래핑
 */

import * as vscode from 'vscode';
import { TeamWatcher, type TeamSnapshot, type WatcherOptions, type Task, type TeamMember } from '../core/index.js';
import type { NotificationPayload, SnapshotPayload } from '../types/messages.js';

/** TeamSnapshot → 직렬화 가능한 SnapshotPayload 변환 */
export function toSnapshotPayload(teamName: string, snapshot: TeamSnapshot): SnapshotPayload {
  const config = snapshot.config;
  return {
    teamName,
    config: {
      name: config.name,
      agents: config.members.map((m) => ({
        name: m.name,
        description: m.agentType,
        model: m.model || 'sonnet',
        color: m.color,
        isLead: m.agentId === config.leadAgentId,
      })),
    },
    stats: {
      totalTasks: snapshot.stats.totalTasks,
      completedTasks: snapshot.stats.completedTasks,
      activeTasks: snapshot.stats.inProgressTasks,
      pendingTasks: snapshot.stats.pendingTasks,
      blockedTasks: 0,
      totalMessages: snapshot.stats.totalMessages,
      elapsedMs: snapshot.stats.uptime,
    },
    agents: snapshot.agents.map((a) => ({
      name: a.member.name,
      description: a.member.agentType,
      model: a.member.model || 'sonnet',
      color: a.member.color,
      isLead: a.member.agentId === config.leadAgentId,
      status: a.isIdle ? 'idle' as const : (a.activeTasks.length > 0 ? 'active' as const : 'completed' as const),
      currentTask: a.activeTasks[0]?.subject || null,
      completedTaskCount: a.completedTasks.length,
      totalTaskCount: a.allTasks.length,
    })),
    tasks: snapshot.tasks.map((t) => ({
      id: t.id,
      title: t.subject,
      description: t.description || '',
      status: t.status,
      assignee: t.owner,
      blockedBy: t.blockedBy,
      blocks: t.blocks,
    })),
    messages: snapshot.messages.slice(-50).map((m, i) => ({
      id: `${m.timestamp}-${i}`,
      from: m.from,
      to: m.to,
      content: m.content,
      timestamp: m.timestamp,
      type: m.type === 'text' ? 'text' as const
        : m.type === 'permission_request' ? 'permission' as const
        : 'system' as const,
    })),
    depsLayers: buildDepsLayers(snapshot.tasks),
  };
}

/** 태스크 의존성 레이어 계산 (위상 정렬) */
function buildDepsLayers(tasks: Task[]): string[][] {
  if (tasks.length === 0) return [];

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const t of tasks) {
    inDegree.set(t.id, t.blockedBy.length);
    for (const dep of t.blocks) {
      if (!adj.has(t.id)) adj.set(t.id, []);
      adj.get(t.id)!.push(dep);
    }
  }

  const layers: string[][] = [];
  let queue = tasks.filter((t) => (inDegree.get(t.id) || 0) === 0).map((t) => t.id);

  while (queue.length > 0) {
    layers.push([...queue]);
    const next: string[] = [];
    for (const id of queue) {
      for (const dep of (adj.get(id) || [])) {
        const deg = (inDegree.get(dep) || 1) - 1;
        inDegree.set(dep, deg);
        if (deg === 0) next.push(dep);
      }
    }
    queue = next;
  }

  return layers;
}

export class WatcherService implements vscode.Disposable {
  private watcher: TeamWatcher;
  private disposables: vscode.Disposable[] = [];

  private readonly _onUpdate = new vscode.EventEmitter<{ teamName: string; snapshot: TeamSnapshot }>();
  readonly onUpdate = this._onUpdate.event;

  private readonly _onRemove = new vscode.EventEmitter<string>();
  readonly onRemove = this._onRemove.event;

  private readonly _onNotification = new vscode.EventEmitter<NotificationPayload>();
  readonly onNotification = this._onNotification.event;

  constructor(options?: WatcherOptions) {
    this.watcher = new TeamWatcher(options);
    this.disposables.push(this._onUpdate, this._onRemove, this._onNotification);
  }

  private started = false;

  /** 감시 시작 (중복 호출 방지) */
  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    // 이벤트 바인딩
    this.watcher.on('snapshot:updated', (teamName: string, snapshot: TeamSnapshot) => {
      this._onUpdate.fire({ teamName, snapshot });
    });

    this.watcher.on('team:removed', (teamName: string) => {
      this._onRemove.fire(teamName);
    });

    this.watcher.on('task:completed', (teamName: string, task: Task) => {
      this._onNotification.fire({
        type: 'taskCompleted',
        teamName,
        message: task.subject,
      });
    });

    this.watcher.on('agent:joined', (teamName: string, member: TeamMember) => {
      this._onNotification.fire({
        type: 'agentJoined',
        teamName,
        message: member.name,
      });
    });

    this.watcher.on('agent:left', (teamName: string, memberName: string) => {
      this._onNotification.fire({
        type: 'agentLeft',
        teamName,
        message: memberName,
      });
    });

    await this.watcher.start();
  }

  /** 활성 팀 목록 */
  async getActiveTeams(): Promise<string[]> {
    return this.watcher.getActiveTeams();
  }

  /** 특정 팀 스냅샷 */
  async getTeamSnapshot(teamName: string): Promise<TeamSnapshot | null> {
    return this.watcher.getTeamSnapshot(teamName);
  }

  /** 전체 스냅샷 맵 */
  async getAllSnapshots(): Promise<Map<string, TeamSnapshot>> {
    return this.watcher.getAllSnapshots();
  }

  dispose(): void {
    this.watcher.stop().catch(() => {});
    for (const d of this.disposables) d.dispose();
  }
}
