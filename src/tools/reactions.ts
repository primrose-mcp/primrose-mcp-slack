/**
 * Reaction Tools
 *
 * MCP tools for Slack emoji reaction operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all reaction-related tools
 */
export function registerReactionTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // Add Reaction
  // ===========================================================================
  server.tool(
    'slack_add_reaction',
    `Add an emoji reaction to a message.

Args:
  - channel: Channel ID containing the message
  - timestamp: Timestamp of the message to react to
  - name: Emoji name without colons (e.g., 'thumbsup', 'heart')`,
    {
      channel: z.string().describe('Channel ID'),
      timestamp: z.string().describe('Message timestamp'),
      name: z.string().describe('Emoji name without colons'),
    },
    async ({ channel, timestamp, name }) => {
      try {
        await client.addReaction(channel, timestamp, name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Reaction :${name}: added` },
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
  // Remove Reaction
  // ===========================================================================
  server.tool(
    'slack_remove_reaction',
    `Remove an emoji reaction from a message.

Args:
  - channel: Channel ID containing the message
  - timestamp: Timestamp of the message
  - name: Emoji name to remove`,
    {
      channel: z.string().describe('Channel ID'),
      timestamp: z.string().describe('Message timestamp'),
      name: z.string().describe('Emoji name without colons'),
    },
    async ({ channel, timestamp, name }) => {
      try {
        await client.removeReaction(channel, timestamp, name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Reaction :${name}: removed` },
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
  // Get Reactions
  // ===========================================================================
  server.tool(
    'slack_get_reactions',
    `Get all reactions on a specific message.

Args:
  - channel: Channel ID containing the message
  - timestamp: Timestamp of the message
  - format: Response format

Returns: Message with all reactions and who reacted.`,
    {
      channel: z.string().describe('Channel ID'),
      timestamp: z.string().describe('Message timestamp'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ channel, timestamp, format }) => {
      try {
        const result = await client.getReactions(channel, timestamp);
        return formatResponse(result, format, 'reactions');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List User Reactions
  // ===========================================================================
  server.tool(
    'slack_list_user_reactions',
    `List items a user has reacted to.

Args:
  - user_id: Optional user ID (defaults to authenticated user)
  - limit: Number of items to return (1-100, default: 100)
  - format: Response format`,
    {
      user_id: z.string().optional().describe('User ID'),
      limit: z.number().int().min(1).max(100).default(100),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ user_id, limit, format }) => {
      try {
        const result = await client.listUserReactions(user_id, { limit });
        return formatResponse(result, format, 'reactions');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
