import type { Server, Review, JwtPayload } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { escHtml } from '../layout';

function stars(avg: number): string {
  const full = Math.floor(avg);
  const half = avg - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

export function detailPage(
  server: Server,
  reviewData: { reviews: Review[]; avg: number | null; count: number },
  user: JwtPayload | null
): string {
  const label = CATEGORY_LABELS[server.category] ?? server.category;
  const hasReviewed = user ? reviewData.reviews.some(r => r.user_id === user.sub) : false;
  const isOwner = user?.sub === server.author_id;

  return `
<div class="max-w-3xl mx-auto">
  <a href="/" class="text-gray-500 hover:text-white text-sm mb-6 inline-block">← Back to list</a>

  <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
    <div class="flex items-center gap-3 mb-4">
      <span class="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">${escHtml(label)}</span>
      <span class="text-xs text-gray-500">${escHtml(String(server.download_count))} installs</span>
      <span class="text-xs text-gray-500">v${escHtml(server.version)}</span>
      ${reviewData.avg ? `<span class="text-yellow-400 text-xs">${stars(reviewData.avg)} ${reviewData.avg.toFixed(1)}</span>` : ''}
    </div>

    <h1 class="text-2xl font-bold mb-2">${escHtml(server.name)}</h1>
    <p class="text-gray-400 mb-6">${escHtml(server.description)}</p>

    <div class="bg-gray-950 border border-gray-700 rounded-xl p-4 mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-gray-500 uppercase tracking-wide">Install command</span>
        <button
          onclick="navigator.clipboard.writeText(this.dataset.cmd).then(()=>this.textContent='Copied ✓').catch(()=>{}); setTimeout(()=>this.textContent='Copy',1500)"
          data-cmd="${escHtml(server.install_command)}"
          class="text-xs text-brand hover:text-blue-400 transition"
        >Copy</button>
      </div>
      <code class="text-green-400 text-sm font-mono block overflow-x-auto">${escHtml(server.install_command)}</code>
    </div>

    <div class="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
      <span>👤 <a href="https://github.com/${escHtml(server.author_login)}" target="_blank" class="text-gray-300 hover:text-white">@${escHtml(server.author_login)}</a></span>
      <span>📦 <a href="${escHtml(server.github_url)}" target="_blank" class="text-gray-300 hover:text-white">GitHub Repository</a></span>
      <span>🕒 ${escHtml(server.created_at.slice(0, 10))}</span>
    </div>

    <button
      onclick="fetch('/api/servers/${escHtml(server.id)}/download',{method:'POST'}).then(()=>{})"
      class="w-full bg-brand hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition"
    >
      ${server.price === 0 ? 'Use for Free' : `Buy for $${server.price}`}
    </button>
  </div>

  <!-- Reviews -->
  <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold">
        Reviews
        ${reviewData.count > 0 ? `<span class="text-gray-400 text-sm font-normal ml-2">${reviewData.count} · ${reviewData.avg?.toFixed(1)} avg</span>` : ''}
      </h2>
    </div>

    ${!user
      ? `<p class="text-gray-500 text-sm mb-6"><a href="/auth/github" class="text-brand hover:underline">Sign in</a> to leave a review.</p>`
      : isOwner
      ? `<p class="text-gray-500 text-sm mb-6">You can't review your own server.</p>`
      : hasReviewed
      ? `<p class="text-green-400 text-sm mb-6">✓ You've already reviewed this server.</p>`
      : `<form method="POST" action="/api/servers/${escHtml(server.id)}/review" class="mb-8">
           <div class="mb-3">
             <label class="block text-sm text-gray-400 mb-2">Rating</label>
             <div class="flex gap-2">
               ${[1,2,3,4,5].map(n => `
                 <label class="cursor-pointer">
                   <input type="radio" name="rating" value="${n}" class="sr-only" required />
                   <span class="text-2xl hover:text-yellow-400 transition star-btn" data-val="${n}">☆</span>
                 </label>
               `).join('')}
             </div>
           </div>
           <div class="mb-3">
             <textarea name="comment" rows="3" maxlength="500" placeholder="Write a review... (optional)"
               class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500 resize-none"></textarea>
           </div>
           <button type="submit" class="bg-brand hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
             Submit Review
           </button>
         </form>
         <script>
           document.querySelectorAll('.star-btn').forEach(btn => {
             btn.addEventListener('click', () => {
               const val = Number(btn.dataset.val);
               document.querySelectorAll('.star-btn').forEach((s, i) => {
                 s.textContent = i < val ? '★' : '☆';
                 s.classList.toggle('text-yellow-400', i < val);
               });
             });
           });
         </script>`
    }

    ${reviewData.reviews.length === 0
      ? `<p class="text-gray-500 text-sm">No reviews yet. Be the first!</p>`
      : reviewData.reviews.map(r => `
        <div class="border-t border-gray-800 py-4 first:border-t-0 first:pt-0">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-yellow-400 text-sm">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            <span class="text-gray-400 text-sm">@${escHtml(r.github_login ?? '')}</span>
            <span class="text-gray-600 text-xs">${escHtml(r.created_at.slice(0, 10))}</span>
          </div>
          ${r.comment ? `<p class="text-gray-300 text-sm">${escHtml(r.comment)}</p>` : ''}
        </div>
      `).join('')
    }
  </div>
</div>`;
}
