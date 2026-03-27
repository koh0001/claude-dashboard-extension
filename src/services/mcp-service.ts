/**
 * McpService — MCP(Model Context Protocol) 연동 서비스
 *
 * 두 가지 역할을 담당한다:
 * 1. .mcp.json 설정 파일을 읽어 연결된 MCP 서버 목록 제공
 * 2. HTTP JSON API 서버를 열어 대시보드 데이터를 외부에 노출 (MCP 서버 모드)
 */

import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as http from 'node:http';
import * as os from 'node:os';

/** MCP 서버 설정 정보 */
export interface McpServerInfo {
  /** 서버 이름 */
  name: string;
  /** 실행 커맨드 또는 원격 URL */
  command: string;
  /** 연결 방식 */
  type: 'stdio' | 'sse' | 'http';
  /** 설정 상태 */
  status: 'configured' | 'unknown';
}

/** .mcp.json 파일 내 mcpServers 필드 구조 */
interface McpJsonEntry {
  command?: string;
  url?: string;
  args?: string[];
  type?: string;
}

/** .mcp.json 파일 전체 구조 */
interface McpJsonFile {
  mcpServers?: Record<string, McpJsonEntry>;
}

export class McpService implements vscode.Disposable {
  /** 현재 캐시된 MCP 서버 목록 */
  private servers: McpServerInfo[] = [];

  /** HTTP 서버 인스턴스 (null이면 미실행) */
  private httpServer: http.Server | null = null;

  /** 실제 바인딩된 포트 (서버 미실행 시 null) */
  private port: number | null = null;

  /** 서버 시작 시각 (uptime 계산용) */
  private startedAt: number | null = null;

  /** 외부에서 주입된 팀 데이터 */
  private teamsData: Record<string, unknown> = {};

  /** 외부에서 주입된 활동 데이터 */
  private activitiesData: unknown[] = [];

  private disposables: vscode.Disposable[] = [];

  constructor() {
    // 초기화 시 설정 파일 읽기
    this.refreshServers();
  }

  // ─────────────────────────────────────────────
  // MCP 설정 읽기 (읽기 전용 기능)
  // ─────────────────────────────────────────────

  /**
   * 현재 캐시된 MCP 서버 목록 반환
   * 워크스페이스 루트의 .mcp.json과 ~/.claude/.mcp.json을 합쳐서 반환한다.
   */
  getConfiguredServers(): McpServerInfo[] {
    return [...this.servers];
  }

  /** MCP 설정 파일을 다시 읽어 캐시 갱신 */
  refreshServers(): void {
    const all: McpServerInfo[] = [];

    // 워크스페이스 루트 .mcp.json
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceMcpPath = path.join(workspaceFolders[0].uri.fsPath, '.mcp.json');
      all.push(...this._readMcpConfig(workspaceMcpPath));
    }

    // 전역 ~/.claude/.mcp.json
    const globalMcpPath = path.join(os.homedir(), '.claude', '.mcp.json');
    all.push(...this._readMcpConfig(globalMcpPath));

    // 이름 기준 중복 제거 (워크스페이스 설정 우선)
    const seen = new Set<string>();
    this.servers = all.filter((s) => {
      if (seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    });
  }

  /**
   * .mcp.json 파일 파싱
   * @param filePath 읽을 파일 경로
   * @returns 파싱된 McpServerInfo 배열 (실패 시 빈 배열)
   */
  private _readMcpConfig(filePath: string): McpServerInfo[] {
    if (!fs.existsSync(filePath)) return [];

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed: McpJsonFile = JSON.parse(raw);
      const mcpServers = parsed.mcpServers;
      if (!mcpServers || typeof mcpServers !== 'object') return [];

      return Object.entries(mcpServers).map(([name, entry]) => {
        // 타입 판별: url이 있으면 sse/http, 없으면 stdio
        const hasUrl = typeof entry.url === 'string' && entry.url.length > 0;
        let type: McpServerInfo['type'] = 'stdio';
        if (hasUrl) {
          // entry.type이 명시된 경우 그대로 사용 (http 또는 sse)
          type = (entry.type === 'http' || entry.type === 'sse') ? entry.type : 'sse';
        } else if (entry.type === 'http') {
          type = 'http';
        }

        const command = hasUrl
          ? (entry.url as string)
          : (entry.command || '');

        return {
          name,
          command,
          type,
          status: 'configured' as const,
        };
      });
    } catch {
      // JSON 파싱 실패 graceful skip
      return [];
    }
  }

  // ─────────────────────────────────────────────
  // HTTP API 서버 (MCP 서버 모드)
  // ─────────────────────────────────────────────

  /**
   * HTTP JSON API 서버 시작
   * @param port 바인딩할 포트 (0이면 OS가 랜덤 포트 할당)
   * @returns 실제 바인딩된 포트 번호
   */
  startServer(port: number = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      if (this.httpServer) {
        // 이미 실행 중이면 현재 포트 반환
        resolve(this.port!);
        return;
      }

      const server = http.createServer((req, res) => {
        this._handleRequest(req, res);
      });

      // 보안: localhost에만 바인딩
      server.listen(port, '127.0.0.1', () => {
        const addr = server.address();
        const actualPort = typeof addr === 'object' && addr !== null ? addr.port : port;
        this.port = actualPort;
        this.startedAt = Date.now();
        this.httpServer = server;
        resolve(actualPort);
      });

      server.on('error', (err) => {
        reject(err);
      });
    });
  }

  /** HTTP API 서버 중지 */
  stopServer(): void {
    if (!this.httpServer) return;
    // 활성 연결을 즉시 종료하여 블로킹 방지
    this.httpServer.closeAllConnections();
    this.httpServer.close();
    this.httpServer = null;
    this.port = null;
    this.startedAt = null;
  }

  /** 서버 실행 중 여부 */
  isRunning(): boolean {
    return this.httpServer !== null;
  }

  /** 현재 바인딩된 포트 (미실행 시 null) */
  getPort(): number | null {
    return this.port;
  }

  // ─────────────────────────────────────────────
  // 데이터 세터 (외부에서 주입)
  // ─────────────────────────────────────────────

  /** 팀 스냅샷 데이터 업데이트 */
  setTeamsData(data: Record<string, unknown>): void {
    this.teamsData = data;
  }

  /** 활동 데이터 업데이트 */
  setActivitiesData(data: unknown[]): void {
    this.activitiesData = data;
  }

  // ─────────────────────────────────────────────
  // HTTP 요청 핸들러 (내부)
  // ─────────────────────────────────────────────

  /** HTTP 요청 라우팅 처리 */
  private _handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    // CORS 헤더 (로컬 개발 편의)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // Preflight 처리
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // GET만 허용
    if (req.method !== 'GET') {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    const url = req.url?.split('?')[0] || '/';

    switch (url) {
      case '/api/teams':
        this._sendJson(res, 200, this.teamsData);
        break;

      case '/api/activities':
        this._sendJson(res, 200, this.activitiesData);
        break;

      case '/api/metrics': {
        // 기본 메트릭 (팀 데이터에서 집계)
        const teamCount = Object.keys(this.teamsData).length;
        const activityCount = this.activitiesData.length;
        this._sendJson(res, 200, {
          teamCount,
          activityCount,
          uptimeMs: this.startedAt ? Date.now() - this.startedAt : 0,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case '/api/health':
        this._sendJson(res, 200, {
          status: 'ok',
          uptime: this.startedAt ? Date.now() - this.startedAt : 0,
        });
        break;

      default:
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not Found' }));
        break;
    }
  }

  /** JSON 응답 전송 헬퍼 */
  private _sendJson(res: http.ServerResponse, statusCode: number, data: unknown): void {
    try {
      const body = JSON.stringify(data);
      res.writeHead(statusCode);
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  }

  // ─────────────────────────────────────────────
  // Disposable
  // ─────────────────────────────────────────────

  dispose(): void {
    this.stopServer();
    for (const d of this.disposables) d.dispose();
  }
}
