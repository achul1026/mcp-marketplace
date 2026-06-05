import type { Collection, Server } from '../../types';
import { escHtml } from '../layout';

type EditContext = {
  members: Server[];
  candidates: { id: string; name: string }[];
};

export function collectionFormPage(
  collection: Collection | null,
  error?: string,
  edit?: EditContext
): string {
  const isEdit = !!collection;
  const action = isEdit ? `/api/collections/${escHtml(collection!.slug)}/edit` : `/api/collections`;
  const title = isEdit ? 'Edit Collection' : 'New Collection';

  return `
<div class="max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mb-2">${title}</h1>
  ${isEdit
    ? `<p class="text-gray-400 mb-8"><a href="/collections/${escHtml(collection!.slug)}" class="text-brand hover:underline">← View public page</a></p>`
    : `<p class="text-gray-400 mb-8">Group related MCP servers into a curated bundle.</p>`}

  ${error ? `<div class="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-6 text-red-300 text-sm">${escHtml(error)}</div>` : ''}

  <form method="POST" action="${action}" class="space-y-5">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">Name <span class="text-red-400">*</span></label>
      <input type="text" name="name" required maxlength="80"
        value="${escHtml(collection?.name ?? '')}"
        placeholder="e.g. Developer Essentials"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500" />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
      <textarea name="description" maxlength="500" rows="3"
        placeholder="What's in this collection?"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand placeholder-gray-500 resize-none">${escHtml(collection?.description ?? '')}</textarea>
    </div>

    <div class="pt-2">
      <button type="submit"
        class="w-full bg-brand hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition">
        ${isEdit ? 'Save Changes' : 'Create Collection'}
      </button>
    </div>
  </form>

  ${edit ? renderMembersSection(collection!, edit) : ''}
</div>`;
}

function renderMembersSection(collection: Collection, edit: EditContext): string {
  const memberIds = new Set(edit.members.map(m => m.id));
  const candidates = edit.candidates.filter(c => !memberIds.has(c.id));

  return `
<div class="mt-10 pt-8 border-t border-gray-800">
  <h2 class="text-lg font-semibold mb-4">Servers in this collection</h2>

  ${edit.members.length === 0
    ? `<p class="text-gray-500 text-sm mb-6">No servers yet.</p>`
    : `<ul class="space-y-2 mb-6">
         ${edit.members.map(s => `
           <li class="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5">
             <a href="/server/${escHtml(s.id)}" class="text-sm text-gray-200 hover:text-brand transition truncate">${escHtml(s.name)}</a>
             <form method="POST" action="/api/collections/${escHtml(collection.slug)}/servers/${escHtml(s.id)}/delete">
               <button type="submit" class="text-xs text-red-500 hover:text-red-400 transition shrink-0 ml-3">Remove</button>
             </form>
           </li>
         `).join('')}
       </ul>`
  }

  ${candidates.length === 0
    ? `<p class="text-gray-500 text-xs">No more servers available to add.</p>`
    : `<form method="POST" action="/api/collections/${escHtml(collection.slug)}/servers" class="flex gap-2">
         <select name="server_id" required
           class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
           <option value="">Select a server to add...</option>
           ${candidates.map(c => `<option value="${escHtml(c.id)}">${escHtml(c.name)}</option>`).join('')}
         </select>
         <button type="submit"
           class="bg-brand hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
           Add
         </button>
       </form>`
  }
</div>`;
}
