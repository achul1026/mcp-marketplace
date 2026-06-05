import type { Collection, Server } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { escHtml } from '../layout';

export function collectionDetailPage(collection: Collection, servers: Server[], isOwner: boolean): string {
  return `
<div class="max-w-4xl mx-auto">
  <a href="/collections" class="text-gray-500 hover:text-white text-sm mb-6 inline-block">← All collections</a>

  <div class="mb-8 flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <h1 class="text-3xl font-bold mb-2">${escHtml(collection.name)}</h1>
      ${collection.description ? `<p class="text-gray-400 mb-2">${escHtml(collection.description)}</p>` : ''}
      <p class="text-xs text-gray-500">by @${escHtml(collection.author_login)} · ${servers.length} servers</p>
    </div>
    ${isOwner ? `
      <div class="flex gap-2 shrink-0">
        <a href="/collections/${escHtml(collection.slug)}/edit"
          class="text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg transition">Edit</a>
        <form method="POST" action="/api/collections/${escHtml(collection.slug)}/delete"
              onsubmit="return confirm('Delete this collection?')">
          <button type="submit" class="text-sm text-red-500 hover:text-red-400 px-3 py-1.5 transition">Delete</button>
        </form>
      </div>` : ''}
  </div>

  ${servers.length === 0
    ? `<div class="text-center py-16 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
         <p>This collection has no servers yet.</p>
         ${isOwner ? `<a href="/collections/${escHtml(collection.slug)}/edit" class="text-brand hover:underline text-sm mt-2 inline-block">Add servers →</a>` : ''}
       </div>`
    : `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
         ${servers.map(s => `
           <a href="/server/${escHtml(s.id)}"
              class="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition group">
             <div class="flex items-start justify-between mb-3">
               <span class="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">${escHtml(CATEGORY_LABELS[s.category] ?? s.category)}</span>
               <span class="text-gray-500 text-xs">${s.download_count.toLocaleString()} installs</span>
             </div>
             <h3 class="font-semibold text-white group-hover:text-brand transition mb-1">${escHtml(s.name)}</h3>
             <p class="text-gray-400 text-sm line-clamp-2">${escHtml(s.description)}</p>
           </a>
         `).join('')}
       </div>`
  }
</div>`;
}
