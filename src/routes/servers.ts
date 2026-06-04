import { Hono } from 'hono';
import type { Env, Server } from '../types';
import { verifyToken, getSessionCookie } from '../lib/auth';
import { layout } from '../ui/layout';
import { homePage } from '../ui/pages/home';
import { detailPage } from '../ui/pages/detail';
import { submitPage } from '../ui/pages/submit';

const servers = new Hono<{ Bindings: Env }>();

// 헬퍼: 현재 로그인 유저 가져오기
async function getUser(c: { req: { header: (k: string) => string | undefined }; env: Env }) {
  const token = getSessionCookie(c.req.header('Cookie') ?? null);
  if (!token) return null;
  return verifyToken(token, c.env.JWT_SECRET);
}

// GET / — 홈 (서버 목록)
servers.get('/', async (c) => {
  const q = c.req.query('q') ?? '';
  const category = c.req.query('category') ?? '';
  const user = await getUser(c);

  let rows: Server[];

  if (q) {
    // FTS 검색
    const result = await c.env.DB.prepare(
      `SELECT s.* FROM servers s
       JOIN servers_fts fts ON s.id = fts.id
       WHERE servers_fts MATCH ? AND s.is_approved = 1
       ${category && category !== 'all' ? 'AND s.category = ?' : ''}
       ORDER BY s.download_count DESC LIMIT 60`
    ).bind(...(category && category !== 'all' ? [q, category] : [q])).all<Server>();
    rows = result.results;
  } else {
    const result = await c.env.DB.prepare(
      `SELECT * FROM servers WHERE is_approved = 1
       ${category && category !== 'all' ? 'AND category = ?' : ''}
       ORDER BY download_count DESC, created_at DESC LIMIT 60`
    ).bind(...(category && category !== 'all' ? [category] : [])).all<Server>();
    rows = result.results;
  }

  const html = layout('MCP 서버 탐색', homePage(rows, q, category), user);
  return c.html(html);
});

// GET /submit — 등록 폼
servers.get('/submit', async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect('/auth/github');
  return c.html(layout('서버 등록', submitPage(), user));
});

// POST /api/servers — 서버 등록
servers.post('/api/servers', async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.parseBody();
  const { name, description, category, github_url, install_command } = body as Record<string, string>;

  if (!name || !description || !category || !github_url || !install_command) {
    const html = layout('서버 등록', submitPage('모든 필드를 입력해주세요.'), user);
    return c.html(html, 400);
  }

  // GitHub URL 검증
  if (!github_url.startsWith('https://github.com/')) {
    const html = layout('서버 등록', submitPage('GitHub URL 형식이 올바르지 않습니다.'), user);
    return c.html(html, 400);
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO servers (id, name, description, category, github_url, install_command, author_id, author_login)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, name.slice(0, 80), description.slice(0, 500), category, github_url, install_command, user.sub, user.login).run();

  return c.redirect(`/server/${id}`);
});

// GET /api/servers — JSON API
servers.get('/api/servers', async (c) => {
  const q = c.req.query('q') ?? '';
  const category = c.req.query('category') ?? '';

  const result = await c.env.DB.prepare(
    `SELECT * FROM servers WHERE is_approved = 1
     ${category && category !== 'all' ? 'AND category = ?' : ''}
     ORDER BY download_count DESC LIMIT 30`
  ).bind(...(category && category !== 'all' ? [category] : [])).all<Server>();

  return c.json({ servers: result.results });
});

// GET /server/:id — 서버 상세
servers.get('/server/:id', async (c) => {
  const user = await getUser(c);
  const { id } = c.req.param();

  const server = await c.env.DB.prepare(
    'SELECT * FROM servers WHERE id = ? AND is_approved = 1'
  ).bind(id).first<Server>();

  if (!server) return c.html(layout('404', '<p class="text-center py-16 text-gray-400">서버를 찾을 수 없습니다.</p>', user), 404);

  return c.html(layout(server.name, detailPage(server), user));
});

// POST /api/servers/:id/download — 다운로드 카운트 증가
servers.post('/api/servers/:id/download', async (c) => {
  const { id } = c.req.param();
  await c.env.DB.prepare(
    'UPDATE servers SET download_count = download_count + 1 WHERE id = ?'
  ).bind(id).run();
  return c.json({ ok: true });
});

export { servers };
