import type { Server, Review, JwtPayload } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { escHtml } from '../layout';
import { buildConfigSnippet, CLIENT_LABELS, CLIENT_PATHS, type McpClient } from '../../lib/mcp';

function stars(avg: number): string {
  const full = Math.floor(avg);
  const half = avg - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

function installConfigCard(server: Server): string {
  const snippet = JSON.stringify(buildConfigSnippet(server.name, server.install_command), null, 2);
  const clients: McpClient[] = ['claude-desktop', 'cursor'];

  return `
<div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-sm font-semibold text-gray-300">Install configuration</h2>
    <div class="flex gap-1 bg-gray-950 border border-gray-800 rounded-lg p-1" id="client-tabs">
      ${clients.map((c, i) => `
        <button data-client="${c}"
          class="client-tab text-xs px-3 py-1 rounded-md transition ${i === 0 ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}">
          ${escHtml(CLIENT_LABELS[c])}
        </button>
      `).join('')}
    </div>
  </div>

  <div class="mb-3">
    <p class="text-xs text-gray-500 mb-1">Add this snippet to your config file:</p>
    <p class="text-xs text-gray-400 font-mono" id="client-path">${escHtml(CLIENT_PATHS[clients[0]!])}</p>
  </div>

  <div class="bg-gray-950 border border-gray-700 rounded-xl p-4 mb-3 relative">
    <button id="snippet-copy"
      class="absolute top-3 right-3 text-xs text-brand hover:text-blue-400 transition">Copy</button>
    <pre class="text-xs text-gray-300 font-mono overflow-x-auto pr-12" id="snippet-pre">${escHtml(snippet)}</pre>
  </div>

  <a href="/api/servers/${escHtml(server.id)}/config.json"
    class="inline-block text-xs text-brand hover:text-blue-400 transition">↓ Download config.json</a>

  <script>
    (() => {
      const paths = ${JSON.stringify(CLIENT_PATHS)};
      const pathEl = document.getElementById('client-path');
      const preEl = document.getElementById('snippet-pre');
      const snippet = preEl.textContent;
      document.querySelectorAll('.client-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.client-tab').forEach(b => {
            b.classList.remove('bg-gray-800', 'text-white');
            b.classList.add('text-gray-400');
          });
          btn.classList.add('bg-gray-800', 'text-white');
          btn.classList.remove('text-gray-400');
          pathEl.textContent = paths[btn.dataset.client];
        });
      });
      document.getElementById('snippet-copy').addEventListener('click', (e) => {
        navigator.clipboard.writeText(snippet).then(() => {
          e.target.textContent = 'Copied ✓';
          setTimeout(() => e.target.textContent = 'Copy', 1500);
        });
      });
    })();
  </script>
</div>`;
}

function verificationCard(server: Server, isOwner: boolean): string {
  const status = server.verify_status;
  const badge = status === 'ok'
    ? '<span class="text-xs px-2 py-1 rounded-full bg-green-900/40 text-green-400 border border-green-800">✓ Verified</span>'
    : status === 'failed'
    ? '<span class="text-xs px-2 py-1 rounded-full bg-red-900/40 text-red-400 border border-red-800">✗ Verification failed</span>'
    : '<span class="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">⋯ Pending</span>';

  const meta = status === 'ok' ? `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
      <div><p class="text-gray-500 text-xs">Stars</p><p class="text-gray-200">${(server.gh_stars ?? 0).toLocaleString()}</p></div>
      <div><p class="text-gray-500 text-xs">License</p><p class="text-gray-200">${escHtml(server.gh_license ?? 'Unknown')}</p></div>
      <div><p class="text-gray-500 text-xs">Last commit</p><p class="text-gray-200">${escHtml(server.gh_last_commit?.slice(0, 10) ?? '—')}</p></div>
      <div><p class="text-gray-500 text-xs">README</p><p class="text-gray-200">${server.gh_has_readme ? '✓' : '—'}</p></div>
    </div>` : '';

  const riskBlock = renderRiskBlock(server);

  const reverify = isOwner ? `
    <form method="POST" action="/api/servers/${escHtml(server.id)}/verify" class="mt-4">
      <button type="submit" class="text-xs text-brand hover:text-blue-400 transition">↻ Re-verify</button>
    </form>` : '';

  return `
<div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-semibold text-gray-300">Trust signals</h2>
    ${badge}
  </div>
  ${meta}
  ${riskBlock}
  ${server.last_verified_at ? `<p class="text-xs text-gray-600 mt-3">Verified ${escHtml(server.last_verified_at)}</p>` : ''}
  ${reverify}
</div>`;
}

function renderRiskBlock(server: Server): string {
  if (server.risk_score === null || server.risk_score === undefined) return '';
  const level = server.risk_score >= 50 ? 'high' : server.risk_score >= 20 ? 'medium' : 'low';
  const colors = {
    low: { bg: 'bg-green-900/40', text: 'text-green-400', border: 'border-green-800', label: 'Low risk' },
    medium: { bg: 'bg-yellow-900/40', text: 'text-yellow-400', border: 'border-yellow-800', label: 'Medium risk' },
    high: { bg: 'bg-red-900/40', text: 'text-red-400', border: 'border-red-800', label: 'High risk' },
  }[level];

  let signals: { label: string }[] = [];
  try {
    signals = server.risk_signals ? (JSON.parse(server.risk_signals) as { label: string }[]) : [];
  } catch {
    signals = [];
  }

  return `
<div class="mt-4 pt-4 border-t border-gray-800">
  <div class="flex items-center justify-between mb-2">
    <span class="text-xs text-gray-500">Risk score</span>
    <span class="text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}">${colors.label} · ${server.risk_score}/100</span>
  </div>
  ${signals.length > 0 ? `
    <ul class="text-xs text-gray-400 space-y-1">
      ${signals.map(s => `<li>· ${escHtml(s.label)}</li>`).join('')}
    </ul>` : '<p class="text-xs text-gray-500">No risk signals detected.</p>'}
</div>`;
}

export function detailPage(
  server: Server,
  reviewData: { reviews: Review[]; avg: number | null; count: number },
  user: JwtPayload | null
): string {
  const label = CATEGORY_LABELS[server.category] ?? server.category;
  const myReview = user ? reviewData.reviews.find(r => r.user_id === user.sub) ?? null : null;
  const isOwner = user?.sub === server.author_id;

  return `
<div class="max-w-3xl mx-auto">
  <a href="/" class="text-gray-500 hover:text-white text-sm mb-6 inline-block">← Back to list</a>

  ${!server.is_approved && isOwner ? `
  <div class="bg-yellow-900/30 border border-yellow-800 rounded-xl p-4 mb-6 flex items-center justify-between">
    <span class="text-yellow-300 text-sm">This server is unpublished — only you can see it.</span>
    <a href="/server/${escHtml(server.id)}/edit" class="text-yellow-300 hover:text-yellow-200 text-sm underline">Edit to publish</a>
  </div>` : ''}

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
      ${isOwner ? `<a href="/server/${escHtml(server.id)}/edit" class="text-brand hover:text-blue-400">✏️ Edit</a>` : ''}
    </div>

    <button
      onclick="fetch('/api/servers/${escHtml(server.id)}/download',{method:'POST'}).then(()=>{})"
      class="w-full bg-brand hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition"
    >
      ${server.price === 0 ? 'Use for Free' : `Buy for $${server.price}`}
    </button>
  </div>

  ${installConfigCard(server)}

  ${verificationCard(server, isOwner)}

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
      : `<form method="POST" action="/api/servers/${escHtml(server.id)}/review" class="mb-8">
           <div class="mb-3 flex items-center justify-between">
             <label class="block text-sm text-gray-400">Rating</label>
             ${myReview ? `<span class="text-xs text-green-400">Editing your review</span>` : ''}
           </div>
           <div class="flex gap-2 mb-3">
             ${[1,2,3,4,5].map(n => `
               <label class="cursor-pointer">
                 <input type="radio" name="rating" value="${n}" class="sr-only" ${myReview?.rating === n ? 'checked' : ''} required />
                 <span class="text-2xl ${myReview && n <= myReview.rating ? 'text-yellow-400' : ''} hover:text-yellow-400 transition star-btn" data-val="${n}">${myReview && n <= myReview.rating ? '★' : '☆'}</span>
               </label>
             `).join('')}
           </div>
           <div class="mb-3">
             <textarea name="comment" rows="3" maxlength="500" placeholder="Write a review... (optional)"
               class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500 resize-none">${escHtml(myReview?.comment ?? '')}</textarea>
           </div>
           <div class="flex items-center gap-3">
             <button type="submit" class="bg-brand hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
               ${myReview ? 'Update Review' : 'Submit Review'}
             </button>
             ${myReview ? `
               <button type="button" onclick="document.getElementById('review-delete-form').submit()"
                 class="text-red-500 hover:text-red-400 text-sm transition">Delete</button>` : ''}
           </div>
         </form>
         ${myReview ? `
         <form id="review-delete-form" method="POST" action="/api/servers/${escHtml(server.id)}/review/delete"
               onsubmit="return confirm('Delete your review?')" class="hidden"></form>` : ''}
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
