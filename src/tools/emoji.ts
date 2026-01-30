/**
 * Emoji Tools
 *
 * MCP tools for Slack emoji operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all emoji-related tools
 */
export function registerEmojiTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // List Emoji
  // ===========================================================================
  server.tool(
    'slack_list_emoji',
    `List all custom emoji in the workspace.

Args:
  - format: Response format

Returns: Map of custom emoji names to their URLs/aliases.`,
    {
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ format }) => {
      try {
        const emoji = await client.listEmoji();
        return formatResponse(emoji, format, 'emoji');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
