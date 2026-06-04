type GitHubUser = {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
};

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function getGitHubUser(accessToken: string): Promise<GitHubUser | null> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'mcp-marketplace' },
  });

  if (!res.ok) return null;
  return res.json() as Promise<GitHubUser>;
}

export function getOAuthUrl(clientId: string, state: string, callbackUrl: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'user:email',
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}
