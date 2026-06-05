import type { Server } from '../../types';
import { escHtml } from '../layout';

export function editPage(server: Server, error?: string): string {
  return `
<div class="max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mb-2">Edit Server</h1>
  <p class="text-gray-400 mb-8">Update details for <span class="text-gray-200">${escHtml(server.name)}</span>.</p>

  ${error ? `<div class="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-6 text-red-300 text-sm">${escHtml(error)}</div>` : ''}

  <form method="POST" action="/api/servers/${escHtml(server.id)}/edit" class="space-y-5">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">Server name <span class="text-red-400">*</span></label>
      <input type="text" name="name" required maxlength="80"
        value="${escHtml(server.name)}"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500" />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">Description <span class="text-red-400">*</span></label>
      <textarea name="description" required maxlength="500" rows="3"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500 resize-none">${escHtml(server.description)}</textarea>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">Category <span class="text-red-400">*</span></label>
      <select name="category" required
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
        ${['productivity','data','developer','ai','communication','other']
          .map(c => `<option value="${c}"${server.category === c ? ' selected' : ''}>${c}</option>`)
          .join('')}
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">GitHub Repository URL <span class="text-red-400">*</span></label>
      <input type="url" name="github_url" required
        value="${escHtml(server.github_url)}"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500" />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">Install command <span class="text-red-400">*</span></label>
      <input type="text" name="install_command" required
        value="${escHtml(server.install_command)}"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand placeholder-gray-500" />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">Version</label>
      <input type="text" name="version" maxlength="20"
        value="${escHtml(server.version)}"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand placeholder-gray-500" />
    </div>

    <div class="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
      <label class="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" name="is_approved" value="1" ${server.is_approved ? 'checked' : ''}
          class="mt-1 w-4 h-4 accent-brand" />
        <span>
          <span class="block text-sm font-medium text-gray-200">Publish</span>
          <span class="block text-xs text-gray-500 mt-0.5">Unchecked = hidden from listings and detail page (only visible to you).</span>
        </span>
      </label>
    </div>

    <div class="pt-2 flex gap-3">
      <a href="/server/${escHtml(server.id)}"
        class="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-gray-200 py-3 rounded-xl font-medium transition">
        Cancel
      </a>
      <button type="submit"
        class="flex-1 bg-brand hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition">
        Save Changes
      </button>
    </div>
  </form>
</div>`;
}
