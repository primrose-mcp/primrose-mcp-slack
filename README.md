# Slack MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with the ability to interact with Slack workspaces. Send messages, manage channels, search conversations, and more.

[![Primrose MCP](https://img.shields.io/badge/Primrose-MCP-6366f1)](https://primrose.dev/mcp/slack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[View on Primrose](https://primrose.dev/mcp/slack)** | **[Documentation](https://primrose.dev/docs)**

---

## Features

- **Messages** - Send, update, delete, and schedule messages
- **Channels** - Create, archive, and manage conversations
- **Search** - Search messages and files across your workspace
- **Users** - Look up user profiles and presence
- **Reactions** - Add and remove emoji reactions
- **Files** - Upload and share files
- **Pins & Stars** - Pin important messages and manage starred items
- **Reminders** - Create and manage reminders
- **User Groups** - Manage user groups and mentions

## Quick Start

### Using Primrose SDK (Recommended)

The fastest way to get started is with the [Primrose SDK](https://github.com/primrose-mcp/primrose-sdk), which handles authentication and provides tool definitions formatted for your LLM provider.

```bash
npm install primrose-mcp
```

```typescript
import { Primrose } from 'primrose-mcp';

const primrose = new Primrose({
  apiKey: 'prm_xxxxx',
  provider: 'anthropic', // or 'openai', 'google', 'amazon', etc.
});

// List available Slack tools
const tools = await primrose.listTools({ mcpServer: 'slack' });

// Call a tool
const result = await primrose.callTool('slack_post_message', {
  channel: '#general',
  text: 'Hello from my AI assistant!',
});
```

[Get your Primrose API key](https://primrose.dev) to start building.

### Manual Installation

If you prefer to self-host, you can deploy this MCP server directly to Cloudflare Workers.

```bash
# Clone the repository
git clone https://github.com/primrose-mcp/primrose-mcp-slack.git
cd primrose-mcp-slack

# Install dependencies
bun install

# Deploy to Cloudflare Workers
bun run deploy
```

## Configuration

This server uses a multi-tenant architecture where credentials are passed via request headers.

### Required Headers

| Header | Description |
|--------|-------------|
| `X-Slack-Bot-Token` | Bot OAuth token (`xoxb-...`) |

### Optional Headers

| Header | Description |
|--------|-------------|
| `X-Slack-User-Token` | User OAuth token for user-level operations (`xoxp-...`) |

### Getting Your Tokens

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app or select an existing one
3. Navigate to **OAuth & Permissions**
4. Add the required scopes for the features you need
5. Install the app to your workspace
6. Copy the **Bot User OAuth Token**

## Available Tools

### Messages
- `slack_post_message` - Send a message to a channel
- `slack_update_message` - Update an existing message
- `slack_delete_message` - Delete a message
- `slack_schedule_message` - Schedule a message for later
- `slack_get_permalink` - Get a permanent link to a message

### Channels
- `slack_list_conversations` - List channels and DMs
- `slack_create_conversation` - Create a new channel
- `slack_archive_conversation` - Archive a channel
- `slack_get_conversation_info` - Get channel details
- `slack_get_conversation_history` - Fetch message history

### Users
- `slack_list_users` - List workspace members
- `slack_get_user_info` - Get user profile
- `slack_get_user_presence` - Check user's online status

### Search
- `slack_search_messages` - Search messages across the workspace
- `slack_search_files` - Search for files

### Reactions
- `slack_add_reaction` - Add an emoji reaction
- `slack_remove_reaction` - Remove a reaction
- `slack_get_reactions` - Get reactions on a message

### Files
- `slack_list_files` - List files in the workspace
- `slack_get_file_info` - Get file details
- `slack_delete_file` - Delete a file

### Pins & Stars
- `slack_pin_message` - Pin a message to a channel
- `slack_unpin_message` - Unpin a message
- `slack_list_pins` - List pinned items
- `slack_add_star` - Star an item
- `slack_remove_star` - Remove a star

### Reminders
- `slack_create_reminder` - Create a reminder
- `slack_list_reminders` - List reminders
- `slack_delete_reminder` - Delete a reminder

## Development

```bash
# Run locally
bun run dev

# Type check
bun run typecheck

# Lint
bun run lint

# Test with MCP Inspector
bun run inspector
```

## Related Resources

- [Primrose SDK](https://github.com/primrose-mcp/primrose-sdk)
- [Slack API Documentation](https://api.slack.com/docs)
- [Model Context Protocol](https://modelcontextprotocol.io)

## License

MIT License - see [LICENSE](LICENSE) for details.
