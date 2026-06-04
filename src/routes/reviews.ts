import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Context } from 'hono';
import type { Env, Review } from '../types';
import { verifyToken } from '../lib/auth';

const reviews = new Hono<{ Bindings: Env }>();

async function getUser(c: Context<{ Bindings: Env }>) {
  const token = getCookie(c, 'mcp_session');
  if (!token) return null;
  return verifyToken(token, c.env.JWT_SECRET);
}

// POST /api/servers/:id/review
reviews.post('/api/servers/:id/review', async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { id } = c.req.param();
  const body = await c.req.parseBody();
  const rating = Number(body['rating']);
  const comment = (body['comment'] as string | undefined)?.slice(0, 500) ?? null;

  if (!rating || rating < 1 || rating > 5) {
    return c.json({ error: '별점은 1~5점이어야 합니다.' }, 400);
  }

  // 자신의 서버에 리뷰 불가
  const server = await c.env.DB.prepare('SELECT author_id FROM servers WHERE id = ?').bind(id).first<{ author_id: string }>();
  if (!server) return c.json({ error: '서버를 찾을 수 없습니다.' }, 404);
  if (server.author_id === user.sub) return c.json({ error: '자신의 서버에는 리뷰를 남길 수 없습니다.' }, 403);

  const reviewId = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO reviews (id, user_id, server_id, rating, comment)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, server_id) DO UPDATE SET rating = excluded.rating, comment = excluded.comment`
  ).bind(reviewId, user.sub, id, rating, comment).run();

  return c.redirect(`/server/${id}`);
});

// GET /api/servers/:id/reviews (JSON)
reviews.get('/api/servers/:id/reviews', async (c) => {
  const { id } = c.req.param();
  const result = await c.env.DB.prepare(
    `SELECT r.*, u.github_login
     FROM reviews r JOIN users u ON r.user_id = u.id
     WHERE r.server_id = ? ORDER BY r.created_at DESC LIMIT 20`
  ).bind(id).all<Review>();

  const avg = result.results.length
    ? result.results.reduce((s, r) => s + r.rating, 0) / result.results.length
    : null;

  return c.json({ reviews: result.results, avg, count: result.results.length });
});

export { reviews };
