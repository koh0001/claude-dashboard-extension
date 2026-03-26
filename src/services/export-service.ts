/**
 * ExportService — 대시보드 데이터를 CSV 및 Markdown 리포트로 내보내기
 *
 * 활동 목록(ActivityItem)과 팀 스냅샷(SnapshotPayload)을 받아
 * CSV 파일 저장 또는 Markdown 리포트 생성/편집기 표시를 담당한다.
 */

import * as vscode from 'vscode';
import { promises as fs } from 'node:fs';
import type { ActivityItem, SnapshotPayload } from '../types/messages.js';

/** 태스크 내보내기용 최소 필드 집합 */
export interface ExportTask {
  id: string;
  title: string;
  status: string;
  assignee: string;
  description: string;
}

/** 최근 활동 리포트에 포함할 최대 항목 수 */
const REPORT_RECENT_LIMIT = 20;

/** 활동 타입 한국어 레이블 매핑 */
const ACTIVITY_TYPE_LABELS: Record<ActivityItem['type'], string> = {
  file_edit: '파일 편집',
  command: '커맨드',
  task_change: '태스크 변경',
  message: '메시지',
  error: '오류',
};

export class ExportService implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }

  // ──────────────────────────────────────────────
  // 공개 메서드
  // ──────────────────────────────────────────────

  /**
   * 활동 목록을 CSV로 내보낸다.
   *
   * @param activities 내보낼 ActivityItem 배열
   * @param filePath   저장 경로 (미지정 시 저장 다이얼로그 표시)
   * @returns          저장된 파일의 절대 경로
   */
  async exportCsv(activities: ActivityItem[], filePath?: string): Promise<string> {
    const header = 'timestamp,type,summary,detail\n';
    const rows = activities
      .map((item) => {
        const ts = new Date(item.timestamp).toISOString();
        const type = this.escapeCsvField(item.type);
        const summary = this.escapeCsvField(item.summary);
        const detail = this.escapeCsvField(item.detail ?? '');
        return `${ts},${type},${summary},${detail}`;
      })
      .join('\n');

    const csvContent = header + rows;
    const targetPath = await this._resolveFilePath(filePath, 'activities.csv', [
      { label: 'CSV 파일', extensions: ['csv'] },
    ]);

    await fs.writeFile(targetPath, csvContent, 'utf-8');
    return targetPath;
  }

  /**
   * 태스크 목록을 CSV로 내보낸다.
   *
   * @param tasks    내보낼 ExportTask 배열
   * @param filePath 저장 경로 (미지정 시 저장 다이얼로그 표시)
   * @returns        저장된 파일의 절대 경로
   */
  async exportTasksCsv(tasks: ExportTask[], filePath?: string): Promise<string> {
    const header = 'id,title,status,assignee,description\n';
    const rows = tasks
      .map((task) => {
        const id = this.escapeCsvField(task.id);
        const title = this.escapeCsvField(task.title);
        const status = this.escapeCsvField(task.status);
        const assignee = this.escapeCsvField(task.assignee);
        const description = this.escapeCsvField(task.description);
        return `${id},${title},${status},${assignee},${description}`;
      })
      .join('\n');

    const csvContent = header + rows;
    const targetPath = await this._resolveFilePath(filePath, 'tasks.csv', [
      { label: 'CSV 파일', extensions: ['csv'] },
    ]);

    await fs.writeFile(targetPath, csvContent, 'utf-8');
    return targetPath;
  }

  /**
   * Markdown 형식의 종합 리포트 문자열을 생성한다.
   *
   * @param snapshot   팀 스냅샷 (null 허용 — 팀 미선택 시)
   * @param activities 활동 항목 배열
   * @returns          Markdown 문자열
   */
  generateReport(snapshot: SnapshotPayload | null, activities: ActivityItem[]): string {
    const now = new Date();
    const lines: string[] = [];

    // ── 헤더 ──────────────────────────────────────────────────────────────
    lines.push('# Claude Flow Monitor — 활동 리포트');
    lines.push('');
    lines.push(`> 생성 시각: ${now.toLocaleString('ko-KR')}`);
    lines.push('');

    // ── 팀 개요 ───────────────────────────────────────────────────────────
    if (snapshot) {
      lines.push('## 팀 개요');
      lines.push('');
      lines.push(`- **팀 이름**: ${snapshot.teamName}`);
      const { stats } = snapshot;
      const elapsedMin = Math.round(stats.elapsedMs / 60_000);
      lines.push(`- **경과 시간**: ${elapsedMin}분`);
      lines.push(`- **총 메시지**: ${stats.totalMessages}개`);
      lines.push('');

      // ── 태스크 요약 ───────────────────────────────────────────────────
      lines.push('## 태스크 요약');
      lines.push('');
      lines.push(`| 항목 | 수 |`);
      lines.push(`|------|-----|`);
      lines.push(`| 전체 | ${stats.totalTasks} |`);
      lines.push(`| 완료 | ${stats.completedTasks} |`);
      lines.push(`| 진행 중 | ${stats.activeTasks} |`);
      lines.push(`| 대기 | ${stats.pendingTasks} |`);
      lines.push(`| 블로킹 | ${stats.blockedTasks} |`);
      lines.push('');

      // ── 에이전트 요약 ─────────────────────────────────────────────────
      if (snapshot.agents.length > 0) {
        lines.push('## 에이전트 요약');
        lines.push('');
        lines.push('| 이름 | 역할 | 상태 | 완료 / 전체 |');
        lines.push('|------|------|------|-------------|');
        for (const agent of snapshot.agents) {
          const role = agent.isLead ? '리더' : '멤버';
          const statusLabel =
            agent.status === 'active'
              ? '활성'
              : agent.status === 'completed'
                ? '완료'
                : '대기';
          lines.push(
            `| ${agent.name} | ${role} | ${statusLabel} | ${agent.completedTaskCount} / ${agent.totalTaskCount} |`,
          );
        }
        lines.push('');
      }
    } else {
      lines.push('## 팀 개요');
      lines.push('');
      lines.push('> 선택된 팀이 없습니다.');
      lines.push('');
    }

    // ── 활동 타입별 집계 ──────────────────────────────────────────────────
    lines.push('## 활동 유형별 통계');
    lines.push('');
    const typeCounts = this._countByType(activities);
    lines.push('| 유형 | 건수 |');
    lines.push('|------|------|');
    for (const [type, count] of Object.entries(typeCounts)) {
      const label = ACTIVITY_TYPE_LABELS[type as ActivityItem['type']] ?? type;
      lines.push(`| ${label} | ${count} |`);
    }
    lines.push(`| **합계** | **${activities.length}** |`);
    lines.push('');

    // ── 파일 편집 통계 ────────────────────────────────────────────────────
    const fileEdits = activities.filter((a) => a.type === 'file_edit');
    if (fileEdits.length > 0) {
      lines.push('## 파일 편집 통계');
      lines.push('');
      const fileCounts = this._countByFile(fileEdits);
      const sorted = Object.entries(fileCounts).sort((a, b) => b[1] - a[1]);
      lines.push('| 파일 | 편집 횟수 |');
      lines.push('|------|-----------|');
      for (const [file, count] of sorted) {
        lines.push(`| \`${file}\` | ${count} |`);
      }
      lines.push('');
    }

    // ── 최근 활동 ─────────────────────────────────────────────────────────
    lines.push('## 최근 활동');
    lines.push('');
    const recent = [...activities]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, REPORT_RECENT_LIMIT);

    if (recent.length === 0) {
      lines.push('> 기록된 활동이 없습니다.');
    } else {
      lines.push('| 시각 | 유형 | 요약 |');
      lines.push('|------|------|------|');
      for (const item of recent) {
        const ts = new Date(item.timestamp).toLocaleString('ko-KR');
        const typeLabel = ACTIVITY_TYPE_LABELS[item.type] ?? item.type;
        // 테이블 셀 내 파이프 문자 이스케이프
        const summary = item.summary.replace(/\|/g, '\\|');
        lines.push(`| ${ts} | ${typeLabel} | ${summary} |`);
      }
    }
    lines.push('');
    lines.push('---');
    lines.push('*Claude Flow Monitor에 의해 자동 생성됨*');

    return lines.join('\n');
  }

  /**
   * Markdown 리포트를 생성하여 새 편집기 탭에서 연다.
   *
   * @param snapshot   팀 스냅샷 (null 허용)
   * @param activities 활동 항목 배열
   */
  async showReport(snapshot: SnapshotPayload | null, activities: ActivityItem[]): Promise<void> {
    const content = this.generateReport(snapshot, activities);
    const doc = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content,
    });
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  /**
   * CSV 필드를 안전하게 이스케이프한다.
   *
   * 쉼표, 큰따옴표, 줄바꿈이 포함된 경우 큰따옴표로 감싸고,
   * 내부 큰따옴표는 두 개로 이중화한다.
   *
   * @param value 이스케이프할 원본 문자열
   * @returns     CSV 안전 문자열
   */
  escapeCsvField(value: string): string {
    const str = String(value);
    // 특수 문자가 없으면 그대로 반환
    if (!str.includes('"') && !str.includes(',') && !str.includes('\n') && !str.includes('\r')) {
      return str;
    }
    // 큰따옴표를 두 개로 이중화한 뒤 전체를 큰따옴표로 감쌈
    return `"${str.replace(/"/g, '""')}"`;
  }

  // ──────────────────────────────────────────────
  // 내부 헬퍼
  // ──────────────────────────────────────────────

  /**
   * 저장 경로를 결정한다.
   * filePath가 주어지면 그대로 사용하고, 없으면 저장 다이얼로그를 표시한다.
   *
   * @param filePath     명시적 경로 (옵션)
   * @param defaultName  다이얼로그 기본 파일명
   * @param filters      다이얼로그 파일 필터 목록
   * @returns            최종 저장 경로
   * @throws             사용자가 다이얼로그를 취소한 경우
   */
  private async _resolveFilePath(
    filePath: string | undefined,
    defaultName: string,
    filters: Array<{ label: string; extensions: string[] }>,
  ): Promise<string> {
    if (filePath) return filePath;

    // 저장 다이얼로그 옵션 구성
    const filterRecord: Record<string, string[]> = {};
    for (const f of filters) {
      filterRecord[f.label] = f.extensions;
    }

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(defaultName),
      filters: filterRecord,
    });

    if (!uri) {
      throw new Error('파일 저장이 취소되었습니다.');
    }

    return uri.fsPath;
  }

  /**
   * 활동 배열을 타입별로 집계하여 카운트 맵을 반환한다.
   */
  private _countByType(activities: ActivityItem[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of activities) {
      counts[item.type] = (counts[item.type] ?? 0) + 1;
    }
    return counts;
  }

  /**
   * 파일 편집 활동에서 파일별 편집 횟수를 집계한다.
   * detail 필드 또는 summary에서 파일 경로를 추출한다.
   */
  private _countByFile(fileEdits: ActivityItem[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of fileEdits) {
      // detail이 있으면 파일 경로로, 없으면 summary를 키로 사용
      const key = (item.detail ?? item.summary).trim() || '(알 수 없음)';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }
}
