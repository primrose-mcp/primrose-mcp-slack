/**
 * Slack MCP Server - Main Entry Point
 *
 * This file sets up the MCP server using Cloudflare's Agents SDK.
 *
 * MULTI-TENANT ARCHITECTURE:
 * Tenant credentials (bot tokens, user tokens) are parsed from request headers,
 * allowing a single server deployment to serve multiple customers.
 *
 * Required Headers:
 * - X-Slack-Bot-Token: Bot OAuth token (xoxb-...)
 *
 * Optional Headers:
 * - X-Slack-User-Token: User OAuth token for user-level operations (xoxp-...)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { createSlackClient } from './client.js';
import {
  registerBookmarkTools,
  registerConversationTools,
  registerDndTools,
  registerEmojiTools,
  registerFileTools,
  registerMessageTools,
  registerPinTools,
  registerReactionTools,
  registerReminderTools,
  registerSearchTools,
  registerStarTools,
  registerTeamTools,
  registerUserGroupTools,
  registerUserTools,
} from './tools/index.js';
import {
  type Env,
  type TenantCredentials,
  parseTenantCredentials,
  validateCredentials,
} from './types/env.js';

// =============================================================================
// MCP Server Configuration
// =============================================================================

const SERVER_NAME = 'primrose-mcp-slack';
const SERVER_VERSION = '1.0.0';

// =============================================================================
// MCP Agent (Stateful - uses Durable Objects)
// =============================================================================

/**
 * McpAgent provides stateful MCP sessions backed by Durable Objects.
 * @deprecated For multi-tenant support, use stateless mode with per-request credentials
 */
export class SlackMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  async init() {
    throw new Error(
      'Stateful mode (McpAgent) is not supported for multi-tenant deployments. ' +
        'Use the stateless /mcp endpoint with X-Slack-Bot-Token header instead.'
    );
  }
}

// =============================================================================
// Stateless MCP Server (Recommended)
// =============================================================================

/**
 * Creates a stateless MCP server instance with tenant-specific credentials.
 */
function createStatelessServer(credentials: TenantCredentials): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  const client = createSlackClient(credentials);

  // Register all tool groups
  registerConversationTools(server, client);
  registerMessageTools(server, client);
  registerUserTools(server, client);
  registerFileTools(server, client);
  registerSearchTools(server, client);
  registerReactionTools(server, client);
  registerPinTools(server, client);
  registerStarTools(server, client);
  registerReminderTools(server, client);
  registerBookmarkTools(server, client);
  registerUserGroupTools(server, client);
  registerTeamTools(server, client);
  registerDndTools(server, client);
  registerEmojiTools(server, client);

  // Test connection tool
  server.tool(
    'slack_test_connection',
    'Test the connection to the Slack API. Returns authentication info if successful.',
    {},
    async () => {
      try {
        const result = await client.testConnection();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

// =============================================================================
// Worker Export
// =============================================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', server: SERVER_NAME }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // MCP endpoint (stateless, multi-tenant)
    if (url.pathname === '/mcp' && request.method === 'POST') {
      const credentials = parseTenantCredentials(request);

      try {
        validateCredentials(credentials);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Invalid credentials',
            required_headers: ['X-Slack-Bot-Token or X-Slack-User-Token'],
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const server = createStatelessServer(credentials);
      const { createMcpHandler } = await import('agents/mcp');
      const handler = createMcpHandler(server);
      return handler(request, env, ctx);
    }

    // SSE endpoint info
    if (url.pathname === '/sse') {
      return new Response('SSE endpoint requires Durable Objects. Enable in wrangler.jsonc.', {
        status: 501,
      });
    }

    // Default response with API info
    return new Response(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Multi-tenant Slack MCP Server',
        endpoints: {
          mcp: '/mcp (POST) - Streamable HTTP MCP endpoint',
          health: '/health - Health check',
        },
        authentication: {
          description: 'Pass Slack credentials via request headers',
          required_headers: {
            'X-Slack-Bot-Token': 'Bot OAuth token (xoxb-...)',
          },
          optional_headers: {
            'X-Slack-User-Token': 'User OAuth token for user-level operations (xoxp-...)',
          },
        },
        tools: {
          conversations: [
            'slack_list_conversations',
            'slack_get_conversation_info',
            'slack_get_conversation_history',
            'slack_get_thread_replies',
            'slack_create_conversation',
            'slack_archive_conversation',
            'slack_unarchive_conversation',
            'slack_rename_conversation',
            'slack_set_conversation_topic',
            'slack_set_conversation_purpose',
            'slack_invite_to_conversation',
            'slack_kick_from_conversation',
            'slack_join_conversation',
            'slack_leave_conversation',
            'slack_get_conversation_members',
          ],
          messages: [
            'slack_post_message',
            'slack_update_message',
            'slack_delete_message',
            'slack_schedule_message',
            'slack_delete_scheduled_message',
            'slack_list_scheduled_messages',
            'slack_get_permalink',
          ],
          users: [
            'slack_list_users',
            'slack_get_user_info',
            'slack_get_user_by_email',
            'slack_get_user_presence',
            'slack_set_presence',
            'slack_get_user_conversations',
          ],
          files: [
            'slack_list_files',
            'slack_get_file_info',
            'slack_delete_file',
            'slack_upload_file',
          ],
          search: ['slack_search_messages', 'slack_search_files', 'slack_search_all'],
          reactions: [
            'slack_add_reaction',
            'slack_remove_reaction',
            'slack_get_reactions',
            'slack_list_user_reactions',
          ],
          pins: ['slack_add_pin', 'slack_remove_pin', 'slack_list_pins'],
          stars: ['slack_add_star', 'slack_remove_star', 'slack_list_stars'],
          reminders: [
            'slack_add_reminder',
            'slack_complete_reminder',
            'slack_delete_reminder',
            'slack_get_reminder',
            'slack_list_reminders',
          ],
          bookmarks: [
            'slack_add_bookmark',
            'slack_edit_bookmark',
            'slack_remove_bookmark',
            'slack_list_bookmarks',
          ],
          usergroups: [
            'slack_list_usergroups',
            'slack_create_usergroup',
            'slack_update_usergroup',
            'slack_disable_usergroup',
            'slack_enable_usergroup',
            'slack_get_usergroup_members',
            'slack_update_usergroup_members',
          ],
          team: ['slack_get_team_info', 'slack_get_billable_info'],
          dnd: [
            'slack_get_dnd_info',
            'slack_set_dnd_snooze',
            'slack_end_dnd_snooze',
            'slack_end_dnd',
          ],
          emoji: ['slack_list_emoji'],
          connection: ['slack_test_connection'],
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
