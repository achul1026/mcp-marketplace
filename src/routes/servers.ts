import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Context } from 'hono';
import type { Env, Server } from '../types';
import { verifyToken } from '../lib/auth';
import { verifyGitHubRepo } from '../lib/github';
import { assessRisk } from '../lib/risk';
import { buildConfigSnippet, slugify } from '../lib/mcp';
import { layout } from '../ui/layout';
import { homePage } from '../ui/pages/home';
import { detailPage } from '../ui/pages/detail';
import { submitPage } from '../ui/pages/submit';
import { editPage } from '../ui/pages/edit';

const servers = new Hono<{ Bindings: Env }>();

// 헬퍼: 현재 로그인 유저 가져오기
async function getUser(c: Context<{ Bindings: Env }>) {
  const token = getCookie(c, 'mcp_session');
  if (!token) return null;
  return verifyToken(token, c.env.JWT_SECRET);
}

// 헬퍼: GitHub 검증 + 위험도 평가 실행 후 DB 갱신
async function runVerify(db: D1Database, id: string, githubUrl: string) {
  const result = await verifyGitHubRepo(githubUrl);
  const risk = assessRisk(result);
  await db.prepare(
    `UPDATE servers
     SET verify_status = ?, gh_stars = ?, gh_license = ?, gh_last_commit = ?, gh_has_readme = ?, gh_readme_length = ?,
         risk_score = ?, risk_signals = ?, last_verified_at = datetime('now')
     WHERE id = ?`
  ).bind(
    result.status, result.stars, result.license, result.last_commit, result.has_readme, result.readme_length,
    risk.score, JSON.stringify(risk.signals), id
  ).run();
}

// GET / — 홈 (서버 목록)
servers.get('/', async (c) => {
  const q = c.req.query('q') ?? '';
  const category = c.req.query('category') ?? '';
  const page = Math.max(1, Number(c.req.query('page') ?? '1') || 1);
  const pageSize = 24;
  const offset = (page - 1) * pageSize;
  const limit = pageSize + 1;
  const user = await getUser(c);

  let rows: Server[];

  if (q) {
    const result = await c.env.DB.prepare(
      `SELECT s.* FROM servers s
       JOIN servers_fts fts ON s.id = fts.id
       WHERE servers_fts MATCH ? AND s.is_approved = 1
       ${category && category !== 'all' ? 'AND s.category = ?' : ''}
       ORDER BY s.download_count DESC LIMIT ? OFFSET ?`
    ).bind(...(category && category !== 'all' ? [q, category, limit, offset] : [q, limit, offset])).all<Server>();
    rows = result.results;
  } else {
    const result = await c.env.DB.prepare(
      `SELECT * FROM servers WHERE is_approved = 1
       ${category && category !== 'all' ? 'AND category = ?' : ''}
       ORDER BY download_count DESC, created_at DESC LIMIT ? OFFSET ?`
    ).bind(...(category && category !== 'all' ? [category, limit, offset] : [limit, offset])).all<Server>();
    rows = result.results;
  }

  const hasNext = rows.length > pageSize;
  const visible = hasNext ? rows.slice(0, pageSize) : rows;

  const html = layout('MCP 서버 탐색', homePage(visible, q, category, page, hasNext), user);
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
  const { name, description, category, github_url, install_command, version } = body as Record<string, string>;

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
    `INSERT INTO servers (id, name, description, category, github_url, install_command, version, author_id, author_login)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, name.slice(0, 80), description.slice(0, 500), category, github_url, install_command,
    (version?.trim() || '1.0.0').slice(0, 20), user.sub, user.login
  ).run();

  c.executionCtx.waitUntil(runVerify(c.env.DB, id, github_url));
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
    'SELECT * FROM servers WHERE id = ?'
  ).bind(id).first<Server>();

  if (!server) return c.html(layout('Not Found', '<p class="text-center py-16 text-gray-400">Server not found.</p>', user), 404);
  if (!server.is_approved && server.author_id !== user?.sub) {
    return c.html(layout('Not Found', '<p class="text-center py-16 text-gray-400">Server not found.</p>', user), 404);
  }

  const reviewResult = await c.env.DB.prepare(
    `SELECT r.*, u.github_login FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.server_id = ? ORDER BY r.created_at DESC LIMIT 20`
  ).bind(id).all<import('../types').Review>();

  const reviews = reviewResult.results;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return c.html(layout(server.name, detailPage(server, { reviews, avg, count: reviews.length }, user), user));
});

// GET /server/:id/edit — 서버 수정 폼 (소유자 전용)
servers.get('/server/:id/edit', async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect('/auth/github');

  const { id } = c.req.param();
  const server = await c.env.DB.prepare(
    'SELECT * FROM servers WHERE id = ?'
  ).bind(id).first<Server>();

  if (!server) return c.html(layout('Not Found', '<p class="text-center py-16 text-gray-400">Server not found.</p>', user), 404);
  if (server.author_id !== user.sub) return c.html(layout('Forbidden', '<p class="text-center py-16 text-gray-400">You can only edit your own servers.</p>', user), 403);

  return c.html(layout(`Edit ${server.name}`, editPage(server), user));
});

// POST /api/servers/:id/edit — 서버 수정 (소유자 전용)
servers.post('/api/servers/:id/edit', async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect('/auth/github');

  const { id } = c.req.param();
  const server = await c.env.DB.prepare(
    'SELECT * FROM servers WHERE id = ?'
  ).bind(id).first<Server>();

  if (!server) return c.json({ error: 'Server not found.' }, 404);
  if (server.author_id !== user.sub) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.parseBody();
  const { name, description, category, github_url, install_command, version } = body as Record<string, string>;
  const is_approved = body['is_approved'] ? 1 : 0;

  if (!name || !description || !category || !github_url || !install_command) {
    return c.html(layout(`Edit ${server.name}`, editPage(server, 'All required fields must be filled.'), user), 400);
  }

  if (!github_url.startsWith('https://github.com/')) {
    return c.html(layout(`Edit ${server.name}`, editPage(server, 'Invalid GitHub URL.'), user), 400);
  }

  await c.env.DB.prepare(
    `UPDATE servers
     SET name = ?, description = ?, category = ?, github_url = ?, install_command = ?, version = ?, is_approved = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    name.slice(0, 80), description.slice(0, 500), category, github_url, install_command,
    (version?.trim() || server.version).slice(0, 20), is_approved, id
  ).run();

  if (github_url !== server.github_url) {
    c.executionCtx.waitUntil(runVerify(c.env.DB, id, github_url));
  }
  return c.redirect(`/server/${id}`);
});

// POST /api/servers/:id/verify — 수동 재검증 (소유자 전용)
servers.post('/api/servers/:id/verify', async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect('/auth/github');

  const { id } = c.req.param();
  const server = await c.env.DB.prepare(
    'SELECT author_id, github_url FROM servers WHERE id = ?'
  ).bind(id).first<{ author_id: string; github_url: string }>();

  if (!server) return c.json({ error: 'Server not found.' }, 404);
  if (server.author_id !== user.sub) return c.json({ error: 'Forbidden' }, 403);

  await runVerify(c.env.DB, id, server.github_url);
  return c.redirect(`/server/${id}`);
});

// GET /api/servers/:id/config.json — 클라이언트 config snippet 다운로드
servers.get('/api/servers/:id/config.json', async (c) => {
  const { id } = c.req.param();
  const server = await c.env.DB.prepare(
    'SELECT name, install_command FROM servers WHERE id = ? AND is_approved = 1'
  ).bind(id).first<{ name: string; install_command: string }>();

  if (!server) return c.json({ error: 'Server not found.' }, 404);

  const snippet = buildConfigSnippet(server.name, server.install_command);
  return new Response(JSON.stringify(snippet, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="mcp-${slugify(server.name)}.json"`,
    },
  });
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
