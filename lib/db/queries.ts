import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatbotError } from "../errors";
import { generateUUID } from "../utils";
import type { Chat, DBMessage, Document, Suggestion, User } from "./schema";

const ARENA_BASE_URL = process.env.ARENA_BASE_URL!;

async function arenaFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${ARENA_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    throw new Error(`Arena API error ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

function parseDate(val: string | number | Date): Date {
  if (val instanceof Date) return val;
  return new Date(val);
}

function parseChatDates(c: any): Chat | null {
  if (!c) return null;
  return { ...c, createdAt: parseDate(c.createdAt) };
}

function parseMessageDates(m: any): DBMessage {
  return { ...m, createdAt: parseDate(m.createdAt) };
}

function parseDocumentDates(d: any): Document | null {
  if (!d) return null;
  return { ...d, createdAt: parseDate(d.createdAt) };
}

function parseSuggestionDates(s: any): Suggestion {
  return {
    ...s,
    createdAt: parseDate(s.createdAt),
    documentCreatedAt: parseDate(s.documentCreatedAt),
  };
}

// ─── Users ───────────────────────────────────────────────────

export async function getUser(email: string): Promise<User[]> {
  try {
    return await arenaFetch<User[]>(
      `/api/users?username=${encodeURIComponent(email)}`
    );
  } catch {
    throw new ChatbotError("bad_request:database", "Failed to get user by email");
  }
}

export async function createUser(email: string, password: string) {
  try {
    return await arenaFetch(`/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({ username: email }),
    });
  } catch {
    throw new ChatbotError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  try {
    const user = await arenaFetch<{ id: string; email: string }>(
      `/api/auth/register`,
      {
        method: "POST",
        body: JSON.stringify({ username: email }),
      }
    );
    return [{ id: user.id, email: user.email }];
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

// ─── Chats ───────────────────────────────────────────────────

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await arenaFetch(`/api/chats`, {
      method: "POST",
      body: JSON.stringify({ id, userId, title, visibility }),
    });
  } catch {
    throw new ChatbotError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const result = await arenaFetch<any>(
      `/api/chats/delete?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    return parseChatDates(result);
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({
  userId,
}: {
  userId: string;
}) {
  try {
    return await arenaFetch<{ deletedCount: number }>(
      `/api/chats/delete-all?userId=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    );
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const params = new URLSearchParams({
      userId: id,
      limit: String(limit),
    });
    if (startingAfter) params.set("startingAfter", startingAfter);
    if (endingBefore) params.set("endingBefore", endingBefore);

    const result = await arenaFetch<{ chats: any[]; hasMore: boolean }>(
      `/api/chats/by-user?${params.toString()}`
    );
    return {
      chats: result.chats.map((c) => parseChatDates(c)!),
      hasMore: result.hasMore,
    };
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const result = await arenaFetch<any>(
      `/api/chats/get?id=${encodeURIComponent(id)}`
    );
    return parseChatDates(result);
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get chat by id"
    );
  }
}

// ─── Messages ────────────────────────────────────────────────

export async function saveMessages({
  messages,
}: {
  messages: DBMessage[];
}) {
  try {
    return await arenaFetch(`/api/messages`, {
      method: "POST",
      body: JSON.stringify({
        messages: messages.map((m) => ({
          ...m,
          createdAt:
            m.createdAt instanceof Date ? m.createdAt.getTime() : m.createdAt,
        })),
      }),
    });
  } catch {
    throw new ChatbotError("bad_request:database", "Failed to save messages");
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    return await arenaFetch(`/api/messages/update`, {
      method: "PATCH",
      body: JSON.stringify({ id, parts }),
    });
  } catch {
    throw new ChatbotError("bad_request:database", "Failed to update message");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    const messages = await arenaFetch<any[]>(
      `/api/messages/by-chat?chatId=${encodeURIComponent(id)}`
    );
    return messages.map(parseMessageDates);
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const messages = await arenaFetch<any[]>(
      `/api/messages/get?id=${encodeURIComponent(id)}`
    );
    return messages.map(parseMessageDates);
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const ts =
      timestamp instanceof Date ? timestamp.getTime() : Number(timestamp);
    return await arenaFetch(
      `/api/messages/delete-after?chatId=${encodeURIComponent(chatId)}&timestamp=${ts}`,
      { method: "DELETE" }
    );
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const result = await arenaFetch<{ count: number }>(
      `/api/messages/count?userId=${encodeURIComponent(id)}&hours=${differenceInHours}`
    );
    return result.count;
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

// ─── Votes ───────────────────────────────────────────────────

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    return await arenaFetch(`/api/votes`, {
      method: "POST",
      body: JSON.stringify({ chatId, messageId, type }),
    });
  } catch {
    throw new ChatbotError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await arenaFetch<any[]>(
      `/api/votes/by-chat?chatId=${encodeURIComponent(id)}`
    );
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

// ─── Documents ───────────────────────────────────────────────

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await arenaFetch(`/api/documents`, {
      method: "POST",
      body: JSON.stringify({ id, title, kind, content, userId }),
    });
  } catch {
    throw new ChatbotError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const docs = await arenaFetch<any[]>(
      `/api/documents/by-id?id=${encodeURIComponent(id)}`
    );
    return docs.map((d) => parseDocumentDates(d)!);
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const doc = await arenaFetch<any>(
      `/api/documents/latest?id=${encodeURIComponent(id)}`
    );
    return parseDocumentDates(doc);
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    const ts =
      timestamp instanceof Date ? timestamp.getTime() : Number(timestamp);
    const docs = await arenaFetch<any[]>(
      `/api/documents/delete-after?id=${encodeURIComponent(id)}&timestamp=${ts}`,
      { method: "DELETE" }
    );
    return docs.map((d) => parseDocumentDates(d)!);
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

// ─── Suggestions ─────────────────────────────────────────────

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await arenaFetch(`/api/suggestions`, {
      method: "POST",
      body: JSON.stringify({
        suggestions: suggestions.map((s) => ({
          ...s,
          createdAt:
            s.createdAt instanceof Date
              ? s.createdAt.getTime()
              : s.createdAt,
          documentCreatedAt:
            s.documentCreatedAt instanceof Date
              ? s.documentCreatedAt.getTime()
              : s.documentCreatedAt,
        })),
      }),
    });
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    const suggestions = await arenaFetch<any[]>(
      `/api/suggestions/by-document?documentId=${encodeURIComponent(documentId)}`
    );
    return suggestions.map(parseSuggestionDates);
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

// ─── Chat Visibility & Title ─────────────────────────────────

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await arenaFetch(`/api/chats/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ chatId, visibility }),
    });
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await arenaFetch(`/api/chats/title`, {
      method: "PATCH",
      body: JSON.stringify({ chatId, title }),
    });
  } catch (error) {
    console.warn("Failed to update title for chat", chatId, error);
    return;
  }
}

// ─── Streams ─────────────────────────────────────────────────

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    return await arenaFetch(`/api/streams`, {
      method: "POST",
      body: JSON.stringify({ streamId, chatId }),
    });
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({
  chatId,
}: {
  chatId: string;
}) {
  try {
    return await arenaFetch<string[]>(
      `/api/streams/by-chat?chatId=${encodeURIComponent(chatId)}`
    );
  } catch {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}
