import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Context } from 'hono';
import type { Env, Collection, Server } from '../types';
import { verifyToken } from '../lib/auth';
import { slugify } from '../lib/mcp';
import { layout } from '../ui/layout';
import { collectionsListPage } from '../ui/pages/collections-list';
import { collectionDetailPage } from '../ui/pages/collection-detail';
import { collectionFormPage } from '../ui/pages/collection-form';

const collections = new Hono<{ Bindings: Env }>();

async function getUser(c: Context<{ Bindings: Env }>) {
  const token = getCookie(c, 'mcp_session');
  if (!token) return null;
  return verifyToken(token, c.env.JWT_SECRET);
}

async function uniqueSlug(db: D1Database, name: string): Promise<string> {
  const base = slugify(name);
  for (let i = 0; i < 4; i++) {
    const candidate = i === 0 ? base : `${base}-${crypto.randomUUID().slice(0, 6)}`;
    const exists = await db.prepare('SELECT 1 FROM collections WHERE slug = ?').bind(candidate).first();
    if (!exists) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

// GET /collections — 목록
collections.get('/collections', async (c) => {
  const user = await getUser(c);
  const result = await c.env.DB.prepare(
    `SELECT c.*, COUNT(cs.server_id) as server_count
     FROM collections c
     LEFT JOIN collection_servers cs ON c.id = cs.collection_id
     GROUP BY c.id
     ORDER BY c.created_at DESC LIMIT 60`
  ).all<Collection & { server_count: number }>();

  return c.html(layout('Collections', collectionsListPage(result.results, user), user));
});

// GET /collections/new — 생성 폼
collections.get('/collections/new', async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect('/auth/github');
  return c.html(layout('New Collection', collectionFormPage(null), user));
});

// POST /api/collections — 생성
collections.post('/api/collections', async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.parseBody();
  const name = (body['name'] as string | undefined)?.trim() ?? '';
  const description = (body['description'] as string | undefined)?.trim() ?? '';

  if (!name) {
    return c.html(layout('New Collection', collectionFormPage(null, 'Name is required.'), user), 400);
  }

  const id = crypto.randomUUID();
  const slug = await uniqueSlug(c.env.DB, name);
  await c.env.DB.prepare(
    `INSERT INTO collections (id, slug, name, description, author_id, author_login)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, slug, name.slice(0, 80), description.slice(0, 500) || null, user.sub, user.login).run();

  return c.redirect(`/collections/${slug}`);
});

// GET /collections/:slug — 상세
collections.get('/collections/:slug', async (c) => {
  const user = await getUser(c);
  const { slug } = c.req.param();

  const collection = await c.env.DB.prepare('SELECT * FROM collections WHERE slug = ?').bind(slug).first<Collection>();
  if (!collection) return c.html(layout('Not Found', '<p class="text-center py-16 text-gray-400">Collection not found.</p>', user), 404);

  const servers = await c.env.DB.prepare(
    `SELECT s.* FROM collection_servers cs
     JOIN servers s ON cs.server_id = s.id
     WHERE cs.collection_id = ? AND s.is_approved = 1
     ORDER BY cs.position ASC, cs.added_at ASC`
  ).bind(collection.id).all<Server>();

  const isOwner = user?.sub === collection.author_id;
  return c.html(layout(collection.name, collectionDetailPage(collection, servers.results, isOwner), user));
});

// GET /collections/:slug/edit — 편집 폼
collections.get('/collections/:slug/edit', async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect('/auth/github');

  const { slug } = c.req.param();
  const collection = await c.env.DB.prepare('SELECT * FROM collections WHERE slug = ?').bind(slug).first<Collection>();
  if (!collection) return c.html(layout('Not Found', '<p class="text-center py-16 text-gray-400">Collection not found.</p>', user), 404);
  if (collection.author_id !== user.sub) return c.html(layout('Forbidden', '<p class="text-center py-16 text-gray-400">You can only edit your own collections.</p>', user), 403);

  const inCollection = await c.env.DB.prepare(
    `SELECT s.* FROM collection_servers cs
     JOIN servers s ON cs.server_id = s.id
     WHERE cs.collection_id = ?
     ORDER BY cs.position ASC, cs.added_at ASC`
  ).bind(collection.id).all<Server>();

  const allServers = await c.env.DB.prepare(
    `SELECT id, name FROM servers WHERE is_approved = 1 ORDER BY name ASC LIMIT 200`
  ).all<{ id: string; name: string }>();

  return c.html(layout(`Edit ${collection.name}`, collectionFormPage(collection, undefined, {
    members: inCollection.results,
    candidates: allServers.results,
  }), user));
});

// POST /api/collections/:slug/edit — 메타 수정
collections.post('/api/collections/:slug/edit', async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect('/auth/github');

  const { slug } = c.req.param();
  const collection = await c.env.DB.prepare('SELECT * FROM collections WHERE slug = ?').bind(slug).first<Collection>();
  if (!collection) return c.json({ error: 'Collection not found.' }, 404);
  if (collection.author_id !== user.sub) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.parseBody();
  const name = (body['name'] as string | undefined)?.trim() ?? '';
  const description = (body['description'] as string | undefined)?.trim() ?? '';

  if (!name) return c.json({ error: 'Name is required.' }, 400);

  await c.env.DB.prepare(
    `UPDATE collections SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(name.slice(0, 80), description.slice(0, 500) || null, collection.id).run();

  return c.redirect(`/collections/${slug}/edit`);
});

// POST /api/collections/:slug/servers — 서버 추가
collections.post('/api/collections/:slug/servers', async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect('/auth/github');

  const { slug } = c.req.param();
  const collection = await c.env.DB.prepare('SELECT * FROM collections WHERE slug = ?').bind(slug).first<Collection>();
  if (!collection) return c.json({ error: 'Collection not found.' }, 404);
  if (collection.author_id !== user.sub) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.parseBody();
  const serverId = (body['server_id'] as string | undefined)?.trim() ?? '';
  if (!serverId) return c.redirect(`/collections/${slug}/edit`);

  const exists = await c.env.DB.prepare('SELECT 1 FROM servers WHERE id = ?').bind(serverId).first();
  if (!exists) return c.json({ error: 'Server not found.' }, 404);

  const maxPos = await c.env.DB.prepare(
    'SELECT COALESCE(MAX(position), -1) as m FROM collection_servers WHERE collection_id = ?'
  ).bind(collection.id).first<{ m: number }>();

  await c.env.DB.prepare(
    `INSERT INTO collection_servers (collection_id, server_id, position)
     VALUES (?, ?, ?)
     ON CONFLICT(collection_id, server_id) DO NOTHING`
  ).bind(collection.id, serverId, (maxPos?.m ?? -1) + 1).run();

  return c.redirect(`/collections/${slug}/edit`);
});

// POST /api/collections/:slug/servers/:server_id/delete — 서버 제거
collections.post('/api/collections/:slug/servers/:server_id/delete', async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect('/auth/github');

  const { slug, server_id } = c.req.param();
  const collection = await c.env.DB.prepare('SELECT * FROM collections WHERE slug = ?').bind(slug).first<Collection>();
  if (!collection) return c.json({ error: 'Collection not found.' }, 404);
  if (collection.author_id !== user.sub) return c.json({ error: 'Forbidden' }, 403);

  await c.env.DB.prepare(
    'DELETE FROM collection_servers WHERE collection_id = ? AND server_id = ?'
  ).bind(collection.id, server_id).run();

  return c.redirect(`/collections/${slug}/edit`);
});

// POST /api/collections/:slug/delete — 컬렉션 삭제
collections.post('/api/collections/:slug/delete', async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect('/auth/github');

  const { slug } = c.req.param();
  const collection = await c.env.DB.prepare('SELECT * FROM collections WHERE slug = ?').bind(slug).first<Collection>();
  if (!collection) return c.json({ error: 'Collection not found.' }, 404);
  if (collection.author_id !== user.sub) return c.json({ error: 'Forbidden' }, 403);

  await c.env.DB.prepare('DELETE FROM collections WHERE id = ?').bind(collection.id).run();
  return c.redirect('/collections');
});

export { collections };
