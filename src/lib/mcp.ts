export type McpClient = 'claude-desktop' | 'cursor';

export const CLIENT_LABELS: Record<McpClient, string> = {
  'claude-desktop': 'Claude Desktop',
  cursor: 'Cursor',
};

export const CLIENT_PATHS: Record<McpClient, string> = {
  'claude-desktop': '~/Library/Application Support/Claude/claude_desktop_config.json (macOS) · %APPDATA%\\Claude\\claude_desktop_config.json (Windows)',
  cursor: '~/.cursor/mcp.json',
};

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'server';
}

function parseInstallCommand(cmd: string): { command: string; args: string[] } {
  const tokens = cmd.trim().split(/\s+/);
  const command = tokens[0] ?? '';
  const args = tokens.slice(1);
  return { command, args };
}

export function buildConfigSnippet(serverName: string, installCommand: string): object {
  const { command, args } = parseInstallCommand(installCommand);
  return {
    mcpServers: {
      [slugify(serverName)]: { command, args },
    },
  };
}
