/**
 * Drizzle-backed implementations of ConversationStore and MessageStore
 * for the sanyam-ai-chat package.
 *
 * Conversations are scoped to a user and optionally to a project.
 * Chat messages cascade-delete with their parent conversation.
 */
import type { ConversationStore, MessageStore } from '@docugenix/sanyam-ai-chat';
import type { Conversation, ChatMessage } from '@docugenix/sanyam-ai-chat';
import { db } from './db.js';
import { conversations, chatMessages } from '@actone/shared/db';
import { eq, and, desc } from 'drizzle-orm';

export const conversationStore: ConversationStore = {
  async create(userId, projectId?, title?) {
    const [row] = await db
      .insert(conversations)
      .values({
        userId,
        projectId: projectId ?? null,
        title: title ?? null,
      })
      .returning();

    return toConversation(row!);
  },

  async list(userId, projectId?) {
    const conditions = projectId
      ? and(eq(conversations.userId, userId), eq(conversations.projectId, projectId))
      : eq(conversations.userId, userId);

    const rows = await db
      .select()
      .from(conversations)
      .where(conditions)
      .orderBy(desc(conversations.updatedAt));

    return rows.map(toConversation);
  },

  async get(id) {
    const [row] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    return row ? toConversation(row) : null;
  },

  async delete(id) {
    await db.delete(conversations).where(eq(conversations.id, id));
  },
};

export const messageStore: MessageStore = {
  async save(msg) {
    const [row] = await db
      .insert(chatMessages)
      .values({
        conversationId: msg.conversationId,
        role: msg.role,
        content: msg.content,
        tokenCount: msg.tokenCount ?? null,
        toolCalls: msg.toolCalls ?? null,
        modelUsed: msg.modelUsed ?? null,
        inputTokens: msg.inputTokens ?? null,
        outputTokens: msg.outputTokens ?? null,
        durationMs: msg.durationMs ?? null,
      })
      .returning();

    // Touch conversation updatedAt
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, msg.conversationId));

    return toChatMessage(row!);
  },

  async list(conversationId) {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);

    return rows.map(toChatMessage);
  },
};

// ── Row mappers ──────────────────────────────────────────────────────

type ConversationRow = typeof conversations.$inferSelect;
type ChatMessageRow = typeof chatMessages.$inferSelect;

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    projectId: row.projectId ?? undefined,
    userId: row.userId,
    title: row.title ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role as ChatMessage['role'],
    content: row.content,
    tokenCount: row.tokenCount ?? undefined,
    toolCalls: row.toolCalls as ChatMessage['toolCalls'],
    modelUsed: row.modelUsed ?? undefined,
    inputTokens: row.inputTokens ?? undefined,
    outputTokens: row.outputTokens ?? undefined,
    durationMs: row.durationMs ?? undefined,
    createdAt: row.createdAt,
  };
}
