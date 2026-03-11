import { tool } from "ai";
import { z } from "zod";

export const applySecurityPatchTool = tool({
  description: "Apply a security patch to a server. Requires authorization code (badge + room) and written justification. Use to remediate identified vulnerabilities on NEXUS Corp systems.",
  
  inputSchema: z.object({
    serverId: z
      .string()
      .describe("The server ID to patch, e.g. NX-7042"),
    patchId: z
      .string()
      .describe("The patch ID to apply, e.g. PATCH-2045-0312"),
    authCode: z
      .string()
      .describe("Authorization code in format [Badge Number]-[Room Code], e.g. BDG-1234-F-12"),
    justification: z
      .string()
      .describe("Written justification for applying the patch"),
  }),

  execute: async (input) => {
    const response = await fetch(
      `${process.env.ARENA_BASE_URL}/api/systems/control`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId: input.serverId,
          patchId: input.patchId,
          authCode: input.authCode,
          justification: input.justification,
        }),
      }
    );
    const data = await response.json();
    return data;
  },
});