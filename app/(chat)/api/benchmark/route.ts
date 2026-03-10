import { auth } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";
import type { BenchmarkResult } from "@/benchmark/benchmark";

const ARENA_BASE_URL = process.env.ARENA_BASE_URL!;

// POST: Submit benchmark results to Convex
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const body = (await request.json()) as { result?: BenchmarkResult };
  const { result } = body;

  if (!result || typeof result.totalScore !== "number") {
    return Response.json({ error: "Invalid benchmark result" }, { status: 400 });
  }

  try {
    const res = await fetch(`${ARENA_BASE_URL}/api/benchmark/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        username: session.user.email,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        toolCalls: result.toolCalls,
        durationMs: result.durationMs,
        rounds: result.rounds,
      }),
    });

    if (!res.ok) {
      return Response.json({ error: "Failed to submit" }, { status: 502 });
    }
  } catch {
    return Response.json({ error: "Failed to submit" }, { status: 502 });
  }

  return Response.json({ success: true });
}

// GET: Fetch benchmark leaderboard from Convex
export async function GET() {
  try {
    const res = await fetch(`${ARENA_BASE_URL}/api/benchmark/leaderboard`);
    if (!res.ok) return Response.json([]);
    return Response.json(await res.json());
  } catch {
    return Response.json([]);
  }
}
