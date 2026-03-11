import { tool } from "ai";
import { z } from "zod";

export const searchBookingsTool = tool({
  description: "Search facility room bookings by room ID, employee, or date range. Investigate unauthorized room usage, track employee movements, or identify suspicious booking patterns.",
  
  inputSchema: z.object({
    roomId: z
      .string()
      .describe("Filter by room ID, e.g. F-12")
      .optional(),
    bookedBy: z
      .string()
      .describe("Filter by employee ID who made the booking, e.g. EMP-023")
      .optional(),
    startDate: z
      .string()
      .describe("Filter bookings starting after this date")
      .optional(),
    endDate: z
      .string()
      .describe("Filter bookings ending before this date")
      .optional(),
    page: z
      .number()
      .describe("Page number (default: 1)")
      .optional(),
  }),

  execute: async (input) => {
    const params = new URLSearchParams();
    if (input.roomId) params.set("roomId", input.roomId);
    if (input.bookedBy) params.set("bookedBy", input.bookedBy);
    if (input.startDate) params.set("startDate", input.startDate);
    if (input.endDate) params.set("endDate", input.endDate);
    if (input.page) params.set("page", input.page.toString());

    const response = await fetch(
      `${process.env.ARENA_BASE_URL}/api/facilities/bookings?${params.toString()}`
    );
    const data = await response.json();
    return data;
  },
});