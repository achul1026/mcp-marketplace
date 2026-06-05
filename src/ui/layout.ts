import type { JwtPayload } from '../types';

export function layout(title: string, content: string, user: JwtPayload | null): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)} · MCP Marketplace</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: { colors: { brand: '#5865F2' } } }
    }
  </script>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen">
  <header class="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
    <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 font-bold text-lg">
        <span class="text-brand">⚡</span> MCP Marketplace
      </a>
      <nav class="flex items-center gap-4 text-sm">
        <a href="/?category=all" class="text-gray-400 hover:text-white transition">Explore</a>
        <a href="/collections" class="text-gray-400 hover:text-white transition">Collections</a>
        ${user
          ? `<a href="/submit" class="text-gray-400 hover:text-white transition">Submit Server</a>
             <a href="/dashboard" class="text-gray-400 hover:text-white transition">Dashboard</a>
             <div class="flex items-center gap-2">
               <img src="${escHtml(user.avatar ?? '')}" alt="" class="w-7 h-7 rounded-full" />
               <span class="text-gray-300">${escHtml(user.login)}</span>
               <a href="/auth/logout" class="text-gray-500 hover:text-white text-xs transition">Sign out</a>
             </div>`
          : `<a href="/auth/github" class="bg-brand hover:bg-blue-600 text-white px-3 py-1.5 rounded-md transition text-sm font-medium">
               Sign in with GitHub
             </a>`
        }
      </nav>
    </div>
  </header>
  <main class="max-w-6xl mx-auto px-4 py-8">
    ${content}
  </main>
  <footer class="border-t border-gray-800 mt-16 py-8 text-center text-gray-600 text-sm">
    <p>MCP Marketplace · <a href="https://modelcontextprotocol.io" class="hover:text-gray-400" target="_blank">MCP Docs</a></p>
  </footer>
</body>
</html>`;
}

export function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
