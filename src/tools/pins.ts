/**
 * Pin Tools
 *
 * MCP tools for Slack pin operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all pin-related tools
 */
export function registerPinTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // Add Pin
  // ===========================================================================
  server.tool(
    'slack_add_pin',
    `Pin a message to a channel.

Args:
  - channel: Channel ID containing the message
  - timestamp: Timestamp of the message to pin

Pinned messages appear in the channel's pinned items.`,
    {
      channel: z.string().describe('Channel ID'),
      timestamp: z.string().describe('Message timestamp to pin'),
    },
    async ({ channel, timestamp }) => {
      try {
        await client.addPin(channel, timestamp);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Message pinned' },
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
  // Remove Pin
  // ===========================================================================
  server.tool(
    'slack_remove_pin',
    `Unpin a message from a channel.

Args:
  - channel: Channel ID
  - timestamp: Timestamp of the pinned message`,
    {
      channel: z.string().describe('Channel ID'),
      timestamp: z.string().describe('Message timestamp to unpin'),
    },
    async ({ channel, timestamp }) => {
      try {
        await client.removePin(channel, timestamp);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Message unpinned' },
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
  // List Pins
  // ===========================================================================
  server.tool(
    'slack_list_pins',
    `List all pinned items in a channel.

Args:
  - channel: Channel ID
  - format: Response format

Returns: List of pinned messages and files.`,
    {
      channel: z.string().describe('Channel ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ channel, format }) => {
      try {
        const pins = await client.listPins(channel);
        return formatResponse(pins, format, 'pins');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
