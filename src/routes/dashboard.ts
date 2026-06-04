import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Context } from 'hono';
import type { Env, Server } from '../types';
import { verifyToken } from '../lib/auth';
import { layout } from '../ui/layout';
import { dashboardPage } from '../ui/pages/dashboard';

const dashboard = new Hono<{ Bindings: Env }>();

async function getUser(c: Context<{ Bindings: Env }>) {
  const token = getCookie(c, 'mcp_session');
  if (!token) return null;
  return verifyToken(token, c.env.JWT_SECRET);
}

// GET /dashboard
dashboard.get('/dashboard', async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect('/auth/github');

  const servers = await c.env.DB.prepare(
    `SELECT s.*,
       COALESCE(AVG(r.rating), 0) as avg_rating,
       COUNT(r.id) as review_count
     FROM servers s
     LEFT JOIN reviews r ON s.id = r.server_id
     WHERE s.author_id = ?
     GROUP BY s.id
     ORDER BY s.created_at DESC`
  ).bind(user.sub).all<Server & { avg_rating: number; review_count: number }>();

  return c.html(layout('내 대시보드', dashboardPage(servers.results, user), user));
});

// POST /api/servers/:id/delete
dashboard.post('/api/servers/:id/delete', async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { id } = c.req.param();
  const server = await c.env.DB.prepare('SELECT author_id FROM servers WHERE id = ?').bind(id).first<{ author_id: string }>();
  if (!server || server.author_id !== user.sub) return c.json({ error: 'Forbidden' }, 403);

  await c.env.DB.prepare('DELETE FROM servers WHERE id = ?').bind(id).run();
  return c.redirect('/dashboard');
});

export { dashboard };
