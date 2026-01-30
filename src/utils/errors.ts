/**
 * Error Handling Utilities for Slack MCP Server
 */

/**
 * Base Slack API error
 */
export class SlackApiError extends Error {
  public statusCode?: number;
  public code: string;
  public retryable: boolean;

  constructor(message: string, code?: string, statusCode?: number, retryable = false) {
    super(message);
    this.name = 'SlackApiError';
    this.code = code || 'SLACK_ERROR';
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends SlackApiError {
  public retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message, 'RATE_LIMITED', 429, true);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends SlackApiError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_FAILED', 401, false);
    this.name = 'AuthenticationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends SlackApiError {
  constructor(entityType: string, id: string) {
    super(`${entityType} with ID '${id}' not found`, 'NOT_FOUND', 404, false);
    this.name = 'NotFoundError';
  }
}

/**
 * Permission error
 */
export class PermissionError extends SlackApiError {
  constructor(message: string) {
    super(message, 'MISSING_SCOPE', 403, false);
    this.name = 'PermissionError';
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof SlackApiError) {
    return error.retryable;
  }
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNRESET')
    );
  }
  return false;
}

/**
 * Format an error for logging
 */
export function formatErrorForLogging(error: unknown): Record<string, unknown> {
  if (error instanceof SlackApiError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      retryable: error.retryable,
      ...(error instanceof RateLimitError && { retryAfterSeconds: error.retryAfterSeconds }),
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { error: String(error) };
}

/**
 * Map Slack API error codes to appropriate error classes
 */
export function mapSlackError(errorCode: string, message?: string): SlackApiError {
  const errorMessage = message || `Slack API error: ${errorCode}`;

  switch (errorCode) {
    case 'invalid_auth':
    case 'not_authed':
    case 'account_inactive':
    case 'token_revoked':
    case 'token_expired':
      return new AuthenticationError(errorMessage);

    case 'missing_scope':
    case 'not_allowed_token_type':
    case 'ekm_access_denied':
    case 'restricted_action':
      return new PermissionError(errorMessage);

    case 'channel_not_found':
    case 'user_not_found':
    case 'file_not_found':
    case 'message_not_found':
      return new NotFoundError('resource', errorCode);

    case 'ratelimited':
      return new RateLimitError(errorMessage, 60);

    default:
      return new SlackApiError(errorMessage, errorCode);
  }
}
