/**
 * Environment Bindings for Slack MCP Server
 *
 * MULTI-TENANT ARCHITECTURE:
 * This server supports multiple tenants. Tenant-specific credentials (bot tokens,
 * user tokens, etc.) are passed via request headers, NOT stored in wrangler
 * secrets. This allows a single server instance to serve multiple customers.
 *
 * Request Headers:
 * - X-Slack-Bot-Token: Bot OAuth token (xoxb-...)
 * - X-Slack-User-Token: User OAuth token for user-level operations (xoxp-...)
 */

// =============================================================================
// Tenant Credentials (parsed from request headers)
// =============================================================================

export interface TenantCredentials {
  /** Bot OAuth token (from X-Slack-Bot-Token header) */
  botToken?: string;

  /** User OAuth token for user-level operations (from X-Slack-User-Token header) */
  userToken?: string;
}

/**
 * Parse tenant credentials from request headers
 */
export function parseTenantCredentials(request: Request): TenantCredentials {
  const headers = request.headers;

  return {
    botToken: headers.get('X-Slack-Bot-Token') || undefined,
    userToken: headers.get('X-Slack-User-Token') || undefined,
  };
}

/**
 * Validate that required credentials are present
 */
export function validateCredentials(credentials: TenantCredentials): void {
  if (!credentials.botToken && !credentials.userToken) {
    throw new Error(
      'Missing credentials. Provide X-Slack-Bot-Token or X-Slack-User-Token header.'
    );
  }
}

// =============================================================================
// Environment Configuration (from wrangler.jsonc vars and bindings)
// =============================================================================

export interface Env {
  /** Maximum character limit for responses */
  CHARACTER_LIMIT: string;

  /** Default page size for list operations */
  DEFAULT_PAGE_SIZE: string;

  /** Maximum page size allowed */
  MAX_PAGE_SIZE: string;

  /** KV namespace for caching (optional) */
  CACHE_KV?: KVNamespace;

  /** Durable Object namespace for MCP sessions (optional) */
  MCP_SESSIONS?: DurableObjectNamespace;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get a numeric environment value with a default
 */
export function getEnvNumber(env: Env, key: keyof Env, defaultValue: number): number {
  const value = env[key];
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Get the character limit from environment
 */
export function getCharacterLimit(env: Env): number {
  return getEnvNumber(env, 'CHARACTER_LIMIT', 50000);
}

/**
 * Get the default page size from environment
 */
export function getDefaultPageSize(env: Env): number {
  return getEnvNumber(env, 'DEFAULT_PAGE_SIZE', 20);
}

/**
 * Get the maximum page size from environment
 */
export function getMaxPageSize(env: Env): number {
  return getEnvNumber(env, 'MAX_PAGE_SIZE', 100);
}
