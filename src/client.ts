/**
 * Slack API Client
 *
 * Handles all HTTP communication with the Slack Web API.
 *
 * MULTI-TENANT: This client receives credentials per-request via TenantCredentials,
 * allowing a single server to serve multiple tenants with different tokens.
 */

import type {
  Bookmark,
  Conversation,
  ConversationListParams,
  DndStatus,
  EmojiList,
  FileListParams,
  Message,
  MessageHistoryParams,
  PaginatedResponse,
  PaginationParams,
  PinnedItem,
  PostMessageParams,
  Reaction,
  Reminder,
  ScheduledMessage,
  ScheduleMessageParams,
  SearchParams,
  SearchResult,
  SlackApiResponse,
  SlackFile,
  StarredItem,
  Team,
  UpdateMessageParams,
  User,
  UserGroup,
  UserPresence,
} from './types/entities.js';
import type { TenantCredentials } from './types/env.js';
import {
  AuthenticationError,
  RateLimitError,
  mapSlackError,
} from './utils/errors.js';
import { createPaginatedResponse } from './utils/pagination.js';

// =============================================================================
// Configuration
// =============================================================================

const SLACK_API_BASE_URL = 'https://slack.com/api';

// =============================================================================
// Slack Client Interface
// =============================================================================

export interface SlackClient {
  // Connection
  testConnection(): Promise<{ connected: boolean; message: string; team?: string; user?: string }>;

  // Conversations
  listConversations(params?: ConversationListParams): Promise<PaginatedResponse<Conversation>>;
  getConversationInfo(channelId: string): Promise<Conversation>;
  getConversationHistory(
    channelId: string,
    params?: MessageHistoryParams
  ): Promise<PaginatedResponse<Message>>;
  getConversationReplies(
    channelId: string,
    threadTs: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Message>>;
  createConversation(name: string, isPrivate?: boolean): Promise<Conversation>;
  archiveConversation(channelId: string): Promise<void>;
  unarchiveConversation(channelId: string): Promise<void>;
  renameConversation(channelId: string, name: string): Promise<Conversation>;
  setConversationTopic(channelId: string, topic: string): Promise<Conversation>;
  setConversationPurpose(channelId: string, purpose: string): Promise<Conversation>;
  inviteToConversation(channelId: string, userIds: string[]): Promise<Conversation>;
  kickFromConversation(channelId: string, userId: string): Promise<void>;
  joinConversation(channelId: string): Promise<Conversation>;
  leaveConversation(channelId: string): Promise<void>;
  getConversationMembers(
    channelId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<string>>;

  // Chat/Messages
  postMessage(params: PostMessageParams): Promise<Message>;
  updateMessage(params: UpdateMessageParams): Promise<Message>;
  deleteMessage(channelId: string, ts: string): Promise<void>;
  scheduleMessage(params: ScheduleMessageParams): Promise<ScheduledMessage>;
  deleteScheduledMessage(channelId: string, scheduledMessageId: string): Promise<void>;
  listScheduledMessages(
    channelId?: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<ScheduledMessage>>;
  getPermalink(channelId: string, messageTs: string): Promise<string>;

  // Users
  listUsers(params?: PaginationParams): Promise<PaginatedResponse<User>>;
  getUserInfo(userId: string): Promise<User>;
  getUserByEmail(email: string): Promise<User>;
  getUserPresence(userId: string): Promise<UserPresence>;
  setUserPresence(presence: 'auto' | 'away'): Promise<void>;
  getUserConversations(
    userId?: string,
    params?: ConversationListParams
  ): Promise<PaginatedResponse<Conversation>>;

  // Files
  listFiles(params?: FileListParams): Promise<PaginatedResponse<SlackFile>>;
  getFileInfo(fileId: string): Promise<SlackFile>;
  deleteFile(fileId: string): Promise<void>;
  uploadFile(
    channels: string,
    content: string,
    filename: string,
    title?: string,
    initialComment?: string,
    threadTs?: string
  ): Promise<SlackFile>;

  // Reactions
  addReaction(channelId: string, timestamp: string, name: string): Promise<void>;
  removeReaction(channelId: string, timestamp: string, name: string): Promise<void>;
  getReactions(
    channelId: string,
    timestamp: string
  ): Promise<{ message: Message; reactions: Reaction[] }>;
  listUserReactions(
    userId?: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<{ type: string; message?: Message; file?: SlackFile }>>;

  // Search
  searchMessages(params: SearchParams): Promise<SearchResult>;
  searchFiles(params: SearchParams): Promise<SearchResult>;
  searchAll(params: SearchParams): Promise<{ messages: SearchResult; files: SearchResult }>;

  // Pins
  addPin(channelId: string, timestamp: string): Promise<void>;
  removePin(channelId: string, timestamp: string): Promise<void>;
  listPins(channelId: string): Promise<PinnedItem[]>;

  // Stars
  addStar(channelId: string, timestamp?: string, fileId?: string): Promise<void>;
  removeStar(channelId: string, timestamp?: string, fileId?: string): Promise<void>;
  listStars(params?: PaginationParams): Promise<PaginatedResponse<StarredItem>>;

  // Reminders
  addReminder(text: string, time: string | number, userId?: string): Promise<Reminder>;
  completeReminder(reminderId: string): Promise<void>;
  deleteReminder(reminderId: string): Promise<void>;
  getReminder(reminderId: string): Promise<Reminder>;
  listReminders(): Promise<Reminder[]>;

  // Bookmarks
  addBookmark(
    channelId: string,
    title: string,
    type: 'link' | 'folder',
    link?: string,
    emoji?: string
  ): Promise<Bookmark>;
  editBookmark(
    channelId: string,
    bookmarkId: string,
    updates: { title?: string; link?: string; emoji?: string }
  ): Promise<Bookmark>;
  removeBookmark(channelId: string, bookmarkId: string): Promise<void>;
  listBookmarks(channelId: string): Promise<Bookmark[]>;

  // User Groups
  listUserGroups(includeUsers?: boolean, includeDisabled?: boolean): Promise<UserGroup[]>;
  createUserGroup(
    name: string,
    handle?: string,
    description?: string,
    channels?: string[]
  ): Promise<UserGroup>;
  updateUserGroup(
    userGroupId: string,
    updates: { name?: string; handle?: string; description?: string; channels?: string[] }
  ): Promise<UserGroup>;
  disableUserGroup(userGroupId: string): Promise<UserGroup>;
  enableUserGroup(userGroupId: string): Promise<UserGroup>;
  getUserGroupMembers(userGroupId: string): Promise<string[]>;
  updateUserGroupMembers(userGroupId: string, userIds: string[]): Promise<UserGroup>;

  // Team
  getTeamInfo(): Promise<Team>;
  getBillableInfo(userId?: string): Promise<Record<string, { billing_active: boolean }>>;

  // DND (Do Not Disturb)
  getDndInfo(userId?: string): Promise<DndStatus>;
  setDndSnooze(numMinutes: number): Promise<DndStatus>;
  endDndSnooze(): Promise<DndStatus>;
  setDnd(numMinutes: number): Promise<void>;
  endDnd(): Promise<void>;

  // Emoji
  listEmoji(): Promise<EmojiList>;
}

// =============================================================================
// Slack Client Implementation
// =============================================================================

class SlackClientImpl implements SlackClient {
  private credentials: TenantCredentials;

  constructor(credentials: TenantCredentials) {
    this.credentials = credentials;
  }

  // ===========================================================================
  // HTTP Request Helper
  // ===========================================================================

  private getAuthHeaders(): Record<string, string> {
    const token = this.credentials.botToken || this.credentials.userToken;

    if (!token) {
      throw new AuthenticationError(
        'No credentials provided. Include X-Slack-Bot-Token or X-Slack-User-Token header.'
      );
    }

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    };
  }

  private async request<T extends SlackApiResponse>(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const url = `${SLACK_API_BASE_URL}/${method}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params),
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(
        'Rate limit exceeded',
        retryAfter ? parseInt(retryAfter, 10) : 60
      );
    }

    const data = (await response.json()) as T;

    if (!data.ok) {
      throw mapSlackError(data.error || 'unknown_error', data.error);
    }

    return data;
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  async testConnection(): Promise<{
    connected: boolean;
    message: string;
    team?: string;
    user?: string;
  }> {
    try {
      interface AuthTestResponse extends SlackApiResponse {
        url: string;
        team: string;
        user: string;
        team_id: string;
        user_id: string;
        bot_id?: string;
        is_enterprise_install?: boolean;
      }

      const result = await this.request<AuthTestResponse>('auth.test');
      return {
        connected: true,
        message: 'Successfully connected to Slack',
        team: result.team,
        user: result.user,
      };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // ===========================================================================
  // Conversations
  // ===========================================================================

  async listConversations(
    params?: ConversationListParams
  ): Promise<PaginatedResponse<Conversation>> {
    interface Response extends SlackApiResponse {
      channels: Conversation[];
    }

    const result = await this.request<Response>('conversations.list', {
      types: params?.types || 'public_channel,private_channel',
      exclude_archived: params?.exclude_archived ?? true,
      limit: params?.limit || 100,
      cursor: params?.cursor,
      team_id: params?.team_id,
    });

    return createPaginatedResponse(result.channels, {
      hasMore: !!result.response_metadata?.next_cursor,
      nextCursor: result.response_metadata?.next_cursor,
    });
  }

  async getConversationInfo(channelId: string): Promise<Conversation> {
    interface Response extends SlackApiResponse {
      channel: Conversation;
    }

    const result = await this.request<Response>('conversations.info', {
      channel: channelId,
      include_num_members: true,
    });

    return result.channel;
  }

  async getConversationHistory(
    channelId: string,
    params?: MessageHistoryParams
  ): Promise<PaginatedResponse<Message>> {
    interface Response extends SlackApiResponse {
      messages: Message[];
      has_more: boolean;
    }

    const result = await this.request<Response>('conversations.history', {
      channel: channelId,
      limit: params?.limit || 100,
      cursor: params?.cursor,
      oldest: params?.oldest,
      latest: params?.latest,
      inclusive: params?.inclusive,
      include_all_metadata: params?.include_all_metadata,
    });

    return createPaginatedResponse(result.messages, {
      hasMore: result.has_more,
      nextCursor: result.response_metadata?.next_cursor,
    });
  }

  async getConversationReplies(
    channelId: string,
    threadTs: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Message>> {
    interface Response extends SlackApiResponse {
      messages: Message[];
      has_more: boolean;
    }

    const result = await this.request<Response>('conversations.replies', {
      channel: channelId,
      ts: threadTs,
      limit: params?.limit || 100,
      cursor: params?.cursor,
    });

    return createPaginatedResponse(result.messages, {
      hasMore: result.has_more,
      nextCursor: result.response_metadata?.next_cursor,
    });
  }

  async createConversation(name: string, isPrivate = false): Promise<Conversation> {
    interface Response extends SlackApiResponse {
      channel: Conversation;
    }

    const result = await this.request<Response>('conversations.create', {
      name,
      is_private: isPrivate,
    });

    return result.channel;
  }

  async archiveConversation(channelId: string): Promise<void> {
    await this.request('conversations.archive', { channel: channelId });
  }

  async unarchiveConversation(channelId: string): Promise<void> {
    await this.request('conversations.unarchive', { channel: channelId });
  }

  async renameConversation(channelId: string, name: string): Promise<Conversation> {
    interface Response extends SlackApiResponse {
      channel: Conversation;
    }

    const result = await this.request<Response>('conversations.rename', {
      channel: channelId,
      name,
    });

    return result.channel;
  }

  async setConversationTopic(channelId: string, topic: string): Promise<Conversation> {
    interface Response extends SlackApiResponse {
      channel: Conversation;
    }

    const result = await this.request<Response>('conversations.setTopic', {
      channel: channelId,
      topic,
    });

    return result.channel;
  }

  async setConversationPurpose(channelId: string, purpose: string): Promise<Conversation> {
    interface Response extends SlackApiResponse {
      channel: Conversation;
    }

    const result = await this.request<Response>('conversations.setPurpose', {
      channel: channelId,
      purpose,
    });

    return result.channel;
  }

  async inviteToConversation(channelId: string, userIds: string[]): Promise<Conversation> {
    interface Response extends SlackApiResponse {
      channel: Conversation;
    }

    const result = await this.request<Response>('conversations.invite', {
      channel: channelId,
      users: userIds.join(','),
    });

    return result.channel;
  }

  async kickFromConversation(channelId: string, userId: string): Promise<void> {
    await this.request('conversations.kick', {
      channel: channelId,
      user: userId,
    });
  }

  async joinConversation(channelId: string): Promise<Conversation> {
    interface Response extends SlackApiResponse {
      channel: Conversation;
    }

    const result = await this.request<Response>('conversations.join', {
      channel: channelId,
    });

    return result.channel;
  }

  async leaveConversation(channelId: string): Promise<void> {
    await this.request('conversations.leave', { channel: channelId });
  }

  async getConversationMembers(
    channelId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<string>> {
    interface Response extends SlackApiResponse {
      members: string[];
    }

    const result = await this.request<Response>('conversations.members', {
      channel: channelId,
      limit: params?.limit || 100,
      cursor: params?.cursor,
    });

    return createPaginatedResponse(result.members, {
      hasMore: !!result.response_metadata?.next_cursor,
      nextCursor: result.response_metadata?.next_cursor,
    });
  }

  // ===========================================================================
  // Chat/Messages
  // ===========================================================================

  async postMessage(params: PostMessageParams): Promise<Message> {
    interface Response extends SlackApiResponse {
      channel: string;
      ts: string;
      message: Message;
    }

    const result = await this.request<Response>('chat.postMessage', {
      channel: params.channel,
      text: params.text,
      blocks: params.blocks,
      attachments: params.attachments,
      thread_ts: params.thread_ts,
      reply_broadcast: params.reply_broadcast,
      unfurl_links: params.unfurl_links,
      unfurl_media: params.unfurl_media,
      mrkdwn: params.mrkdwn,
      metadata: params.metadata,
    });

    return result.message;
  }

  async updateMessage(params: UpdateMessageParams): Promise<Message> {
    interface Response extends SlackApiResponse {
      channel: string;
      ts: string;
      text: string;
      message: Message;
    }

    const result = await this.request<Response>('chat.update', {
      channel: params.channel,
      ts: params.ts,
      text: params.text,
      blocks: params.blocks,
      attachments: params.attachments,
      as_user: params.as_user,
      metadata: params.metadata,
    });

    return result.message;
  }

  async deleteMessage(channelId: string, ts: string): Promise<void> {
    await this.request('chat.delete', {
      channel: channelId,
      ts,
    });
  }

  async scheduleMessage(params: ScheduleMessageParams): Promise<ScheduledMessage> {
    interface Response extends SlackApiResponse {
      channel: string;
      scheduled_message_id: string;
      post_at: number;
      message: { text: string };
    }

    const result = await this.request<Response>('chat.scheduleMessage', {
      channel: params.channel,
      post_at: params.post_at,
      text: params.text,
      blocks: params.blocks,
      attachments: params.attachments,
      thread_ts: params.thread_ts,
      reply_broadcast: params.reply_broadcast,
      unfurl_links: params.unfurl_links,
      unfurl_media: params.unfurl_media,
      metadata: params.metadata,
    });

    return {
      id: result.scheduled_message_id,
      channel_id: result.channel,
      post_at: result.post_at,
      date_created: Math.floor(Date.now() / 1000),
      text: result.message.text,
    };
  }

  async deleteScheduledMessage(channelId: string, scheduledMessageId: string): Promise<void> {
    await this.request('chat.deleteScheduledMessage', {
      channel: channelId,
      scheduled_message_id: scheduledMessageId,
    });
  }

  async listScheduledMessages(
    channelId?: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<ScheduledMessage>> {
    interface Response extends SlackApiResponse {
      scheduled_messages: ScheduledMessage[];
    }

    const result = await this.request<Response>('chat.scheduledMessages.list', {
      channel: channelId,
      limit: params?.limit || 100,
      cursor: params?.cursor,
    });

    return createPaginatedResponse(result.scheduled_messages, {
      hasMore: !!result.response_metadata?.next_cursor,
      nextCursor: result.response_metadata?.next_cursor,
    });
  }

  async getPermalink(channelId: string, messageTs: string): Promise<string> {
    interface Response extends SlackApiResponse {
      channel: string;
      permalink: string;
    }

    const result = await this.request<Response>('chat.getPermalink', {
      channel: channelId,
      message_ts: messageTs,
    });

    return result.permalink;
  }

  // ===========================================================================
  // Users
  // ===========================================================================

  async listUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    interface Response extends SlackApiResponse {
      members: User[];
    }

    const result = await this.request<Response>('users.list', {
      limit: params?.limit || 100,
      cursor: params?.cursor,
    });

    return createPaginatedResponse(result.members, {
      hasMore: !!result.response_metadata?.next_cursor,
      nextCursor: result.response_metadata?.next_cursor,
    });
  }

  async getUserInfo(userId: string): Promise<User> {
    interface Response extends SlackApiResponse {
      user: User;
    }

    const result = await this.request<Response>('users.info', {
      user: userId,
    });

    return result.user;
  }

  async getUserByEmail(email: string): Promise<User> {
    interface Response extends SlackApiResponse {
      user: User;
    }

    const result = await this.request<Response>('users.lookupByEmail', {
      email,
    });

    return result.user;
  }

  async getUserPresence(userId: string): Promise<UserPresence> {
    interface Response extends SlackApiResponse {
      presence: 'active' | 'away';
      online?: boolean;
      auto_away?: boolean;
      manual_away?: boolean;
      connection_count?: number;
      last_activity?: number;
    }

    const result = await this.request<Response>('users.getPresence', {
      user: userId,
    });

    return {
      presence: result.presence,
      online: result.online,
      auto_away: result.auto_away,
      manual_away: result.manual_away,
      connection_count: result.connection_count,
      last_activity: result.last_activity,
    };
  }

  async setUserPresence(presence: 'auto' | 'away'): Promise<void> {
    await this.request('users.setPresence', { presence });
  }

  async getUserConversations(
    userId?: string,
    params?: ConversationListParams
  ): Promise<PaginatedResponse<Conversation>> {
    interface Response extends SlackApiResponse {
      channels: Conversation[];
    }

    const result = await this.request<Response>('users.conversations', {
      user: userId,
      types: params?.types || 'public_channel,private_channel,mpim,im',
      exclude_archived: params?.exclude_archived ?? true,
      limit: params?.limit || 100,
      cursor: params?.cursor,
    });

    return createPaginatedResponse(result.channels, {
      hasMore: !!result.response_metadata?.next_cursor,
      nextCursor: result.response_metadata?.next_cursor,
    });
  }

  // ===========================================================================
  // Files
  // ===========================================================================

  async listFiles(params?: FileListParams): Promise<PaginatedResponse<SlackFile>> {
    interface Response extends SlackApiResponse {
      files: SlackFile[];
      paging: {
        count: number;
        total: number;
        page: number;
        pages: number;
      };
    }

    const result = await this.request<Response>('files.list', {
      channel: params?.channel,
      user: params?.user,
      types: params?.types,
      ts_from: params?.ts_from,
      ts_to: params?.ts_to,
      count: params?.limit || 100,
    });

    return createPaginatedResponse(result.files, {
      hasMore: result.paging.page < result.paging.pages,
    });
  }

  async getFileInfo(fileId: string): Promise<SlackFile> {
    interface Response extends SlackApiResponse {
      file: SlackFile;
    }

    const result = await this.request<Response>('files.info', {
      file: fileId,
    });

    return result.file;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.request('files.delete', { file: fileId });
  }

  async uploadFile(
    channels: string,
    content: string,
    filename: string,
    title?: string,
    initialComment?: string,
    threadTs?: string
  ): Promise<SlackFile> {
    // Using the new files.getUploadURLExternal + files.completeUploadExternal approach
    // since files.upload is deprecated
    interface GetUploadUrlResponse extends SlackApiResponse {
      upload_url: string;
      file_id: string;
    }

    interface CompleteUploadResponse extends SlackApiResponse {
      files: SlackFile[];
    }

    // Step 1: Get upload URL
    const contentBytes = new TextEncoder().encode(content);
    const uploadUrlResult = await this.request<GetUploadUrlResponse>(
      'files.getUploadURLExternal',
      {
        filename,
        length: contentBytes.length,
      }
    );

    // Step 2: Upload content to the URL
    await fetch(uploadUrlResult.upload_url, {
      method: 'POST',
      body: content,
    });

    // Step 3: Complete the upload
    const completeResult = await this.request<CompleteUploadResponse>(
      'files.completeUploadExternal',
      {
        files: [
          {
            id: uploadUrlResult.file_id,
            title: title || filename,
          },
        ],
        channel_id: channels,
        initial_comment: initialComment,
        thread_ts: threadTs,
      }
    );

    return completeResult.files[0];
  }

  // ===========================================================================
  // Reactions
  // ===========================================================================

  async addReaction(channelId: string, timestamp: string, name: string): Promise<void> {
    await this.request('reactions.add', {
      channel: channelId,
      timestamp,
      name,
    });
  }

  async removeReaction(channelId: string, timestamp: string, name: string): Promise<void> {
    await this.request('reactions.remove', {
      channel: channelId,
      timestamp,
      name,
    });
  }

  async getReactions(
    channelId: string,
    timestamp: string
  ): Promise<{ message: Message; reactions: Reaction[] }> {
    interface Response extends SlackApiResponse {
      message: Message & { reactions?: Reaction[] };
    }

    const result = await this.request<Response>('reactions.get', {
      channel: channelId,
      timestamp,
      full: true,
    });

    return {
      message: result.message,
      reactions: result.message.reactions || [],
    };
  }

  async listUserReactions(
    userId?: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<{ type: string; message?: Message; file?: SlackFile }>> {
    interface ReactionItem {
      type: string;
      message?: Message;
      file?: SlackFile;
    }

    interface Response extends SlackApiResponse {
      items: ReactionItem[];
      paging: {
        count: number;
        total: number;
        page: number;
        pages: number;
      };
    }

    const result = await this.request<Response>('reactions.list', {
      user: userId,
      count: params?.limit || 100,
      full: true,
    });

    return createPaginatedResponse(result.items, {
      hasMore: result.paging.page < result.paging.pages,
    });
  }

  // ===========================================================================
  // Search
  // ===========================================================================

  async searchMessages(params: SearchParams): Promise<SearchResult> {
    interface Response extends SlackApiResponse {
      messages: SearchResult;
    }

    const result = await this.request<Response>('search.messages', {
      query: params.query,
      sort: params.sort || 'timestamp',
      sort_dir: params.sort_dir || 'desc',
      count: params.limit || 20,
      highlight: params.highlight,
    });

    return result.messages;
  }

  async searchFiles(params: SearchParams): Promise<SearchResult> {
    interface Response extends SlackApiResponse {
      files: SearchResult;
    }

    const result = await this.request<Response>('search.files', {
      query: params.query,
      sort: params.sort || 'timestamp',
      sort_dir: params.sort_dir || 'desc',
      count: params.limit || 20,
      highlight: params.highlight,
    });

    return result.files;
  }

  async searchAll(
    params: SearchParams
  ): Promise<{ messages: SearchResult; files: SearchResult }> {
    interface Response extends SlackApiResponse {
      messages: SearchResult;
      files: SearchResult;
    }

    const result = await this.request<Response>('search.all', {
      query: params.query,
      sort: params.sort || 'timestamp',
      sort_dir: params.sort_dir || 'desc',
      count: params.limit || 20,
      highlight: params.highlight,
    });

    return {
      messages: result.messages,
      files: result.files,
    };
  }

  // ===========================================================================
  // Pins
  // ===========================================================================

  async addPin(channelId: string, timestamp: string): Promise<void> {
    await this.request('pins.add', {
      channel: channelId,
      timestamp,
    });
  }

  async removePin(channelId: string, timestamp: string): Promise<void> {
    await this.request('pins.remove', {
      channel: channelId,
      timestamp,
    });
  }

  async listPins(channelId: string): Promise<PinnedItem[]> {
    interface Response extends SlackApiResponse {
      items: PinnedItem[];
    }

    const result = await this.request<Response>('pins.list', {
      channel: channelId,
    });

    return result.items;
  }

  // ===========================================================================
  // Stars
  // ===========================================================================

  async addStar(channelId: string, timestamp?: string, fileId?: string): Promise<void> {
    await this.request('stars.add', {
      channel: channelId,
      timestamp,
      file: fileId,
    });
  }

  async removeStar(channelId: string, timestamp?: string, fileId?: string): Promise<void> {
    await this.request('stars.remove', {
      channel: channelId,
      timestamp,
      file: fileId,
    });
  }

  async listStars(params?: PaginationParams): Promise<PaginatedResponse<StarredItem>> {
    interface Response extends SlackApiResponse {
      items: StarredItem[];
      paging: {
        count: number;
        total: number;
        page: number;
        pages: number;
      };
    }

    const result = await this.request<Response>('stars.list', {
      count: params?.limit || 100,
    });

    return createPaginatedResponse(result.items, {
      hasMore: result.paging.page < result.paging.pages,
    });
  }

  // ===========================================================================
  // Reminders
  // ===========================================================================

  async addReminder(text: string, time: string | number, userId?: string): Promise<Reminder> {
    interface Response extends SlackApiResponse {
      reminder: Reminder;
    }

    const result = await this.request<Response>('reminders.add', {
      text,
      time,
      user: userId,
    });

    return result.reminder;
  }

  async completeReminder(reminderId: string): Promise<void> {
    await this.request('reminders.complete', { reminder: reminderId });
  }

  async deleteReminder(reminderId: string): Promise<void> {
    await this.request('reminders.delete', { reminder: reminderId });
  }

  async getReminder(reminderId: string): Promise<Reminder> {
    interface Response extends SlackApiResponse {
      reminder: Reminder;
    }

    const result = await this.request<Response>('reminders.info', {
      reminder: reminderId,
    });

    return result.reminder;
  }

  async listReminders(): Promise<Reminder[]> {
    interface Response extends SlackApiResponse {
      reminders: Reminder[];
    }

    const result = await this.request<Response>('reminders.list');
    return result.reminders;
  }

  // ===========================================================================
  // Bookmarks
  // ===========================================================================

  async addBookmark(
    channelId: string,
    title: string,
    type: 'link' | 'folder',
    link?: string,
    emoji?: string
  ): Promise<Bookmark> {
    interface Response extends SlackApiResponse {
      bookmark: Bookmark;
    }

    const result = await this.request<Response>('bookmarks.add', {
      channel_id: channelId,
      title,
      type,
      link,
      emoji,
    });

    return result.bookmark;
  }

  async editBookmark(
    channelId: string,
    bookmarkId: string,
    updates: { title?: string; link?: string; emoji?: string }
  ): Promise<Bookmark> {
    interface Response extends SlackApiResponse {
      bookmark: Bookmark;
    }

    const result = await this.request<Response>('bookmarks.edit', {
      channel_id: channelId,
      bookmark_id: bookmarkId,
      ...updates,
    });

    return result.bookmark;
  }

  async removeBookmark(channelId: string, bookmarkId: string): Promise<void> {
    await this.request('bookmarks.remove', {
      channel_id: channelId,
      bookmark_id: bookmarkId,
    });
  }

  async listBookmarks(channelId: string): Promise<Bookmark[]> {
    interface Response extends SlackApiResponse {
      bookmarks: Bookmark[];
    }

    const result = await this.request<Response>('bookmarks.list', {
      channel_id: channelId,
    });

    return result.bookmarks;
  }

  // ===========================================================================
  // User Groups
  // ===========================================================================

  async listUserGroups(includeUsers = false, includeDisabled = false): Promise<UserGroup[]> {
    interface Response extends SlackApiResponse {
      usergroups: UserGroup[];
    }

    const result = await this.request<Response>('usergroups.list', {
      include_users: includeUsers,
      include_disabled: includeDisabled,
    });

    return result.usergroups;
  }

  async createUserGroup(
    name: string,
    handle?: string,
    description?: string,
    channels?: string[]
  ): Promise<UserGroup> {
    interface Response extends SlackApiResponse {
      usergroup: UserGroup;
    }

    const result = await this.request<Response>('usergroups.create', {
      name,
      handle,
      description,
      channels: channels?.join(','),
    });

    return result.usergroup;
  }

  async updateUserGroup(
    userGroupId: string,
    updates: { name?: string; handle?: string; description?: string; channels?: string[] }
  ): Promise<UserGroup> {
    interface Response extends SlackApiResponse {
      usergroup: UserGroup;
    }

    const result = await this.request<Response>('usergroups.update', {
      usergroup: userGroupId,
      name: updates.name,
      handle: updates.handle,
      description: updates.description,
      channels: updates.channels?.join(','),
    });

    return result.usergroup;
  }

  async disableUserGroup(userGroupId: string): Promise<UserGroup> {
    interface Response extends SlackApiResponse {
      usergroup: UserGroup;
    }

    const result = await this.request<Response>('usergroups.disable', {
      usergroup: userGroupId,
    });

    return result.usergroup;
  }

  async enableUserGroup(userGroupId: string): Promise<UserGroup> {
    interface Response extends SlackApiResponse {
      usergroup: UserGroup;
    }

    const result = await this.request<Response>('usergroups.enable', {
      usergroup: userGroupId,
    });

    return result.usergroup;
  }

  async getUserGroupMembers(userGroupId: string): Promise<string[]> {
    interface Response extends SlackApiResponse {
      users: string[];
    }

    const result = await this.request<Response>('usergroups.users.list', {
      usergroup: userGroupId,
    });

    return result.users;
  }

  async updateUserGroupMembers(userGroupId: string, userIds: string[]): Promise<UserGroup> {
    interface Response extends SlackApiResponse {
      usergroup: UserGroup;
    }

    const result = await this.request<Response>('usergroups.users.update', {
      usergroup: userGroupId,
      users: userIds.join(','),
    });

    return result.usergroup;
  }

  // ===========================================================================
  // Team
  // ===========================================================================

  async getTeamInfo(): Promise<Team> {
    interface Response extends SlackApiResponse {
      team: Team;
    }

    const result = await this.request<Response>('team.info');
    return result.team;
  }

  async getBillableInfo(
    userId?: string
  ): Promise<Record<string, { billing_active: boolean }>> {
    interface Response extends SlackApiResponse {
      billable_info: Record<string, { billing_active: boolean }>;
    }

    const result = await this.request<Response>('team.billableInfo', {
      user: userId,
    });

    return result.billable_info;
  }

  // ===========================================================================
  // DND (Do Not Disturb)
  // ===========================================================================

  async getDndInfo(userId?: string): Promise<DndStatus> {
    interface Response extends SlackApiResponse {
      dnd_enabled: boolean;
      next_dnd_start_ts?: number;
      next_dnd_end_ts?: number;
      snooze_enabled?: boolean;
      snooze_endtime?: number;
      snooze_remaining?: number;
    }

    const result = await this.request<Response>('dnd.info', {
      user: userId,
    });

    return {
      dnd_enabled: result.dnd_enabled,
      next_dnd_start_ts: result.next_dnd_start_ts,
      next_dnd_end_ts: result.next_dnd_end_ts,
      snooze_enabled: result.snooze_enabled,
      snooze_endtime: result.snooze_endtime,
      snooze_remaining: result.snooze_remaining,
    };
  }

  async setDndSnooze(numMinutes: number): Promise<DndStatus> {
    interface Response extends SlackApiResponse {
      snooze_enabled: boolean;
      snooze_endtime: number;
      snooze_remaining: number;
    }

    const result = await this.request<Response>('dnd.setSnooze', {
      num_minutes: numMinutes,
    });

    return {
      dnd_enabled: true,
      snooze_enabled: result.snooze_enabled,
      snooze_endtime: result.snooze_endtime,
      snooze_remaining: result.snooze_remaining,
    };
  }

  async endDndSnooze(): Promise<DndStatus> {
    interface Response extends SlackApiResponse {
      dnd_enabled: boolean;
      next_dnd_start_ts?: number;
      next_dnd_end_ts?: number;
    }

    const result = await this.request<Response>('dnd.endSnooze');

    return {
      dnd_enabled: result.dnd_enabled,
      next_dnd_start_ts: result.next_dnd_start_ts,
      next_dnd_end_ts: result.next_dnd_end_ts,
      snooze_enabled: false,
    };
  }

  async setDnd(numMinutes: number): Promise<void> {
    await this.request('dnd.setSnooze', { num_minutes: numMinutes });
  }

  async endDnd(): Promise<void> {
    await this.request('dnd.endDnd');
  }

  // ===========================================================================
  // Emoji
  // ===========================================================================

  async listEmoji(): Promise<EmojiList> {
    interface Response extends SlackApiResponse {
      emoji: Record<string, string>;
      cache_ts?: string;
    }

    const result = await this.request<Response>('emoji.list');

    return {
      emoji: result.emoji,
      cache_ts: result.cache_ts,
    };
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Slack client instance with tenant-specific credentials.
 */
export function createSlackClient(credentials: TenantCredentials): SlackClient {
  return new SlackClientImpl(credentials);
}
