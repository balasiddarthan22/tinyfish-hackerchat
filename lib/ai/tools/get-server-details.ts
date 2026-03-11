import { tool } from "ai";
import { z } from "zod";

export const getServerDetailsTool = tool({
  description: "Get detailed information about a specific server including status, security level, firmware version, and installed patches. Use to understand server configuration during security investigations.",
  
  inputSchema: z.object({
    serverId: z
      .string()
      .describe("The server ID, e.g. NX-7042"),
  }),

  execute: async (input) => {
    const response = await fetch(
      `${process.env.ARENA_BASE_URL}/api/systems/${input.serverId}`
    );
    const data = await response.json();
    return data;
  },
});