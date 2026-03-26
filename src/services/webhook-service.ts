/**
 * WebhookService — Slack / Discord 웹훅 알림 전송 서비스
 *
 * VS Code 설정 `ccFlowMonitor.webhookUrl`에서 URL을 읽어
 * Slack Block Kit 또는 Discord Embed 형식으로 알림을 전송한다.
 * 외부 의존성 없이 Node.js 내장 https 모듈만 사용한다.
 */

import * as vscode from 'vscode';
import * as https from 'node:https';
import * as http from 'node:http';

/** 웹훅 페이로드 공통 인터페이스 */
export interface WebhookPayload {
  type: 'taskCompleted' | 'agentJoined' | 'agentLeft' | 'summary' | 'error';
  title: string;
  message: string;
  timestamp: number;
  teamName?: string;
}

/** 웹훅 URL 유형 */
type WebhookType = 'slack' | 'discord' | 'generic';

export class WebhookService implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  constructor() {
    // 설정 변경 감지 — 매 전송 시 설정을 읽으므로 재시작 불필요
  }

  /**
   * 웹훅 알림 전송
   * URL이 없거나 비어있으면 조용히 스킵한다.
   */
  async send(payload: WebhookPayload): Promise<void> {
    const url = this._getWebhookUrl();
    if (!url) return;

    try {
      const type = this._detectWebhookType(url);
      let body: object;

      if (type === 'slack') {
        body = this._formatSlack(payload);
      } else if (type === 'discord') {
        body = this._formatDiscord(payload);
      } else {
        body = payload;
      }

      await this._httpPost(url, body);
    } catch {
      // 네트워크 오류 등 graceful skip — 알림 실패가 확장 동작을 방해하면 안 됨
    }
  }

  /** 태스크 완료 알림 전송 */
  async sendTaskCompleted(teamName: string, taskTitle: string): Promise<void> {
    await this.send({
      type: 'taskCompleted',
      title: '태스크 완료',
      message: taskTitle,
      timestamp: Date.now(),
      teamName,
    });
  }

  /** 에이전트 참가 알림 전송 */
  async sendAgentJoined(teamName: string, agentName: string): Promise<void> {
    await this.send({
      type: 'agentJoined',
      title: '에이전트 참가',
      message: agentName,
      timestamp: Date.now(),
      teamName,
    });
  }

  /** 요약 알림 전송 */
  async sendSummary(summary: string): Promise<void> {
    await this.send({
      type: 'summary',
      title: '팀 요약',
      message: summary,
      timestamp: Date.now(),
    });
  }

  /**
   * VS Code 설정에서 웹훅 URL 읽기
   * 매 호출 시 최신 설정을 반영한다.
   */
  private _getWebhookUrl(): string | undefined {
    const config = vscode.workspace.getConfiguration('ccFlowMonitor');
    const url = config.get<string>('webhookUrl');
    return url && url.trim().length > 0 ? url.trim() : undefined;
  }

  /**
   * URL 패턴으로 웹훅 유형 감지
   * - hooks.slack.com → 'slack'
   * - discord.com/api/webhooks → 'discord'
   * - 그 외 → 'generic'
   */
  _detectWebhookType(url: string): WebhookType {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('slack.com')) return 'slack';
      if (parsed.hostname.includes('discord.com') && parsed.pathname.startsWith('/api/webhooks')) return 'discord';
    } catch {
      // 잘못된 URL이면 generic으로 처리
    }
    return 'generic';
  }

  /**
   * Slack Block Kit 형식으로 변환
   * https://api.slack.com/block-kit
   */
  _formatSlack(payload: WebhookPayload): object {
    const date = new Date(payload.timestamp).toLocaleString('ko-KR');
    const teamText = payload.teamName ? ` | 팀: ${payload.teamName}` : '';

    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: payload.title,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: payload.message,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${date}${teamText}`,
            },
          ],
        },
      ],
    };
  }

  /**
   * Discord Embed 형식으로 변환
   * https://discord.com/developers/docs/resources/webhook
   */
  _formatDiscord(payload: WebhookPayload): object {
    // 이벤트 유형별 색상 (Discord embed color, 10진수)
    const colorMap: Record<WebhookPayload['type'], number> = {
      taskCompleted: 0x2ecc71, // 녹색
      agentJoined:   0x3498db, // 파란색
      agentLeft:     0xe67e22, // 주황색
      summary:       0x9b59b6, // 보라색
      error:         0xe74c3c, // 빨간색
    };

    const fields: { name: string; value: string; inline: boolean }[] = [];
    if (payload.teamName) {
      fields.push({ name: '팀', value: payload.teamName, inline: true });
    }

    return {
      embeds: [
        {
          title: payload.title,
          description: payload.message,
          color: colorMap[payload.type] ?? 0x95a5a6,
          timestamp: new Date(payload.timestamp).toISOString(),
          fields,
          footer: {
            text: 'Claude Flow Monitor',
          },
        },
      ],
    };
  }

  /**
   * Node.js 내장 https/http 모듈로 POST 요청 전송
   * 4xx/5xx 응답은 에러로 처리한다.
   */
  async _httpPost(url: string, body: object): Promise<void> {
    return new Promise((resolve, reject) => {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        reject(new Error(`잘못된 웹훅 URL: ${url}`));
        return;
      }

      const data = JSON.stringify(body);
      const isHttps = parsed.protocol === 'https:';
      const transport = isHttps ? https : http;

      const options: https.RequestOptions = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'User-Agent': 'claude-flow-monitor-vscode',
        },
      };

      const req = transport.request(options, (res) => {
        // 응답 바디 소비 (소비하지 않으면 연결이 닫히지 않음)
        res.resume();
        res.on('end', () => {
          const status = res.statusCode ?? 0;
          if (status >= 200 && status < 300) {
            resolve();
          } else {
            reject(new Error(`웹훅 응답 오류: HTTP ${status}`));
          }
        });
      });

      req.on('error', (err) => reject(err));

      // 타임아웃 10초
      req.setTimeout(10_000, () => {
        req.destroy(new Error('웹훅 요청 타임아웃'));
      });

      req.write(data);
      req.end();
    });
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}
