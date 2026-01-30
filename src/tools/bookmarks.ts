/**
 * Bookmark Tools
 *
 * MCP tools for Slack channel bookmark operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all bookmark-related tools
 */
export function registerBookmarkTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // Add Bookmark
  // ===========================================================================
  server.tool(
    'slack_add_bookmark',
    `Add a bookmark to a channel.

Args:
  - channel_id: Channel ID to add bookmark to
  - title: Bookmark title
  - type: 'link' or 'folder'
  - link: URL for link bookmarks
  - emoji: Optional emoji for the bookmark

Bookmarks appear at the top of the channel.`,
    {
      channel_id: z.string().describe('Channel ID'),
      title: z.string().describe('Bookmark title'),
      type: z.enum(['link', 'folder']).default('link'),
      link: z.string().optional().describe('URL for link bookmarks'),
      emoji: z.string().optional().describe('Emoji for the bookmark'),
    },
    async ({ channel_id, title, type, link, emoji }) => {
      try {
        const bookmark = await client.addBookmark(channel_id, title, type, link, emoji);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Bookmark added', bookmark },
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
  // Edit Bookmark
  // ===========================================================================
  server.tool(
    'slack_edit_bookmark',
    `Edit an existing bookmark.

Args:
  - channel_id: Channel ID containing the bookmark
  - bookmark_id: Bookmark ID to edit
  - title: New title (optional)
  - link: New URL (optional)
  - emoji: New emoji (optional)`,
    {
      channel_id: z.string().describe('Channel ID'),
      bookmark_id: z.string().describe('Bookmark ID'),
      title: z.string().optional().describe('New title'),
      link: z.string().optional().describe('New URL'),
      emoji: z.string().optional().describe('New emoji'),
    },
    async ({ channel_id, bookmark_id, title, link, emoji }) => {
      try {
        const bookmark = await client.editBookmark(channel_id, bookmark_id, {
          title,
          link,
          emoji,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Bookmark updated', bookmark },
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
  // Remove Bookmark
  // ===========================================================================
  server.tool(
    'slack_remove_bookmark',
    `Remove a bookmark from a channel.

Args:
  - channel_id: Channel ID
  - bookmark_id: Bookmark ID to remove`,
    {
      channel_id: z.string().describe('Channel ID'),
      bookmark_id: z.string().describe('Bookmark ID'),
    },
    async ({ channel_id, bookmark_id }) => {
      try {
        await client.removeBookmark(channel_id, bookmark_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Bookmark removed' },
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
  // List Bookmarks
  // ===========================================================================
  server.tool(
    'slack_list_bookmarks',
    `List all bookmarks in a channel.

Args:
  - channel_id: Channel ID
  - format: Response format

Returns: List of bookmarks in the channel.`,
    {
      channel_id: z.string().describe('Channel ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ channel_id, format }) => {
      try {
        const bookmarks = await client.listBookmarks(channel_id);
        return formatResponse(
          { items: bookmarks, count: bookmarks.length, hasMore: false },
          format,
          'bookmarks'
        );
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
