import type { Server } from '../../types';
import type { JwtPayload } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { escHtml } from '../layout';

function stars(avg: number): string {
  const full = Math.round(avg);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

export function dashboardPage(
  servers: (Server & { avg_rating: number; review_count: number })[],
  user: JwtPayload
): string {
  const totalDownloads = servers.reduce((s, sv) => s + sv.download_count, 0);

  return `
<div class="mb-8 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold">내 대시보드</h1>
    <p class="text-gray-400 text-sm mt-1">@${escHtml(user.login)}</p>
  </div>
  <a href="/submit" class="bg-brand hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
    + 서버 등록
  </a>
</div>

<!-- 요약 카드 -->
<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <p class="text-gray-400 text-sm mb-1">등록 서버</p>
    <p class="text-3xl font-bold">${servers.length}</p>
  </div>
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <p class="text-gray-400 text-sm mb-1">총 다운로드</p>
    <p class="text-3xl font-bold">${totalDownloads.toLocaleString()}</p>
  </div>
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-5 col-span-2 md:col-span-1">
    <p class="text-gray-400 text-sm mb-1">수익</p>
    <p class="text-3xl font-bold">$0 <span class="text-sm text-gray-500 font-normal">(Stripe 연동 예정)</span></p>
  </div>
</div>

<!-- 서버 목록 -->
<h2 class="text-lg font-semibold mb-4">등록한 서버</h2>
${servers.length === 0
  ? `<div class="text-center py-16 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
       <p class="text-2xl mb-2">📦</p>
       <p class="mb-3">아직 등록한 서버가 없습니다.</p>
       <a href="/submit" class="text-brand hover:underline text-sm">첫 번째 서버 등록하기 →</a>
     </div>`
  : `<div class="space-y-3">
      ${servers.map(serverRow).join('')}
     </div>`
}`;
}

function serverRow(s: Server & { avg_rating: number; review_count: number }): string {
  const label = CATEGORY_LABELS[s.category] ?? s.category;
  return `
<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2 mb-1">
      <a href="/server/${escHtml(s.id)}" class="font-semibold hover:text-brand transition">${escHtml(s.name)}</a>
      <span class="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">${escHtml(label)}</span>
      <span class="text-xs text-gray-500">v${escHtml(s.version)}</span>
    </div>
    <p class="text-sm text-gray-400 truncate">${escHtml(s.description)}</p>
  </div>
  <div class="flex items-center gap-6 text-sm shrink-0">
    <div class="text-center">
      <p class="text-gray-400 text-xs">다운로드</p>
      <p class="font-semibold">${s.download_count.toLocaleString()}</p>
    </div>
    <div class="text-center">
      <p class="text-yellow-400 text-xs">${stars(s.avg_rating)}</p>
      <p class="text-gray-400 text-xs">${s.review_count}개 리뷰</p>
    </div>
    <form method="POST" action="/api/servers/${escHtml(s.id)}/delete"
          onsubmit="return confirm('정말 삭제하시겠습니까?')">
      <button type="submit" class="text-red-500 hover:text-red-400 text-xs transition">삭제</button>
    </form>
  </div>
</div>`;
}
