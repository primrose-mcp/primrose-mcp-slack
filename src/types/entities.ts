/**
 * Slack Entity Types
 *
 * Type definitions for Slack API entities.
 */

// =============================================================================
// Pagination
// =============================================================================

export interface PaginationParams {
  /** Number of items to return */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
}

export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Number of items in this response */
  count: number;
  /** Whether more items are available */
  hasMore: boolean;
  /** Cursor for next page */
  nextCursor?: string;
}

// =============================================================================
// Slack API Response Base
// =============================================================================

export interface SlackApiResponse {
  ok: boolean;
  error?: string;
  warning?: string;
  response_metadata?: {
    next_cursor?: string;
    messages?: string[];
    warnings?: string[];
  };
}

// =============================================================================
// Conversation (Channel, DM, Group)
// =============================================================================

export interface Conversation {
  id: string;
  name?: string;
  name_normalized?: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  is_archived: boolean;
  is_general?: boolean;
  is_shared?: boolean;
  is_org_shared?: boolean;
  is_ext_shared?: boolean;
  is_member?: boolean;
  is_pending_ext_shared?: boolean;
  created: number;
  creator?: string;
  unlinked?: number;
  num_members?: number;
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };
  previous_names?: string[];
  priority?: number;
  user?: string; // For DMs
  shared_team_ids?: string[];
  internal_team_ids?: string[];
  pending_connected_team_ids?: string[];
  pending_shared?: string[];
  context_team_id?: string;
  updated?: number;
  parent_conversation?: string;
}

export interface ConversationListParams extends PaginationParams {
  types?: string; // 'public_channel,private_channel,mpim,im'
  exclude_archived?: boolean;
  team_id?: string;
}

// =============================================================================
// Message
// =============================================================================

export interface Message {
  type: string;
  subtype?: string;
  text?: string;
  ts: string;
  user?: string;
  bot_id?: string;
  app_id?: string;
  team?: string;
  channel?: string;
  thread_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  reply_users?: string[];
  subscribed?: boolean;
  last_read?: string;
  is_locked?: boolean;
  blocks?: Block[];
  attachments?: Attachment[];
  files?: SlackFile[];
  reactions?: Reaction[];
  edited?: {
    user: string;
    ts: string;
  };
  pinned_to?: string[];
  permalink?: string;
  icons?: {
    emoji?: string;
    image_36?: string;
    image_48?: string;
    image_72?: string;
  };
  username?: string;
  bot_profile?: BotProfile;
}

export interface MessageHistoryParams extends PaginationParams {
  oldest?: string;
  latest?: string;
  inclusive?: boolean;
  include_all_metadata?: boolean;
}

export interface PostMessageParams {
  channel: string;
  text?: string;
  blocks?: Block[];
  attachments?: Attachment[];
  thread_ts?: string;
  reply_broadcast?: boolean;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  mrkdwn?: boolean;
  metadata?: MessageMetadata;
}

export interface UpdateMessageParams {
  channel: string;
  ts: string;
  text?: string;
  blocks?: Block[];
  attachments?: Attachment[];
  as_user?: boolean;
  metadata?: MessageMetadata;
}

export interface ScheduleMessageParams {
  channel: string;
  post_at: number;
  text?: string;
  blocks?: Block[];
  attachments?: Attachment[];
  thread_ts?: string;
  reply_broadcast?: boolean;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  event_type: string;
  event_payload: Record<string, unknown>;
}

// =============================================================================
// User
// =============================================================================

export interface User {
  id: string;
  team_id?: string;
  name: string;
  deleted?: boolean;
  color?: string;
  real_name?: string;
  tz?: string;
  tz_label?: string;
  tz_offset?: number;
  profile: UserProfile;
  is_admin?: boolean;
  is_owner?: boolean;
  is_primary_owner?: boolean;
  is_restricted?: boolean;
  is_ultra_restricted?: boolean;
  is_bot?: boolean;
  is_app_user?: boolean;
  updated?: number;
  has_2fa?: boolean;
  locale?: string;
  is_email_confirmed?: boolean;
  enterprise_user?: {
    id: string;
    enterprise_id: string;
    enterprise_name: string;
    is_admin: boolean;
    is_owner: boolean;
    teams: string[];
  };
}

export interface UserProfile {
  title?: string;
  phone?: string;
  skype?: string;
  real_name?: string;
  real_name_normalized?: string;
  display_name?: string;
  display_name_normalized?: string;
  fields?: Record<string, unknown>;
  status_text?: string;
  status_emoji?: string;
  status_expiration?: number;
  avatar_hash?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  image_original?: string;
  image_24?: string;
  image_32?: string;
  image_48?: string;
  image_72?: string;
  image_192?: string;
  image_512?: string;
  image_1024?: string;
  status_text_canonical?: string;
  team?: string;
  is_custom_image?: boolean;
}

export interface UserPresence {
  presence: 'active' | 'away';
  online?: boolean;
  auto_away?: boolean;
  manual_away?: boolean;
  connection_count?: number;
  last_activity?: number;
}

// =============================================================================
// File
// =============================================================================

export interface SlackFile {
  id: string;
  created?: number;
  timestamp?: number;
  name?: string;
  title?: string;
  mimetype?: string;
  filetype?: string;
  pretty_type?: string;
  user?: string;
  editable?: boolean;
  size?: number;
  mode?: string;
  is_external?: boolean;
  external_type?: string;
  is_public?: boolean;
  public_url_shared?: boolean;
  display_as_bot?: boolean;
  username?: string;
  url_private?: string;
  url_private_download?: string;
  permalink?: string;
  permalink_public?: string;
  preview?: string;
  preview_highlight?: string;
  lines?: number;
  lines_more?: number;
  preview_is_truncated?: boolean;
  comments_count?: number;
  is_starred?: boolean;
  shares?: {
    public?: Record<string, ShareInfo[]>;
    private?: Record<string, ShareInfo[]>;
  };
  channels?: string[];
  groups?: string[];
  ims?: string[];
  thumb_64?: string;
  thumb_80?: string;
  thumb_360?: string;
  thumb_360_w?: number;
  thumb_360_h?: number;
  thumb_480?: string;
  thumb_480_w?: number;
  thumb_480_h?: number;
  thumb_160?: string;
  thumb_720?: string;
  thumb_720_w?: number;
  thumb_720_h?: number;
  thumb_800?: string;
  thumb_800_w?: number;
  thumb_800_h?: number;
  thumb_960?: string;
  thumb_960_w?: number;
  thumb_960_h?: number;
  thumb_1024?: string;
  thumb_1024_w?: number;
  thumb_1024_h?: number;
}

export interface ShareInfo {
  reply_users?: string[];
  reply_users_count?: number;
  reply_count?: number;
  ts: string;
  channel_name?: string;
  team_id?: string;
}

export interface FileListParams extends PaginationParams {
  channel?: string;
  user?: string;
  types?: string;
  ts_from?: number;
  ts_to?: number;
}

export interface FileUploadParams {
  channels?: string;
  content?: string;
  file?: Blob;
  filename?: string;
  filetype?: string;
  initial_comment?: string;
  thread_ts?: string;
  title?: string;
}

// =============================================================================
// Reaction
// =============================================================================

export interface Reaction {
  name: string;
  count: number;
  users: string[];
}

export interface ReactionItem {
  type: 'message' | 'file' | 'file_comment';
  channel?: string;
  message?: Message;
  file?: SlackFile;
  comment?: FileComment;
}

export interface FileComment {
  id: string;
  timestamp: number;
  user: string;
  comment: string;
}

// =============================================================================
// Reminder
// =============================================================================

export interface Reminder {
  id: string;
  creator: string;
  user: string;
  text: string;
  recurring: boolean;
  time?: number;
  complete_ts?: number;
}

// =============================================================================
// Pin
// =============================================================================

export interface PinnedItem {
  type: 'message' | 'file';
  channel?: string;
  message?: Message;
  file?: SlackFile;
  created?: number;
  created_by?: string;
}

// =============================================================================
// Bookmark
// =============================================================================

export interface Bookmark {
  id: string;
  channel_id: string;
  title: string;
  link?: string;
  emoji?: string;
  icon_url?: string;
  type: 'link' | 'folder';
  entity_id?: string;
  date_created: number;
  date_updated: number;
  rank?: string;
  last_updated_by_user_id?: string;
  last_updated_by_team_id?: string;
  shortcut_id?: string;
  app_id?: string;
}

// =============================================================================
// User Group
// =============================================================================

export interface UserGroup {
  id: string;
  team_id: string;
  is_usergroup: boolean;
  is_subteam: boolean;
  name: string;
  description?: string;
  handle: string;
  is_external: boolean;
  date_create: number;
  date_update: number;
  date_delete: number;
  auto_type?: string;
  auto_provision?: boolean;
  enterprise_subteam_id?: string;
  created_by: string;
  updated_by?: string;
  deleted_by?: string;
  prefs?: {
    channels: string[];
    groups: string[];
  };
  users?: string[];
  user_count?: number;
  channel_count?: number;
}

// =============================================================================
// Team
// =============================================================================

export interface Team {
  id: string;
  name: string;
  url?: string;
  domain: string;
  email_domain?: string;
  icon?: {
    image_34?: string;
    image_44?: string;
    image_68?: string;
    image_88?: string;
    image_102?: string;
    image_132?: string;
    image_230?: string;
    image_original?: string;
    image_default?: boolean;
  };
  avatar_base_url?: string;
  is_verified?: boolean;
  enterprise_id?: string;
  enterprise_name?: string;
  enterprise_domain?: string;
}

// =============================================================================
// Search Results
// =============================================================================

export interface SearchParams extends PaginationParams {
  query: string;
  sort?: 'score' | 'timestamp';
  sort_dir?: 'asc' | 'desc';
  highlight?: boolean;
}

export interface SearchResult {
  total: number;
  pagination?: {
    total_count: number;
    page: number;
    per_page: number;
    page_count: number;
    first: number;
    last: number;
  };
  paging?: {
    count: number;
    total: number;
    page: number;
    pages: number;
  };
  matches: Message[] | SlackFile[];
}

// =============================================================================
// Scheduled Messages
// =============================================================================

export interface ScheduledMessage {
  id: string;
  channel_id: string;
  post_at: number;
  date_created: number;
  text?: string;
}

// =============================================================================
// Block Kit (simplified)
// =============================================================================

export interface Block {
  type: string;
  block_id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface Attachment {
  fallback?: string;
  color?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: AttachmentField[];
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
  mrkdwn_in?: string[];
}

export interface AttachmentField {
  title: string;
  value: string;
  short?: boolean;
}

// =============================================================================
// Bot Profile
// =============================================================================

export interface BotProfile {
  id: string;
  deleted?: boolean;
  name: string;
  updated?: number;
  app_id?: string;
  team_id?: string;
  icons?: {
    image_36?: string;
    image_48?: string;
    image_72?: string;
  };
}

// =============================================================================
// Stars
// =============================================================================

export interface StarredItem {
  type: 'message' | 'file' | 'channel' | 'im' | 'group';
  channel?: string;
  message?: Message;
  file?: SlackFile;
  date_create?: number;
}

// =============================================================================
// DND (Do Not Disturb)
// =============================================================================

export interface DndStatus {
  dnd_enabled: boolean;
  next_dnd_start_ts?: number;
  next_dnd_end_ts?: number;
  snooze_enabled?: boolean;
  snooze_endtime?: number;
  snooze_remaining?: number;
}

// =============================================================================
// Emoji
// =============================================================================

export interface EmojiList {
  emoji: Record<string, string>;
  cache_ts?: string;
  categories_version?: string;
  categories?: EmojiCategory[];
}

export interface EmojiCategory {
  name: string;
  emoji_names: string[];
}

// =============================================================================
// Response Format
// =============================================================================

export type ResponseFormat = 'json' | 'markdown';
