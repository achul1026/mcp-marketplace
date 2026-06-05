import type { Collection, JwtPayload } from '../../types';
import { escHtml } from '../layout';

export function collectionsListPage(
  collections: (Collection & { server_count: number })[],
  user: JwtPayload | null
): string {
  return `
<div class="mb-8 flex items-start justify-between">
  <div>
    <h1 class="text-3xl font-bold mb-2">Collections</h1>
    <p class="text-gray-400">Curated bundles of MCP servers.</p>
  </div>
  ${user ? `
    <a href="/collections/new" class="bg-brand hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
      + New Collection
    </a>` : ''}
</div>

${collections.length === 0
  ? `<div class="text-center py-16 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
       <p class="text-2xl mb-2">📚</p>
       <p class="mb-3">No collections yet.</p>
       ${user ? `<a href="/collections/new" class="text-brand hover:underline text-sm">Create the first one →</a>` : ''}
     </div>`
  : `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
       ${collections.map(c => `
         <a href="/collections/${escHtml(c.slug)}"
            class="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition group">
           <div class="flex items-start justify-between mb-2">
             <h3 class="font-semibold text-white group-hover:text-brand transition">${escHtml(c.name)}</h3>
             <span class="text-xs text-gray-500">${c.server_count} servers</span>
           </div>
           ${c.description ? `<p class="text-gray-400 text-sm line-clamp-2 mb-3">${escHtml(c.description)}</p>` : ''}
           <p class="text-xs text-gray-500">by @${escHtml(c.author_login)}</p>
         </a>
       `).join('')}
     </div>`
}`;
}
