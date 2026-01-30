/**
 * Reminder Tools
 *
 * MCP tools for Slack reminder operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all reminder-related tools
 */
export function registerReminderTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // Add Reminder
  // ===========================================================================
  server.tool(
    'slack_add_reminder',
    `Create a new reminder.

Args:
  - text: Reminder text
  - time: When to send reminder - Unix timestamp, or natural language like "in 20 minutes", "tomorrow at 9am"
  - user_id: Optional user to remind (defaults to authenticated user)

Returns: The created reminder object.`,
    {
      text: z.string().describe('Reminder text'),
      time: z.union([z.string(), z.number()]).describe('When to remind'),
      user_id: z.string().optional().describe('User to remind'),
    },
    async ({ text, time, user_id }) => {
      try {
        const reminder = await client.addReminder(text, time, user_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Reminder created', reminder },
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
  // Complete Reminder
  // ===========================================================================
  server.tool(
    'slack_complete_reminder',
    `Mark a reminder as complete.

Args:
  - reminder_id: The reminder ID`,
    {
      reminder_id: z.string().describe('Reminder ID'),
    },
    async ({ reminder_id }) => {
      try {
        await client.completeReminder(reminder_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Reminder completed' },
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
  // Delete Reminder
  // ===========================================================================
  server.tool(
    'slack_delete_reminder',
    `Delete a reminder.

Args:
  - reminder_id: The reminder ID`,
    {
      reminder_id: z.string().describe('Reminder ID'),
    },
    async ({ reminder_id }) => {
      try {
        await client.deleteReminder(reminder_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Reminder deleted' },
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
  // Get Reminder
  // ===========================================================================
  server.tool(
    'slack_get_reminder',
    `Get details about a specific reminder.

Args:
  - reminder_id: The reminder ID
  - format: Response format`,
    {
      reminder_id: z.string().describe('Reminder ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ reminder_id, format }) => {
      try {
        const reminder = await client.getReminder(reminder_id);
        return formatResponse(reminder, format, 'reminder');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Reminders
  // ===========================================================================
  server.tool(
    'slack_list_reminders',
    `List all reminders for the authenticated user.

Args:
  - format: Response format

Returns: List of all reminders.`,
    {
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ format }) => {
      try {
        const reminders = await client.listReminders();
        return formatResponse({ items: reminders, count: reminders.length, hasMore: false }, format, 'reminders');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
