import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { SessionParserService } from './session-parser.js';

describe('SessionParserService', () => {
  let tmpDir: string;
  let parser: SessionParserService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfm-test-'));
    parser = new SessionParserService();
  });

  afterEach(() => {
    parser.dispose();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('JSONL 파일을 파싱한다', () => {
    const sessionFile = path.join(tmpDir, 'test.jsonl');
    const lines = [
      JSON.stringify({ type: 'tool_use', tool_name: 'Edit', tool_input: { file_path: '/src/app.ts' }, timestamp: '2026-03-26T10:00:00Z' }),
      JSON.stringify({ type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'npm test' }, timestamp: '2026-03-26T10:01:00Z' }),
    ];
    fs.writeFileSync(sessionFile, lines.join('\n'));

    const items = parser.parseFile(sessionFile);
    expect(items).toHaveLength(2);
    expect(items[0].type).toBe('file_edit');
    expect(items[0].summary).toContain('app.ts');
    expect(items[1].type).toBe('command');
    expect(items[1].summary).toContain('npm test');
  });

  it('잘못된 JSON을 graceful하게 건너뛴다', () => {
    const sessionFile = path.join(tmpDir, 'bad.jsonl');
    fs.writeFileSync(sessionFile, '{ invalid json\n' + JSON.stringify({ type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'echo hi' } }));

    const items = parser.parseFile(sessionFile);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('command');
  });

  it('빈 파일을 처리한다', () => {
    const sessionFile = path.join(tmpDir, 'empty.jsonl');
    fs.writeFileSync(sessionFile, '');

    const items = parser.parseFile(sessionFile);
    expect(items).toHaveLength(0);
  });

  it('존재하지 않는 파일을 graceful하게 처리한다', () => {
    const items = parser.parseFile('/nonexistent/file.jsonl');
    expect(items).toHaveLength(0);
  });

  it('증분 파싱: 이미 읽은 줄은 건너뛴다', () => {
    const sessionFile = path.join(tmpDir, 'incr.jsonl');
    fs.writeFileSync(sessionFile,
      JSON.stringify({ type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'echo 1' } })
    );

    const first = parser.parseFile(sessionFile);
    expect(first).toHaveLength(1);

    // 새 줄 추가
    fs.appendFileSync(sessionFile, '\n' + JSON.stringify({ type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'echo 2' } }));

    const second = parser.parseFile(sessionFile);
    expect(second).toHaveLength(1);
    expect(second[0].summary).toContain('echo 2');
  });
});
