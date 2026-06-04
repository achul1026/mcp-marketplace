import { escHtml } from '../layout';

export function submitPage(error?: string): string {
  return `
<div class="max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mb-2">Submit an MCP Server</h1>
  <p class="text-gray-400 mb-8">Share your MCP server with the community.</p>

  ${error ? `<div class="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-6 text-red-300 text-sm">${escHtml(error)}</div>` : ''}

  <form method="POST" action="/api/servers" class="space-y-5">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">Server name <span class="text-red-400">*</span></label>
      <input type="text" name="name" required maxlength="80"
        placeholder="e.g. GitHub Issues Manager"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500" />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">Description <span class="text-red-400">*</span></label>
      <textarea name="description" required maxlength="500" rows="3"
        placeholder="What does this MCP server do?"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500 resize-none"></textarea>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">Category <span class="text-red-400">*</span></label>
      <select name="category" required
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
        <option value="">Select a category</option>
        <option value="productivity">Productivity</option>
        <option value="data">Data</option>
        <option value="developer">Developer Tools</option>
        <option value="ai">AI</option>
        <option value="communication">Communication</option>
        <option value="other">Other</option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">GitHub Repository URL <span class="text-red-400">*</span></label>
      <input type="url" name="github_url" required
        placeholder="https://github.com/username/repo"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500" />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">
        Install command <span class="text-red-400">*</span>
        <span class="text-gray-500 text-xs font-normal ml-1">(the npx or uvx command for claude_desktop_config.json)</span>
      </label>
      <input type="text" name="install_command" required
        placeholder="npx -y @username/mcp-server"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand placeholder-gray-500" />
    </div>

    <div class="pt-2">
      <button type="submit"
        class="w-full bg-brand hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition">
        Submit Server
      </button>
      <p class="text-xs text-gray-500 mt-2 text-center">Submitted servers are published immediately after review.</p>
    </div>
  </form>
</div>`;
}
