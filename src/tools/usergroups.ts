/**
 * User Group Tools
 *
 * MCP tools for Slack user group operations (mentions like @engineering).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all user group-related tools
 */
export function registerUserGroupTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // List User Groups
  // ===========================================================================
  server.tool(
    'slack_list_usergroups',
    `List all user groups in the workspace.

Args:
  - include_users: Include user IDs in each group
  - include_disabled: Include disabled groups
  - format: Response format

Returns: List of user groups with handles and member counts.`,
    {
      include_users: z.boolean().default(false),
      include_disabled: z.boolean().default(false),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ include_users, include_disabled, format }) => {
      try {
        const groups = await client.listUserGroups(include_users, include_disabled);
        return formatResponse(
          { items: groups, count: groups.length, hasMore: false },
          format,
          'usergroups'
        );
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create User Group
  // ===========================================================================
  server.tool(
    'slack_create_usergroup',
    `Create a new user group.

Args:
  - name: Display name for the group
  - handle: Mention handle (without @)
  - description: Optional description
  - channels: Optional comma-separated channel IDs for default channels

Returns: The created user group.`,
    {
      name: z.string().describe('Group display name'),
      handle: z.string().optional().describe('Mention handle'),
      description: z.string().optional().describe('Description'),
      channels: z.string().optional().describe('Default channel IDs'),
    },
    async ({ name, handle, description, channels }) => {
      try {
        const channelList = channels?.split(',').map((c) => c.trim());
        const group = await client.createUserGroup(name, handle, description, channelList);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'User group created', usergroup: group },
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
  // Update User Group
  // ===========================================================================
  server.tool(
    'slack_update_usergroup',
    `Update an existing user group.

Args:
  - usergroup_id: User group ID
  - name: New display name (optional)
  - handle: New mention handle (optional)
  - description: New description (optional)
  - channels: New default channel IDs (optional)`,
    {
      usergroup_id: z.string().describe('User group ID'),
      name: z.string().optional(),
      handle: z.string().optional(),
      description: z.string().optional(),
      channels: z.string().optional(),
    },
    async ({ usergroup_id, name, handle, description, channels }) => {
      try {
        const channelList = channels?.split(',').map((c) => c.trim());
        const group = await client.updateUserGroup(usergroup_id, {
          name,
          handle,
          description,
          channels: channelList,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'User group updated', usergroup: group },
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
  // Disable User Group
  // ===========================================================================
  server.tool(
    'slack_disable_usergroup',
    `Disable a user group.

Args:
  - usergroup_id: User group ID to disable`,
    {
      usergroup_id: z.string().describe('User group ID'),
    },
    async ({ usergroup_id }) => {
      try {
        const group = await client.disableUserGroup(usergroup_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'User group disabled', usergroup: group },
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
  // Enable User Group
  // ===========================================================================
  server.tool(
    'slack_enable_usergroup',
    `Enable a disabled user group.

Args:
  - usergroup_id: User group ID to enable`,
    {
      usergroup_id: z.string().describe('User group ID'),
    },
    async ({ usergroup_id }) => {
      try {
        const group = await client.enableUserGroup(usergroup_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'User group enabled', usergroup: group },
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
  // Get User Group Members
  // ===========================================================================
  server.tool(
    'slack_get_usergroup_members',
    `Get list of users in a user group.

Args:
  - usergroup_id: User group ID

Returns: List of user IDs.`,
    {
      usergroup_id: z.string().describe('User group ID'),
    },
    async ({ usergroup_id }) => {
      try {
        const members = await client.getUserGroupMembers(usergroup_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, members }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update User Group Members
  // ===========================================================================
  server.tool(
    'slack_update_usergroup_members',
    `Replace all members of a user group.

Args:
  - usergroup_id: User group ID
  - user_ids: Comma-separated list of user IDs

Note: This replaces all existing members.`,
    {
      usergroup_id: z.string().describe('User group ID'),
      user_ids: z.string().describe('Comma-separated user IDs'),
    },
    async ({ usergroup_id, user_ids }) => {
      try {
        const userList = user_ids.split(',').map((u) => u.trim());
        const group = await client.updateUserGroupMembers(usergroup_id, userList);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Members updated', usergroup: group },
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
