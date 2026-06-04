import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import type { Env } from '../types';
import { exchangeCodeForToken, getGitHubUser, getOAuthUrl } from '../lib/github';
import { createToken } from '../lib/auth';

const TOKEN_TTL = 60 * 60 * 24 * 7;
const auth = new Hono<{ Bindings: Env }>();

auth.get('/github', (c) => {
  const callbackUrl = `${c.env.APP_URL}/auth/callback`;
  const url = getOAuthUrl(c.env.GITHUB_CLIENT_ID, 'state', callbackUrl);
  return c.redirect(url);
});

auth.get('/callback', async (c) => {
  const { code } = c.req.query();
  if (!code) return c.redirect('/?error=no_code');

  const accessToken = await exchangeCodeForToken(code, c.env.GITHUB_CLIENT_ID, c.env.GITHUB_CLIENT_SECRET);
  if (!accessToken) return c.redirect('/?error=no_token');

  const ghUser = await getGitHubUser(accessToken);
  if (!ghUser) return c.redirect('/?error=no_user');

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

  setCookie(c, 'mcp_session', token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: TOKEN_TTL,
    secure: true,
  });

  return c.redirect('/');
});

auth.get('/logout', (c) => {
  deleteCookie(c, 'mcp_session', { path: '/' });
  return c.redirect('/');
});

export { auth };
