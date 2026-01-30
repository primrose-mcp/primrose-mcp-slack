/**
 * Conversation Tools
 *
 * MCP tools for Slack conversation/channel management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all conversation-related tools
 */
export function registerConversationTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // List Conversations
  // ===========================================================================
  server.tool(
    'slack_list_conversations',
    `List Slack channels and conversations with pagination.

Returns public channels, private channels, DMs, and group DMs based on the types parameter.

Args:
  - types: Comma-separated list of conversation types (public_channel, private_channel, mpim, im)
  - exclude_archived: Whether to exclude archived channels (default: true)
  - limit: Number of channels to return (1-100, default: 100)
  - cursor: Pagination cursor from previous response
  - format: Response format ('json' or 'markdown')`,
    {
      types: z
        .string()
        .default('public_channel,private_channel')
        .describe('Conversation types: public_channel, private_channel, mpim, im'),
      exclude_archived: z.boolean().default(true).describe('Exclude archived channels'),
      limit: z.number().int().min(1).max(100).default(100).describe('Number to return'),
      cursor: z.string().optional().describe('Pagination cursor'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ types, exclude_archived, limit, cursor, format }) => {
      try {
        const result = await client.listConversations({
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

  // ===========================================================================
  // Get Conversation Info
  // ===========================================================================
  server.tool(
    'slack_get_conversation_info',
    `Get detailed information about a specific Slack channel or conversation.

Args:
  - channel_id: The channel ID (e.g., C1234567890)
  - format: Response format ('json' or 'markdown')

Returns: Channel name, topic, purpose, member count, and metadata.`,
    {
      channel_id: z.string().describe('Channel ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ channel_id, format }) => {
      try {
        const conversation = await client.getConversationInfo(channel_id);
        return formatResponse(conversation, format, 'conversation');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Conversation History
  // ===========================================================================
  server.tool(
    'slack_get_conversation_history',
    `Fetch message history from a Slack channel or conversation.

Args:
  - channel_id: The channel ID
  - limit: Number of messages to return (1-100, default: 100)
  - cursor: Pagination cursor
  - oldest: Only messages after this Unix timestamp
  - latest: Only messages before this Unix timestamp
  - format: Response format

Returns: Array of messages with user, text, timestamp, reactions, and thread info.`,
    {
      channel_id: z.string().describe('Channel ID'),
      limit: z.number().int().min(1).max(100).default(100),
      cursor: z.string().optional(),
      oldest: z.string().optional().describe('Only messages after this Unix timestamp'),
      latest: z.string().optional().describe('Only messages before this Unix timestamp'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ channel_id, limit, cursor, oldest, latest, format }) => {
      try {
        const result = await client.getConversationHistory(channel_id, {
          limit,
          cursor,
          oldest,
          latest,
        });
        return formatResponse(result, format, 'messages');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Thread Replies
  // ===========================================================================
  server.tool(
    'slack_get_thread_replies',
    `Fetch replies in a message thread.

Args:
  - channel_id: The channel ID containing the thread
  - thread_ts: Timestamp of the parent message
  - limit: Number of replies to return (1-100, default: 100)
  - cursor: Pagination cursor
  - format: Response format

Returns: Array of messages in the thread, including the parent message.`,
    {
      channel_id: z.string().describe('Channel ID'),
      thread_ts: z.string().describe('Parent message timestamp'),
      limit: z.number().int().min(1).max(100).default(100),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ channel_id, thread_ts, limit, cursor, format }) => {
      try {
        const result = await client.getConversationReplies(channel_id, thread_ts, {
          limit,
          cursor,
        });
        return formatResponse(result, format, 'messages');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Conversation
  // ===========================================================================
  server.tool(
    'slack_create_conversation',
    `Create a new Slack channel.

Args:
  - name: Channel name (lowercase, no spaces, max 80 chars)
  - is_private: Whether to create a private channel (default: false)

Returns: The created channel object.`,
    {
      name: z
        .string()
        .max(80)
        .describe('Channel name (lowercase, hyphens, underscores only)'),
      is_private: z.boolean().default(false).describe('Create as private channel'),
    },
    async ({ name, is_private }) => {
      try {
        const conversation = await client.createConversation(name, is_private);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Channel created', channel: conversation },
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
  // Archive Conversation
  // ===========================================================================
  server.tool(
    'slack_archive_conversation',
    `Archive a Slack channel.

Args:
  - channel_id: The channel ID to archive

Note: Archived channels can be unarchived later.`,
    {
      channel_id: z.string().describe('Channel ID to archive'),
    },
    async ({ channel_id }) => {
      try {
        await client.archiveConversation(channel_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Channel ${channel_id} archived` },
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
  // Unarchive Conversation
  // ===========================================================================
  server.tool(
    'slack_unarchive_conversation',
    `Unarchive a Slack channel.

Args:
  - channel_id: The channel ID to unarchive`,
    {
      channel_id: z.string().describe('Channel ID to unarchive'),
    },
    async ({ channel_id }) => {
      try {
        await client.unarchiveConversation(channel_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Channel ${channel_id} unarchived` },
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
  // Rename Conversation
  // ===========================================================================
  server.tool(
    'slack_rename_conversation',
    `Rename a Slack channel.

Args:
  - channel_id: The channel ID to rename
  - name: New channel name`,
    {
      channel_id: z.string().describe('Channel ID'),
      name: z.string().max(80).describe('New channel name'),
    },
    async ({ channel_id, name }) => {
      try {
        const conversation = await client.renameConversation(channel_id, name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Channel renamed', channel: conversation },
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
  // Set Conversation Topic
  // ===========================================================================
  server.tool(
    'slack_set_conversation_topic',
    `Set the topic of a Slack channel.

Args:
  - channel_id: The channel ID
  - topic: New topic text`,
    {
      channel_id: z.string().describe('Channel ID'),
      topic: z.string().describe('New topic'),
    },
    async ({ channel_id, topic }) => {
      try {
        const conversation = await client.setConversationTopic(channel_id, topic);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Topic updated', channel: conversation },
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
  // Set Conversation Purpose
  // ===========================================================================
  server.tool(
    'slack_set_conversation_purpose',
    `Set the purpose/description of a Slack channel.

Args:
  - channel_id: The channel ID
  - purpose: New purpose text`,
    {
      channel_id: z.string().describe('Channel ID'),
      purpose: z.string().describe('New purpose'),
    },
    async ({ channel_id, purpose }) => {
      try {
        const conversation = await client.setConversationPurpose(channel_id, purpose);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Purpose updated', channel: conversation },
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
  // Invite to Conversation
  // ===========================================================================
  server.tool(
    'slack_invite_to_conversation',
    `Invite users to a Slack channel.

Args:
  - channel_id: The channel ID
  - user_ids: Comma-separated list of user IDs to invite`,
    {
      channel_id: z.string().describe('Channel ID'),
      user_ids: z.string().describe('Comma-separated user IDs'),
    },
    async ({ channel_id, user_ids }) => {
      try {
        const userIdList = user_ids.split(',').map((id) => id.trim());
        const conversation = await client.inviteToConversation(channel_id, userIdList);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Users invited', channel: conversation },
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
  // Kick from Conversation
  // ===========================================================================
  server.tool(
    'slack_kick_from_conversation',
    `Remove a user from a Slack channel.

Args:
  - channel_id: The channel ID
  - user_id: User ID to remove`,
    {
      channel_id: z.string().describe('Channel ID'),
      user_id: z.string().describe('User ID to remove'),
    },
    async ({ channel_id, user_id }) => {
      try {
        await client.kickFromConversation(channel_id, user_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `User ${user_id} removed from channel` },
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
  // Join Conversation
  // ===========================================================================
  server.tool(
    'slack_join_conversation',
    `Join a public Slack channel.

Args:
  - channel_id: The channel ID to join`,
    {
      channel_id: z.string().describe('Channel ID to join'),
    },
    async ({ channel_id }) => {
      try {
        const conversation = await client.joinConversation(channel_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Joined channel', channel: conversation },
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
  // Leave Conversation
  // ===========================================================================
  server.tool(
    'slack_leave_conversation',
    `Leave a Slack channel.

Args:
  - channel_id: The channel ID to leave`,
    {
      channel_id: z.string().describe('Channel ID to leave'),
    },
    async ({ channel_id }) => {
      try {
        await client.leaveConversation(channel_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Left channel ${channel_id}` },
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
  // Get Conversation Members
  // ===========================================================================
  server.tool(
    'slack_get_conversation_members',
    `Get list of members in a Slack channel.

Args:
  - channel_id: The channel ID
  - limit: Number of members to return (1-100, default: 100)
  - cursor: Pagination cursor
  - format: Response format`,
    {
      channel_id: z.string().describe('Channel ID'),
      limit: z.number().int().min(1).max(100).default(100),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ channel_id, limit, cursor, format }) => {
      try {
        const result = await client.getConversationMembers(channel_id, { limit, cursor });
        return formatResponse(result, format, 'members');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
