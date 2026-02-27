"use server";

import { z } from "zod";
import { createSession } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().min(1).max(64),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = loginSchema.parse({
      username: formData.get("username"),
    });

    const ARENA_BASE_URL = process.env.ARENA_BASE_URL;
    if (!ARENA_BASE_URL) {
      throw new Error("ARENA_BASE_URL is not set");
    }

    const response = await fetch(`${ARENA_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: validatedData.username }),
    });

    if (!response.ok) {
      return { status: "failed" };
    }

    const user = await response.json();

    await createSession({
      id: user.id,
      email: user.email, // username stored as email for compat
      type: "regular",
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }
};
