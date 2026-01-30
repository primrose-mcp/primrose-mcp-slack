/**
 * Search Tools
 *
 * MCP tools for Slack search operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all search-related tools
 */
export function registerSearchTools(server: McpServer, client: SlackClient): void {
  // ===========================================================================
  // Search Messages
  // ===========================================================================
  server.tool(
    'slack_search_messages',
    `Search for messages in Slack.

Args:
  - query: Search query (supports Slack search modifiers like from:, in:, has:, etc.)
  - sort: Sort by 'score' (relevance) or 'timestamp'
  - sort_dir: Sort direction 'asc' or 'desc'
  - count: Number of results to return (1-100, default: 20)
  - highlight: Include highlighted search terms
  - format: Response format

Example queries:
  - "budget report" - Search for these words
  - "from:@john in:#general" - Messages from John in #general
  - "has:link after:2024-01-01" - Links posted after date`,
    {
      query: z.string().describe('Search query'),
      sort: z.enum(['score', 'timestamp']).default('timestamp'),
      sort_dir: z.enum(['asc', 'desc']).default('desc'),
      count: z.number().int().min(1).max(100).default(20),
      highlight: z.boolean().default(false),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ query, sort, sort_dir, count, highlight, format }) => {
      try {
        const result = await client.searchMessages({
          query,
          sort,
          sort_dir,
          limit: count,
          highlight,
        });
        return formatResponse(result, format, 'search_results');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Search Files
  // ===========================================================================
  server.tool(
    'slack_search_files',
    `Search for files in Slack.

Args:
  - query: Search query
  - sort: Sort by 'score' (relevance) or 'timestamp'
  - sort_dir: Sort direction 'asc' or 'desc'
  - count: Number of results (1-100, default: 20)
  - highlight: Include highlighted search terms
  - format: Response format

Example queries:
  - "Q4 report" - Search for files with these words
  - "type:pdf" - Only PDF files
  - "from:@jane type:image" - Images from Jane`,
    {
      query: z.string().describe('Search query'),
      sort: z.enum(['score', 'timestamp']).default('timestamp'),
      sort_dir: z.enum(['asc', 'desc']).default('desc'),
      count: z.number().int().min(1).max(100).default(20),
      highlight: z.boolean().default(false),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ query, sort, sort_dir, count, highlight, format }) => {
      try {
        const result = await client.searchFiles({
          query,
          sort,
          sort_dir,
          limit: count,
          highlight,
        });
        return formatResponse(result, format, 'search_results');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Search All
  // ===========================================================================
  server.tool(
    'slack_search_all',
    `Search for both messages and files in Slack.

Args:
  - query: Search query
  - sort: Sort by 'score' or 'timestamp'
  - sort_dir: Sort direction
  - count: Number of results per type (1-100, default: 20)
  - format: Response format

Returns: Both message and file results in one response.`,
    {
      query: z.string().describe('Search query'),
      sort: z.enum(['score', 'timestamp']).default('timestamp'),
      sort_dir: z.enum(['asc', 'desc']).default('desc'),
      count: z.number().int().min(1).max(100).default(20),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ query, sort, sort_dir, count, format }) => {
      try {
        const result = await client.searchAll({
          query,
          sort,
          sort_dir,
          limit: count,
        });
        return formatResponse(result, format, 'search_results');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
