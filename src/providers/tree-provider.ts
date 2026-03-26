/**
 * TreeProvider — 사이드바 트리뷰 (팀 → 에이전트 → 태스크)
 */

import * as vscode from 'vscode';
import type { TeamSnapshot } from '../core/index.js';
import { WatcherService } from '../services/watcher-service.js';
import { I18nService } from '../services/i18n-service.js';

/** 트리 항목 타입 */
type TreeItemType = 'team' | 'agent' | 'task';

/** 트리 노드 데이터 */
interface TreeNodeData {
  type: TreeItemType;
  teamName: string;
  label: string;
  description?: string;
  status?: string;
  color?: string;
  children?: TreeNodeData[];
}

export class TeamTreeProvider implements vscode.TreeDataProvider<TreeNodeData> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<TreeNodeData | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private snapshots = new Map<string, TeamSnapshot>();
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly watcherService: WatcherService,
    private readonly i18nService: I18nService,
  ) {
    // 스냅샷 변경 시 트리 갱신
    this.disposables.push(
      watcherService.onUpdate(({ teamName, snapshot }) => {
        this.snapshots.set(teamName, snapshot);
        this._onDidChangeTreeData.fire();
      }),
    );

    this.disposables.push(
      watcherService.onRemove((teamName) => {
        this.snapshots.delete(teamName);
        this._onDidChangeTreeData.fire();
      }),
    );

    this.disposables.push(this._onDidChangeTreeData);
  }

  /** 초기 데이터 로드 */
  async refresh(): Promise<void> {
    this.snapshots = await this.watcherService.getAllSnapshots();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeNodeData): vscode.TreeItem {
    const item = new vscode.TreeItem(
      element.label,
      element.children && element.children.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
    );

    item.description = element.description;

    // 아이콘 설정
    switch (element.type) {
      case 'team':
        item.iconPath = new vscode.ThemeIcon('telescope');
        item.contextValue = 'team';
        break;
      case 'agent':
        item.iconPath = element.status === 'idle'
          ? new vscode.ThemeIcon('person', new vscode.ThemeColor('disabledForeground'))
          : new vscode.ThemeIcon('account');
        item.contextValue = 'agent';
        break;
      case 'task':
        item.iconPath = element.status === 'completed'
          ? new vscode.ThemeIcon('check')
          : element.status === 'in_progress'
          ? new vscode.ThemeIcon('loading~spin')
          : new vscode.ThemeIcon('circle-outline');
        item.contextValue = 'task';
        break;
    }

    return item;
  }

  getChildren(element?: TreeNodeData): TreeNodeData[] {
    if (!element) {
      // 루트: 팀 목록
      return Array.from(this.snapshots.entries()).map(([name, snap]) => ({
        type: 'team' as const,
        teamName: name,
        label: snap.config.name,
        description: `${snap.stats.completionRate}%`,
        children: this.buildAgentNodes(name, snap),
      }));
    }
    return element.children || [];
  }

  /** 에이전트 노드 생성 */
  private buildAgentNodes(teamName: string, snap: TeamSnapshot): TreeNodeData[] {
    return snap.agents.map((agent) => ({
      type: 'agent' as const,
      teamName,
      label: agent.member.name,
      description: agent.isIdle ? this.i18nService.t('status.pending') : agent.member.agentType,
      status: agent.isIdle ? 'idle' : 'active',
      color: agent.member.color,
      children: agent.allTasks.map((task) => ({
        type: 'task' as const,
        teamName,
        label: `#${task.id} ${task.subject}`,
        status: task.status,
      })),
    }));
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}
