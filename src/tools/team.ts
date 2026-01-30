/**
 * Team Tools
 *
 * MCP tools for Slack team/workspace operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all team-related tools
 */
export function registerTeamTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // Get Team Info
  // ===========================================================================
  server.tool(
    'slack_get_team_info',
    `Get information about the Slack workspace.

Args:
  - format: Response format

Returns: Team name, domain, icon, and enterprise info.`,
    {
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ format }) => {
      try {
        const team = await client.getTeamInfo();
        return formatResponse(team, format, 'team');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Billable Info
  // ===========================================================================
  server.tool(
    'slack_get_billable_info',
    `Get billing status for users in the workspace.

Args:
  - user_id: Optional specific user to check
  - format: Response format

Returns: Billing status for each user.`,
    {
      user_id: z.string().optional().describe('Specific user to check'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ user_id, format }) => {
      try {
        const info = await client.getBillableInfo(user_id);
        return formatResponse(info, format, 'billable_info');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
