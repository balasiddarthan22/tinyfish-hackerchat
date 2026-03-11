import { tool } from "ai";
import { z } from "zod";

export const getRoomDetailsTool = tool({
  description: "Get detailed information about a specific facility room including security level, capacity, equipment, and access requirements. Use to understand room characteristics during investigations.",
  
  inputSchema: z.object({
    roomId: z
      .string()
      .describe("The room ID, e.g. F-12"),
  }),

  execute: async (input) => {
    const response = await fetch(
      `${process.env.ARENA_BASE_URL}/api/facilities/rooms/${input.roomId}`
    );
    const data = await response.json();
    return data;
  },
});