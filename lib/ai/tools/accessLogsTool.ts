import { tool } from "ai";
import { z } from "zod";

export const accessLogsTool = tool({
  description: "Query access logs to investigate suspicious employee activity, identify unauthorized location access, or detect insider threats. Filter by employee ID, location, or time range.",
  
  inputSchema: z.object({
    employeeId: z
      .string()
      .describe("Filter by employee ID, e.g. EMP-047")
      .optional(),
    location: z
      .string()
      .describe("Filter by location name, e.g. 'Server Room B'")
      .optional(),
    startTime: z
      .string()
      .describe("Filter logs after this ISO timestamp, e.g. 2045-03-15T00:00:00Z")
      .optional(),
    endTime: z
      .string()
      .describe("Filter logs before this ISO timestamp, e.g. 2045-03-16T00:00:00Z")
      .optional(),
  }),

  execute: async (input) => {
    const params = new URLSearchParams();
    if (input.employeeId) params.set("employeeId", input.employeeId);
    if (input.location) params.set("location", input.location);
    if (input.startTime) params.set("startTime", input.startTime);
    if (input.endTime) params.set("endTime", input.endTime);

    const response = await fetch(
      `${process.env.ARENA_BASE_URL}/api/logs?${params.toString()}`
    );
    const data = await response.json();
    return data;
  },
});
