import { tool } from "ai";
import { z } from "zod";

export const getFacilityPoliciesTool = tool({
  description: "Look up facility policies by category to understand security protocols, access requirements, and emergency procedures. Use when investigating policy violations or understanding facility regulations.",
  
  inputSchema: z.object({
    category: z
      .string()
      .describe("Filter by category: 'access', 'security', 'facilities', or 'emergency'")
      .optional(),
  }),

  execute: async (input) => {
    const params = new URLSearchParams();
    if (input.category) params.set("category", input.category);

    const response = await fetch(
      `${process.env.ARENA_BASE_URL}/api/facilities/policies?${params.toString()}`
    );
    const data = await response.json();
    return data;
  },
});