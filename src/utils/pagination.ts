/**
 * Pagination Utilities for Slack MCP Server
 */

import type { PaginatedResponse, PaginationParams } from '../types/entities.js';

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  limit: 20,
  maxLimit: 100,
} as const;

/**
 * Normalize pagination parameters
 */
export function normalizePaginationParams(
  params?: PaginationParams,
  maxLimit = PAGINATION_DEFAULTS.maxLimit
): Required<Pick<PaginationParams, 'limit'>> & Omit<PaginationParams, 'limit'> {
  return {
    limit: Math.min(params?.limit || PAGINATION_DEFAULTS.limit, maxLimit),
    cursor: params?.cursor,
  };
}

/**
 * Create an empty paginated response
 */
export function emptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    items: [],
    count: 0,
    hasMore: false,
  };
}

/**
 * Create a paginated response from an array
 */
export function createPaginatedResponse<T>(
  items: T[],
  options: {
    hasMore?: boolean;
    nextCursor?: string;
  } = {}
): PaginatedResponse<T> {
  return {
    items,
    count: items.length,
    hasMore: options.hasMore ?? false,
    nextCursor: options.nextCursor,
  };
}
