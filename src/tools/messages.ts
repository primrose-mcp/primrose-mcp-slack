/**
 * Message Tools
 *
 * MCP tools for Slack message operations (chat.* methods).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all message-related tools
 */
export function registerMessageTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // Post Message
  // ===========================================================================
  server.tool(
    'slack_post_message',
    `Send a message to a Slack channel or conversation.

Args:
  - channel: Channel ID or name to post to
  - text: Message text (supports Slack markdown/mrkdwn)
  - thread_ts: Reply to a thread by providing parent message timestamp
  - reply_broadcast: Also post reply to the channel (default: false)
  - unfurl_links: Enable URL previews (default: true)
  - unfurl_media: Enable media previews (default: true)

Returns: The posted message object with timestamp.`,
    {
      channel: z.string().describe('Channel ID or name'),
      text: z.string().describe('Message text'),
      thread_ts: z.string().optional().describe('Thread parent timestamp for replies'),
      reply_broadcast: z.boolean().default(false).describe('Also post to channel'),
      unfurl_links: z.boolean().default(true).describe('Enable URL previews'),
      unfurl_media: z.boolean().default(true).describe('Enable media previews'),
    },
    async ({ channel, text, thread_ts, reply_broadcast, unfurl_links, unfurl_media }) => {
      try {
        const message = await client.postMessage({
          channel,
          text,
          thread_ts,
          reply_broadcast,
          unfurl_links,
          unfurl_media,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Message posted', data: message },
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
  // Update Message
  // ===========================================================================
  server.tool(
    'slack_update_message',
    `Update an existing Slack message.

Args:
  - channel: Channel ID containing the message
  - ts: Timestamp of the message to update
  - text: New message text

Note: You can only update messages posted by your app/bot.`,
    {
      channel: z.string().describe('Channel ID'),
      ts: z.string().describe('Message timestamp to update'),
      text: z.string().describe('New message text'),
    },
    async ({ channel, ts, text }) => {
      try {
        const message = await client.updateMessage({
          channel,
          ts,
          text,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Message updated', data: message },
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
  // Delete Message
  // ===========================================================================
  server.tool(
    'slack_delete_message',
    `Delete a Slack message.

Args:
  - channel: Channel ID containing the message
  - ts: Timestamp of the message to delete

Note: You can only delete messages posted by your app/bot.`,
    {
      channel: z.string().describe('Channel ID'),
      ts: z.string().describe('Message timestamp to delete'),
    },
    async ({ channel, ts }) => {
      try {
        await client.deleteMessage(channel, ts);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Message ${ts} deleted` },
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
  // Schedule Message
  // ===========================================================================
  server.tool(
    'slack_schedule_message',
    `Schedule a message to be sent at a future time.

Args:
  - channel: Channel ID to post to
  - text: Message text
  - post_at: Unix timestamp for when to send (up to 120 days in future)
  - thread_ts: Optional thread to reply to

Returns: Scheduled message ID that can be used to delete before sending.`,
    {
      channel: z.string().describe('Channel ID'),
      text: z.string().describe('Message text'),
      post_at: z.number().describe('Unix timestamp for when to send'),
      thread_ts: z.string().optional().describe('Thread parent timestamp'),
    },
    async ({ channel, text, post_at, thread_ts }) => {
      try {
        const scheduled = await client.scheduleMessage({
          channel,
          text,
          post_at,
          thread_ts,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Message scheduled', scheduled_message: scheduled },
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
  // Delete Scheduled Message
  // ===========================================================================
  server.tool(
    'slack_delete_scheduled_message',
    `Delete a scheduled message before it's sent.

Args:
  - channel: Channel ID the message was scheduled for
  - scheduled_message_id: The scheduled message ID`,
    {
      channel: z.string().describe('Channel ID'),
      scheduled_message_id: z.string().describe('Scheduled message ID'),
    },
    async ({ channel, scheduled_message_id }) => {
      try {
        await client.deleteScheduledMessage(channel, scheduled_message_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Scheduled message deleted' },
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
  // List Scheduled Messages
  // ===========================================================================
  server.tool(
    'slack_list_scheduled_messages',
    `List all scheduled messages.

Args:
  - channel: Optional channel ID to filter by
  - limit: Number of messages to return (1-100, default: 100)
  - cursor: Pagination cursor
  - format: Response format`,
    {
      channel: z.string().optional().describe('Filter by channel ID'),
      limit: z.number().int().min(1).max(100).default(100),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ channel, limit, cursor, format }) => {
      try {
        const result = await client.listScheduledMessages(channel, { limit, cursor });
        return formatResponse(result, format, 'scheduled_messages');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Permalink
  // ===========================================================================
  server.tool(
    'slack_get_permalink',
    `Get a permanent link to a specific message.

Args:
  - channel: Channel ID containing the message
  - message_ts: Timestamp of the message

Returns: A permalink URL that can be shared.`,
    {
      channel: z.string().describe('Channel ID'),
      message_ts: z.string().describe('Message timestamp'),
    },
    async ({ channel, message_ts }) => {
      try {
        const permalink = await client.getPermalink(channel, message_ts);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, permalink }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
