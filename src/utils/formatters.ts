/**
 * Response Formatting Utilities for Slack MCP Server
 */

import type {
  Bookmark,
  Conversation,
  Message,
  PaginatedResponse,
  Reminder,
  ResponseFormat,
  SlackFile,
  User,
  UserGroup,
} from '../types/entities.js';
import { type SlackApiError, formatErrorForLogging } from './errors.js';

/**
 * MCP tool response type
 */
export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Format a successful response
 */
export function formatResponse(
  data: unknown,
  format: ResponseFormat,
  entityType: string
): ToolResponse {
  if (format === 'markdown') {
    return {
      content: [{ type: 'text', text: formatAsMarkdown(data, entityType) }],
    };
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error response
 */
export function formatError(error: unknown): ToolResponse {
  const errorInfo = formatErrorForLogging(error);

  let message: string;
  if ((error as SlackApiError).code) {
    message = `Error: ${(error as Error).message}`;
    if ((error as SlackApiError).retryable) {
      message += ' (retryable)';
    }
  } else if (error instanceof Error) {
    message = `Error: ${error.message}`;
  } else {
    message = `Error: ${String(error)}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, details: errorInfo }, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Format data as Markdown
 */
function formatAsMarkdown(data: unknown, entityType: string): string {
  if (isPaginatedResponse(data)) {
    return formatPaginatedAsMarkdown(data, entityType);
  }

  if (Array.isArray(data)) {
    return formatArrayAsMarkdown(data, entityType);
  }

  if (typeof data === 'object' && data !== null) {
    return formatObjectAsMarkdown(data as Record<string, unknown>, entityType);
  }

  return String(data);
}

/**
 * Type guard for paginated response
 */
function isPaginatedResponse(data: unknown): data is PaginatedResponse<unknown> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as PaginatedResponse<unknown>).items)
  );
}

/**
 * Format paginated response as Markdown
 */
function formatPaginatedAsMarkdown(data: PaginatedResponse<unknown>, entityType: string): string {
  const lines: string[] = [];

  lines.push(`## ${capitalize(entityType)}`);
  lines.push('');
  lines.push(`**Showing:** ${data.count}`);

  if (data.hasMore) {
    lines.push(`**More available:** Yes (cursor: \`${data.nextCursor}\`)`);
  }
  lines.push('');

  if (data.items.length === 0) {
    lines.push('_No items found._');
    return lines.join('\n');
  }

  switch (entityType) {
    case 'conversations':
    case 'channels':
      lines.push(formatConversationsTable(data.items as Conversation[]));
      break;
    case 'messages':
      lines.push(formatMessagesTable(data.items as Message[]));
      break;
    case 'users':
      lines.push(formatUsersTable(data.items as User[]));
      break;
    case 'files':
      lines.push(formatFilesTable(data.items as SlackFile[]));
      break;
    case 'reminders':
      lines.push(formatRemindersTable(data.items as Reminder[]));
      break;
    case 'bookmarks':
      lines.push(formatBookmarksTable(data.items as Bookmark[]));
      break;
    case 'usergroups':
      lines.push(formatUserGroupsTable(data.items as UserGroup[]));
      break;
    default:
      lines.push(formatGenericTable(data.items));
  }

  return lines.join('\n');
}

/**
 * Format conversations as Markdown table
 */
function formatConversationsTable(conversations: Conversation[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Type | Members | Private |');
  lines.push('|---|---|---|---|---|');

  for (const conv of conversations) {
    const type = conv.is_im
      ? 'DM'
      : conv.is_mpim
        ? 'Group DM'
        : conv.is_private
          ? 'Private Channel'
          : 'Public Channel';
    lines.push(
      `| ${conv.id} | ${conv.name || 'DM'} | ${type} | ${conv.num_members || '-'} | ${conv.is_private ? 'Yes' : 'No'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format messages as Markdown table
 */
function formatMessagesTable(messages: Message[]): string {
  const lines: string[] = [];
  lines.push('| Timestamp | User | Text | Replies |');
  lines.push('|---|---|---|---|');

  for (const msg of messages) {
    const text = (msg.text || '').substring(0, 50) + ((msg.text?.length || 0) > 50 ? '...' : '');
    lines.push(
      `| ${msg.ts} | ${msg.user || msg.bot_id || '-'} | ${text.replace(/\|/g, '\\|')} | ${msg.reply_count || 0} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format users as Markdown table
 */
function formatUsersTable(users: User[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Real Name | Email | Bot |');
  lines.push('|---|---|---|---|---|');

  for (const user of users) {
    lines.push(
      `| ${user.id} | ${user.name} | ${user.real_name || '-'} | ${user.profile.email || '-'} | ${user.is_bot ? 'Yes' : 'No'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format files as Markdown table
 */
function formatFilesTable(files: SlackFile[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Type | Size | Created |');
  lines.push('|---|---|---|---|---|');

  for (const file of files) {
    const size = file.size ? `${Math.round(file.size / 1024)}KB` : '-';
    const created = file.created ? new Date(file.created * 1000).toISOString() : '-';
    lines.push(
      `| ${file.id} | ${file.name || file.title || '-'} | ${file.filetype || '-'} | ${size} | ${created} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format reminders as Markdown table
 */
function formatRemindersTable(reminders: Reminder[]): string {
  const lines: string[] = [];
  lines.push('| ID | Text | Time | Recurring | Complete |');
  lines.push('|---|---|---|---|---|');

  for (const reminder of reminders) {
    const time = reminder.time ? new Date(reminder.time * 1000).toISOString() : '-';
    const complete = reminder.complete_ts ? 'Yes' : 'No';
    lines.push(
      `| ${reminder.id} | ${reminder.text.substring(0, 30)} | ${time} | ${reminder.recurring ? 'Yes' : 'No'} | ${complete} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format bookmarks as Markdown table
 */
function formatBookmarksTable(bookmarks: Bookmark[]): string {
  const lines: string[] = [];
  lines.push('| ID | Title | Type | Link |');
  lines.push('|---|---|---|---|');

  for (const bookmark of bookmarks) {
    lines.push(
      `| ${bookmark.id} | ${bookmark.title} | ${bookmark.type} | ${bookmark.link || '-'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format user groups as Markdown table
 */
function formatUserGroupsTable(groups: UserGroup[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Handle | Users |');
  lines.push('|---|---|---|---|');

  for (const group of groups) {
    lines.push(`| ${group.id} | ${group.name} | @${group.handle} | ${group.user_count || '-'} |`);
  }

  return lines.join('\n');
}

/**
 * Format a generic array as Markdown table
 */
function formatGenericTable(items: unknown[]): string {
  if (items.length === 0) return '_No items_';

  const first = items[0] as Record<string, unknown>;
  const keys = Object.keys(first).slice(0, 5);

  const lines: string[] = [];
  lines.push(`| ${keys.join(' | ')} |`);
  lines.push(`|${keys.map(() => '---').join('|')}|`);

  for (const item of items) {
    const record = item as Record<string, unknown>;
    const values = keys.map((k) => String(record[k] ?? '-'));
    lines.push(`| ${values.join(' | ')} |`);
  }

  return lines.join('\n');
}

/**
 * Format an array as Markdown
 */
function formatArrayAsMarkdown(data: unknown[], entityType: string): string {
  return formatGenericTable(data);
}

/**
 * Format a single object as Markdown
 */
function formatObjectAsMarkdown(data: Record<string, unknown>, entityType: string): string {
  const lines: string[] = [];
  lines.push(`## ${capitalize(entityType.replace(/s$/, ''))}`);
  lines.push('');

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object') {
      lines.push(`**${formatKey(key)}:**`);
      lines.push('```json');
      lines.push(JSON.stringify(value, null, 2));
      lines.push('```');
    } else {
      lines.push(`**${formatKey(key)}:** ${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a key for display (snake_case to Title Case)
 */
function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}
