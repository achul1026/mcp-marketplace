import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Context } from 'hono';
import type { Env, Server } from '../types';
import { verifyToken } from '../lib/auth';
import { layout } from '../ui/layout';
import { homePage } from '../ui/pages/home';
import { detailPage } from '../ui/pages/detail';
import { submitPage } from '../ui/pages/submit';

const servers = new Hono<{ Bindings: Env }>();

// 헬퍼: 현재 로그인 유저 가져오기
async function getUser(c: Context<{ Bindings: Env }>) {
  const token = getCookie(c, 'mcp_session');
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
  return c.html(layout('Submit Server', submitPage(), user));
});

// POST /api/servers — 서버 등록
servers.post('/api/servers', async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.parseBody();
  const { name, description, category, github_url, install_command } = body as Record<string, string>;

  if (!name || !description || !category || !github_url || !install_command) {
    const html = layout('Submit Server', submitPage('All fields are required.'), user);
    return c.html(html, 400);
  }

  if (!github_url.startsWith('https://github.com/')) {
    const html = layout('Submit Server', submitPage('Invalid GitHub URL.'), user);
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

  if (!server) return c.html(layout('Not Found', '<p class="text-center py-16 text-gray-400">Server not found.</p>', user), 404);

  const reviewResult = await c.env.DB.prepare(
    `SELECT r.*, u.github_login FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.server_id = ? ORDER BY r.created_at DESC LIMIT 20`
  ).bind(id).all<import('../types').Review>();

  const reviews = reviewResult.results;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return c.html(layout(server.name, detailPage(server, { reviews, avg, count: reviews.length }, user), user));
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
