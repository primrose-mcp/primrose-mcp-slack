/**
 * DND (Do Not Disturb) Tools
 *
 * MCP tools for Slack Do Not Disturb operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all DND-related tools
 */
export function registerDndTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // Get DND Info
  // ===========================================================================
  server.tool(
    'slack_get_dnd_info',
    `Get Do Not Disturb status for a user.

Args:
  - user_id: Optional user ID (defaults to authenticated user)
  - format: Response format

Returns: DND status, snooze info, and scheduled DND times.`,
    {
      user_id: z.string().optional().describe('User ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ user_id, format }) => {
      try {
        const info = await client.getDndInfo(user_id);
        return formatResponse(info, format, 'dnd_info');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Set DND Snooze
  // ===========================================================================
  server.tool(
    'slack_set_dnd_snooze',
    `Turn on Do Not Disturb for a specified duration.

Args:
  - num_minutes: Number of minutes to snooze

Temporarily silences notifications.`,
    {
      num_minutes: z.number().int().min(1).describe('Minutes to snooze'),
    },
    async ({ num_minutes }) => {
      try {
        const status = await client.setDndSnooze(num_minutes);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `DND enabled for ${num_minutes} minutes`, status },
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
  // End DND Snooze
  // ===========================================================================
  server.tool(
    'slack_end_dnd_snooze',
    `Turn off Do Not Disturb snooze early.

Ends snooze immediately and returns to normal notification status.`,
    {},
    async () => {
      try {
        const status = await client.endDndSnooze();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'DND snooze ended', status },
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
  // End DND
  // ===========================================================================
  server.tool(
    'slack_end_dnd',
    `End Do Not Disturb mode completely.

Ends all DND settings and returns to normal status.`,
    {},
    async () => {
      try {
        await client.endDnd();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'DND ended' },
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
}
