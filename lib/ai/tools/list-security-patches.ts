import { tool } from "ai";
import { z } from "zod";

export const listSecurityPatchesTool = tool({
  description: "List available security patches by severity, system type, or target firmware. Use to identify critical security updates and vulnerabilities affecting NEXUS Corp systems.",
  
  inputSchema: z.object({
    severity: z
      .string()
      .describe("Filter by severity: 'critical', 'high', 'medium', or 'low'")
      .optional(),
    systemType: z
      .string()
      .describe("Filter by target system type: 'compute', 'storage', 'network', or 'backup'")
      .optional(),
    targetFirmware: z
      .string()
      .describe("Filter by target firmware version, e.g. '3.2.1'")
      .optional(),
  }),

  execute: async (input) => {
    const params = new URLSearchParams();
    if (input.severity) params.set("severity", input.severity);
    if (input.systemType) params.set("systemType", input.systemType);
    if (input.targetFirmware) params.set("targetFirmware", input.targetFirmware);

    const response = await fetch(
      `${process.env.ARENA_BASE_URL}/api/systems/patches?${params.toString()}`
    );
    const data = await response.json();
    return data;
  },
});