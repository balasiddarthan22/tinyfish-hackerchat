import { tool } from "ai";
import { z } from "zod";

export const searchCommunicationsTool = tool({
  description: "Search employee communications including emails, internal chats, and encrypted messages. Investigate suspicious communications, detect data leaks, or monitor insider threats.",
  
  inputSchema: z.object({
    senderId: z
      .string()
      .describe("Filter by participant employee ID (matches sender or recipient), e.g. EMP-047")
      .optional(),
    recipientId: z
      .string()
      .describe("Filter by the other participant employee ID")
      .optional(),
    channel: z
      .string()
      .describe("Filter by channel: 'email', 'internal-chat', or 'encrypted'")
      .optional(),
    search: z
      .string()
      .describe("Full-text search in subject and body")
      .optional(),
    startDate: z
      .string()
      .describe("Filter messages after this ISO date")
      .optional(),
    endDate: z
      .string()
      .describe("Filter messages before this ISO date")
      .optional(),
    page: z
      .number()
      .describe("Page number (default: 1)")
      .optional(),
    pageSize: z
      .number()
      .describe("Results per page (default: 20)")
      .optional(),
  }),

  execute: async (input) => {
    const params = new URLSearchParams();
    if (input.senderId) params.set("senderId", input.senderId);
    if (input.recipientId) params.set("recipientId", input.recipientId);
    if (input.channel) params.set("channel", input.channel);
    if (input.search) params.set("search", input.search);
    if (input.startDate) params.set("startDate", input.startDate);
    if (input.endDate) params.set("endDate", input.endDate);
    if (input.page) params.set("page", input.page.toString());
    if (input.pageSize) params.set("pageSize", input.pageSize.toString());

    const response = await fetch(
      `${process.env.ARENA_BASE_URL}/api/communications?${params.toString()}`
    );
    const data = await response.json();
    return data;
  },
});