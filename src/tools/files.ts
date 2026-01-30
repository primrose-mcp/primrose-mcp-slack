/**
 * File Tools
 *
 * MCP tools for Slack file operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all file-related tools
 */
export function registerFileTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // List Files
  // ===========================================================================
  server.tool(
    'slack_list_files',
    `List files shared in the workspace.

Args:
  - channel: Filter by channel ID
  - user: Filter by user ID
  - types: Filter by file types (comma-separated: images, zips, pdfs, etc.)
  - ts_from: Files uploaded after this Unix timestamp
  - ts_to: Files uploaded before this Unix timestamp
  - limit: Number of files to return (1-100, default: 100)
  - format: Response format`,
    {
      channel: z.string().optional().describe('Filter by channel'),
      user: z.string().optional().describe('Filter by user'),
      types: z.string().optional().describe('Filter by file types'),
      ts_from: z.number().optional().describe('Files after this timestamp'),
      ts_to: z.number().optional().describe('Files before this timestamp'),
      limit: z.number().int().min(1).max(100).default(100),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ channel, user, types, ts_from, ts_to, limit, format }) => {
      try {
        const result = await client.listFiles({
          channel,
          user,
          types,
          ts_from,
          ts_to,
          limit,
        });
        return formatResponse(result, format, 'files');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get File Info
  // ===========================================================================
  server.tool(
    'slack_get_file_info',
    `Get detailed information about a specific file.

Args:
  - file_id: The file ID
  - format: Response format

Returns: File metadata, sharing info, and preview data.`,
    {
      file_id: z.string().describe('File ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ file_id, format }) => {
      try {
        const file = await client.getFileInfo(file_id);
        return formatResponse(file, format, 'file');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete File
  // ===========================================================================
  server.tool(
    'slack_delete_file',
    `Delete a file from Slack.

Args:
  - file_id: The file ID to delete

Note: You can only delete files uploaded by your app.`,
    {
      file_id: z.string().describe('File ID to delete'),
    },
    async ({ file_id }) => {
      try {
        await client.deleteFile(file_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `File ${file_id} deleted` },
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
  // Upload File
  // ===========================================================================
  server.tool(
    'slack_upload_file',
    `Upload a file to Slack.

Args:
  - channels: Channel ID to share the file to
  - content: Text content of the file
  - filename: Name of the file
  - title: Optional title for the file
  - initial_comment: Optional comment to post with the file
  - thread_ts: Optional thread to post in

Returns: The uploaded file object.`,
    {
      channels: z.string().describe('Channel ID to share to'),
      content: z.string().describe('File content (text)'),
      filename: z.string().describe('Filename'),
      title: z.string().optional().describe('File title'),
      initial_comment: z.string().optional().describe('Comment to post with file'),
      thread_ts: z.string().optional().describe('Thread timestamp'),
    },
    async ({ channels, content, filename, title, initial_comment, thread_ts }) => {
      try {
        const file = await client.uploadFile(
          channels,
          content,
          filename,
          title,
          initial_comment,
          thread_ts
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'File uploaded', file },
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
