import { escHtml } from '../layout';

export function submitPage(error?: string): string {
  return `
<div class="max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mb-2">MCP 서버 등록</h1>
  <p class="text-gray-400 mb-8">직접 만든 MCP 서버를 마켓플레이스에 등록하세요.</p>

  ${error ? `<div class="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-6 text-red-300 text-sm">${escHtml(error)}</div>` : ''}

  <form method="POST" action="/api/servers" class="space-y-5">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">서버 이름 <span class="text-red-400">*</span></label>
      <input type="text" name="name" required maxlength="80"
        placeholder="예: GitHub Issues Manager"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500" />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">설명 <span class="text-red-400">*</span></label>
      <textarea name="description" required maxlength="500" rows="3"
        placeholder="MCP 서버가 어떤 기능을 하는지 간단히 설명해주세요."
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500 resize-none"></textarea>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">카테고리 <span class="text-red-400">*</span></label>
      <select name="category" required
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
        <option value="">카테고리 선택</option>
        <option value="productivity">생산성</option>
        <option value="data">데이터</option>
        <option value="developer">개발자 도구</option>
        <option value="ai">AI</option>
        <option value="communication">커뮤니케이션</option>
        <option value="other">기타</option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">GitHub 저장소 URL <span class="text-red-400">*</span></label>
      <input type="url" name="github_url" required
        placeholder="https://github.com/username/repo"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500" />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">
        설치 명령어 <span class="text-red-400">*</span>
        <span class="text-gray-500 text-xs font-normal ml-1">(claude_desktop_config.json에 들어갈 npx 또는 uvx 명령)</span>
      </label>
      <input type="text" name="install_command" required
        placeholder="npx -y @username/mcp-server"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand placeholder-gray-500" />
    </div>

    <div class="pt-2">
      <button type="submit"
        class="w-full bg-brand hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition">
        서버 등록하기
      </button>
      <p class="text-xs text-gray-500 mt-2 text-center">등록된 서버는 검토 후 즉시 게시됩니다.</p>
    </div>
  </form>
</div>`;
}
