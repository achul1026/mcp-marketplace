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

export type VerifyResult = {
  status: 'ok' | 'failed';
  stars: number | null;
  license: string | null;
  last_commit: string | null;
  has_readme: 0 | 1;
  readme_length: number | null;
};

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const m = url.match(/^https:\/\/github\.com\/([^/\s]+)\/([^/\s?#]+)/i);
  const owner = m?.[1];
  const repo = m?.[2];
  if (!owner || !repo) return null;
  return { owner, repo: repo.replace(/\.git$/i, '') };
}

export async function verifyGitHubRepo(githubUrl: string): Promise<VerifyResult> {
  const failed: VerifyResult = { status: 'failed', stars: null, license: null, last_commit: null, has_readme: 0, readme_length: null };
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) return failed;

  const headers = {
    'User-Agent': 'mcp-marketplace',
    Accept: 'application/vnd.github+json',
  };

  try {
    const [repoRes, readmeRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers }),
      fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`, { headers }),
    ]);

    if (!repoRes.ok) return failed;

    const repo = (await repoRes.json()) as {
      stargazers_count?: number;
      pushed_at?: string;
      license?: { spdx_id?: string } | null;
    };

    let readmeLength: number | null = null;
    if (readmeRes.ok) {
      const readme = (await readmeRes.json()) as { content?: string; encoding?: string };
      if (readme.content && readme.encoding === 'base64') {
        try {
          readmeLength = atob(readme.content.replace(/\n/g, '')).length;
        } catch {
          readmeLength = null;
        }
      }
    }

    return {
      status: 'ok',
      stars: repo.stargazers_count ?? 0,
      license: repo.license?.spdx_id ?? null,
      last_commit: repo.pushed_at ?? null,
      has_readme: readmeRes.ok ? 1 : 0,
      readme_length: readmeLength,
    };
  } catch {
    return failed;
  }
}
