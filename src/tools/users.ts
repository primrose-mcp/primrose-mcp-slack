/**
 * User Tools
 *
 * MCP tools for Slack user operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all user-related tools
 */
export function registerUserTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // List Users
  // ===========================================================================
  server.tool(
    'slack_list_users',
    `List all users in the Slack workspace.

Args:
  - limit: Number of users to return (1-100, default: 100)
  - cursor: Pagination cursor from previous response
  - format: Response format ('json' or 'markdown')

Returns: User objects with profile info, status, and metadata.`,
    {
      limit: z.number().int().min(1).max(100).default(100),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ limit, cursor, format }) => {
      try {
        const result = await client.listUsers({ limit, cursor });
        return formatResponse(result, format, 'users');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get User Info
  // ===========================================================================
  server.tool(
    'slack_get_user_info',
    `Get detailed information about a specific user.

Args:
  - user_id: The user ID (e.g., U1234567890)
  - format: Response format

Returns: User profile, status, timezone, admin status, and more.`,
    {
      user_id: z.string().describe('User ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ user_id, format }) => {
      try {
        const user = await client.getUserInfo(user_id);
        return formatResponse(user, format, 'user');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get User by Email
  // ===========================================================================
  server.tool(
    'slack_get_user_by_email',
    `Find a user by their email address.

Args:
  - email: The user's email address
  - format: Response format

Returns: User object if found.`,
    {
      email: z.string().email().describe('Email address'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ email, format }) => {
      try {
        const user = await client.getUserByEmail(email);
        return formatResponse(user, format, 'user');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get User Presence
  // ===========================================================================
  server.tool(
    'slack_get_user_presence',
    `Get the online/away status of a user.

Args:
  - user_id: The user ID

Returns: Presence status (active/away) and connection info.`,
    {
      user_id: z.string().describe('User ID'),
    },
    async ({ user_id }) => {
      try {
        const presence = await client.getUserPresence(user_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(presence, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Set User Presence
  // ===========================================================================
  server.tool(
    'slack_set_presence',
    `Set the bot's presence status.

Args:
  - presence: 'auto' (based on connection) or 'away'`,
    {
      presence: z.enum(['auto', 'away']).describe('Presence to set'),
    },
    async ({ presence }) => {
      try {
        await client.setUserPresence(presence);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Presence set to ${presence}` },
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
  // Get User Conversations
  // ===========================================================================
  server.tool(
    'slack_get_user_conversations',
    `List conversations a user is a member of.

Args:
  - user_id: Optional user ID (defaults to authenticated user)
  - types: Conversation types to include
  - exclude_archived: Exclude archived channels
  - limit: Number to return (1-100, default: 100)
  - cursor: Pagination cursor
  - format: Response format`,
    {
      user_id: z.string().optional().describe('User ID (default: current user)'),
      types: z.string().default('public_channel,private_channel,mpim,im'),
      exclude_archived: z.boolean().default(true),
      limit: z.number().int().min(1).max(100).default(100),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ user_id, types, exclude_archived, limit, cursor, format }) => {
      try {
        const result = await client.getUserConversations(user_id, {
          types,
          exclude_archived,
          limit,
          cursor,
        });
        return formatResponse(result, format, 'conversations');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
