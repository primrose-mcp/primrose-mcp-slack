/**
 * Star Tools
 *
 * MCP tools for Slack star/save operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all star-related tools
 */
export function registerStarTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // Add Star
  // ===========================================================================
  server.tool(
    'slack_add_star',
    `Star (save) a message or file.

Args:
  - channel: Channel ID
  - timestamp: Message timestamp to star (optional if starring a file)
  - file_id: File ID to star (optional if starring a message)

Starred items appear in the user's saved items.`,
    {
      channel: z.string().describe('Channel ID'),
      timestamp: z.string().optional().describe('Message timestamp'),
      file_id: z.string().optional().describe('File ID'),
    },
    async ({ channel, timestamp, file_id }) => {
      try {
        await client.addStar(channel, timestamp, file_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Item starred' },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Remove Star
  // ===========================================================================
  server.tool(
    'slack_remove_star',
    `Remove star from a message or file.

Args:
  - channel: Channel ID
  - timestamp: Message timestamp (optional if unstarring a file)
  - file_id: File ID (optional if unstarring a message)`,
    {
      channel: z.string().describe('Channel ID'),
      timestamp: z.string().optional().describe('Message timestamp'),
      file_id: z.string().optional().describe('File ID'),
    },
    async ({ channel, timestamp, file_id }) => {
      try {
        await client.removeStar(channel, timestamp, file_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Star removed' },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Stars
  // ===========================================================================
  server.tool(
    'slack_list_stars',
    `List starred items for the authenticated user.

Args:
  - limit: Number of items to return (1-100, default: 100)
  - format: Response format

Returns: List of starred messages, files, and channels.`,
    {
      limit: z.number().int().min(1).max(100).default(100),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ limit, format }) => {
      try {
        const result = await client.listStars({ limit });
        return formatResponse(result, format, 'stars');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
