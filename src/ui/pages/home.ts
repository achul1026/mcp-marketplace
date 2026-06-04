import type { Server, Category } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { escHtml } from '../layout';

export function homePage(
  servers: Server[],
  query: string,
  category: string,
): string {
  const categories = Object.entries(CATEGORY_LABELS) as [Category, string][];

  return `
<div class="mb-8">
  <h1 class="text-3xl font-bold mb-2">MCP 서버 마켓플레이스</h1>
  <p class="text-gray-400">Claude Desktop, Cursor 등에서 바로 쓸 수 있는 MCP 서버를 찾아보세요.</p>
</div>

<!-- 검색 + 필터 -->
<form method="GET" action="/" class="flex gap-3 mb-6">
  <input
    type="search"
    name="q"
    value="${escHtml(query)}"
    placeholder="서버 이름 또는 설명 검색..."
    class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500"
  />
  <button type="submit" class="bg-brand hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
    검색
  </button>
</form>

<!-- 카테고리 필터 -->
<div class="flex flex-wrap gap-2 mb-8">
  <a href="/" class="px-3 py-1 rounded-full text-sm transition ${!category || category === 'all' ? 'bg-brand text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}">
    전체
  </a>
  ${categories.map(([value, label]) => `
    <a href="/?category=${value}" class="px-3 py-1 rounded-full text-sm transition ${category === value ? 'bg-brand text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}">
      ${escHtml(label)}
    </a>
  `).join('')}
</div>

<!-- 서버 목록 -->
${servers.length === 0
  ? `<div class="text-center py-16 text-gray-500">
       <p class="text-2xl mb-2">🔍</p>
       <p>검색 결과가 없습니다.</p>
       <a href="/submit" class="text-brand hover:underline text-sm mt-2 inline-block">첫 번째 서버를 등록해보세요 →</a>
     </div>`
  : `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       ${servers.map(serverCard).join('')}
     </div>`
}`;
}

function serverCard(s: Server): string {
  const label = CATEGORY_LABELS[s.category] ?? s.category;
  return `
<a href="/server/${escHtml(s.id)}" class="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition group">
  <div class="flex items-start justify-between mb-3">
    <span class="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">${escHtml(label)}</span>
    <span class="text-gray-500 text-xs">${escHtml(String(s.download_count))} 다운로드</span>
  </div>
  <h3 class="font-semibold text-white group-hover:text-brand transition mb-1">${escHtml(s.name)}</h3>
  <p class="text-gray-400 text-sm line-clamp-2 mb-4">${escHtml(s.description)}</p>
  <div class="flex items-center justify-between text-xs text-gray-500">
    <span>@${escHtml(s.author_login)}</span>
    <span class="font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-300">
      ${s.price === 0 ? '무료' : `$${s.price}`}
    </span>
  </div>
</a>`;
}
