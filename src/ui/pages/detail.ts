import type { Server } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { escHtml } from '../layout';

export function detailPage(server: Server): string {
  const label = CATEGORY_LABELS[server.category] ?? server.category;

  return `
<div class="max-w-3xl mx-auto">
  <a href="/" class="text-gray-500 hover:text-white text-sm mb-6 inline-block">← 목록으로</a>

  <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8">
    <div class="flex items-center gap-3 mb-4">
      <span class="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">${escHtml(label)}</span>
      <span class="text-xs text-gray-500">${escHtml(String(server.download_count))} 다운로드</span>
    </div>

    <h1 class="text-2xl font-bold mb-2">${escHtml(server.name)}</h1>
    <p class="text-gray-400 mb-6">${escHtml(server.description)}</p>

    <!-- 설치 명령어 -->
    <div class="bg-gray-950 border border-gray-700 rounded-xl p-4 mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-gray-500 uppercase tracking-wide">설치 명령어</span>
        <button
          onclick="navigator.clipboard.writeText(this.dataset.cmd).then(()=>this.textContent='복사됨 ✓').catch(()=>{}); setTimeout(()=>this.textContent='복사',1500)"
          data-cmd="${escHtml(server.install_command)}"
          class="text-xs text-brand hover:text-blue-400 transition"
        >복사</button>
      </div>
      <code class="text-green-400 text-sm font-mono block overflow-x-auto">${escHtml(server.install_command)}</code>
    </div>

    <!-- 메타 정보 -->
    <div class="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
      <span>👤 <a href="https://github.com/${escHtml(server.author_login)}" target="_blank" class="text-gray-300 hover:text-white">@${escHtml(server.author_login)}</a></span>
      <span>📦 <a href="${escHtml(server.github_url)}" target="_blank" class="text-gray-300 hover:text-white">GitHub 저장소</a></span>
      <span>🕒 ${escHtml(server.created_at.slice(0, 10))}</span>
    </div>

    <!-- 다운로드 버튼 -->
    <button
      onclick="fetch('/api/servers/${escHtml(server.id)}/download',{method:'POST'}).then(()=>{})"
      class="w-full bg-brand hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition"
    >
      ${server.price === 0 ? '무료로 사용하기' : `$${server.price}에 구매하기`}
    </button>
  </div>
</div>`;
}
