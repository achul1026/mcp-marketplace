import { Hono } from 'hono';
import type { Env } from '../types';
import { exchangeCodeForToken, getGitHubUser, getOAuthUrl } from '../lib/github';
import { createToken, makeSessionCookie, clearSessionCookie } from '../lib/auth';

const auth = new Hono<{ Bindings: Env }>();

// GitHub OAuth 시작
auth.get('/github', (c) => {
  const state = crypto.randomUUID();
  const callbackUrl = `${c.env.APP_URL}/auth/callback`;
  const url = getOAuthUrl(c.env.GITHUB_CLIENT_ID, state, callbackUrl);

  c.header('Set-Cookie', `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`);
  return c.redirect(url);
});

// GitHub OAuth 콜백
auth.get('/callback', async (c) => {
  const { code, state } = c.req.query();
  const cookieHeader = c.req.header('Cookie') ?? '';
  const storedState = cookieHeader.match(/oauth_state=([^;]+)/)?.[1];

  if (!code || !state || state !== storedState) {
    return c.redirect('/?error=auth_failed');
  }

  const accessToken = await exchangeCodeForToken(code, c.env.GITHUB_CLIENT_ID, c.env.GITHUB_CLIENT_SECRET);
  if (!accessToken) return c.redirect('/?error=auth_failed');

  const ghUser = await getGitHubUser(accessToken);
  if (!ghUser) return c.redirect('/?error=auth_failed');

  // DB에 사용자 upsert
  const userId = `gh_${ghUser.id}`;
  await c.env.DB.prepare(
    `INSERT INTO users (id, github_id, github_login, email, avatar_url)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(github_id) DO UPDATE SET
       github_login = excluded.github_login,
       email = excluded.email,
       avatar_url = excluded.avatar_url`
  ).bind(userId, ghUser.id, ghUser.login, ghUser.email, ghUser.avatar_url).run();

  const token = await createToken(
    { sub: userId, login: ghUser.login, avatar: ghUser.avatar_url },
    c.env.JWT_SECRET
  );

  c.header('Set-Cookie', makeSessionCookie(token));
  c.header('Set-Cookie', 'oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0', { append: true });
  return c.redirect('/');
});

// 로그아웃
auth.get('/logout', (c) => {
  c.header('Set-Cookie', clearSessionCookie());
  return c.redirect('/');
});

export { auth };
