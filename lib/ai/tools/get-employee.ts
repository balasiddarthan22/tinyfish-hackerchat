import { tool } from "ai";
import { z } from "zod";

export const getEmployeeTool = tool({
  description: "Look up employee information by ID. Get details about a specific employee to understand their role, department, and other relevant information for security investigations.",
  
  inputSchema: z.object({
    employeeId: z
      .string()
      .describe("The employee ID, e.g. EMP-023"),
  }),

  execute: async (input) => {
    const response = await fetch(
      `${process.env.ARENA_BASE_URL}/api/employees/${input.employeeId}`
    );
    const data = await response.json();
    return data;
  },
});