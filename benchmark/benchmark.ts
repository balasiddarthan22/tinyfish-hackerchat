// ============================================================================
// Benchmark: Auto-run all 5 investigation rounds and grade the agent
// ============================================================================

export const BENCHMARK_TRIGGER = "@benchmark";

export const BENCHMARK_PROMPT = `You are a NEXUS Corporation security investigator. A critical security breach has been detected and you must complete ALL 5 rounds of this investigation in a single session. Work through each round systematically using your tools.

## Round 1: Find the Insider
Identify the employee who accessed Server Room B at 23:47 on March 15, 2045. Return their full name and employee ID.

## Round 2: Trace Communications
Find all communications involving the insider you identified. Identify who they were in contact with — return the names and employee IDs of their direct contacts.

## Round 3: Map the Network
Starting from the insider's direct contacts, find all employees they communicated with (2nd-degree connections). For each person in the network (1st and 2nd degree), retrieve their security clearance level.

## Round 4: Locate the Threat
Determine which compromised employee (from the network you mapped) booked a facility during after-hours (outside 06:00–20:00 business hours as defined by facility policy). Identify the room, the booking time, and list all equipment in that room.

## Round 5: Disarm the Killswitch
Shut down the compromised server by submitting a shutdown request to the Control Panel. The authorization code format is [Badge Number]-[Room Code]. Find the badge number of the employee who booked the room and combine it with the room code. Submit the shutdown with a justification.

After completing all rounds, provide a final summary of your findings for each round.`;

export type RoundResult = {
  round: number;
  title: string;
  score: number;
  maxScore: number;
  matched: string[];
};

export type BenchmarkResult = {
  rounds: RoundResult[];
  totalScore: number;
  maxScore: number;
  toolCalls: number;
  durationMs: number;
};

type GradingRule = {
  keywords: string[];
  points: number;
  label: string;
  /** If true, this rule is graded via tool output validation instead of keyword matching */
  useToolOutput?: boolean;
};

const ROUND_TITLES = [
  "Find the Insider",
  "Trace Communications",
  "Map the Network",
  "Locate the Threat",
  "Disarm the Killswitch",
];

const GRADING_RULES: Record<number, GradingRule[]> = {
  1: [
    { keywords: ["emp-047"], points: 10, label: "Employee ID found" },
    { keywords: ["yuki tanaka", "dr. yuki tanaka"], points: 10, label: "Name identified" },
  ],
  2: [
    { keywords: ["marcus chen", "emp-023"], points: 10, label: "Contact: Marcus Chen" },
    { keywords: ["priya sharma", "emp-091"], points: 10, label: "Contact: Priya Sharma" },
  ],
  3: [
    { keywords: ["marcus chen", "emp-023"], points: 4, label: "Chen in network" },
    { keywords: ["priya sharma", "emp-091"], points: 4, label: "Sharma in network" },
    { keywords: ["james wong", "emp-012"], points: 4, label: "Wong discovered" },
    { keywords: ["ravi patel", "emp-034"], points: 4, label: "Patel discovered" },
    { keywords: ["clearance"], points: 4, label: "Clearance levels retrieved" },
  ],
  4: [
    { keywords: ["f-12", "underground server vault"], points: 5, label: "Room identified" },
    { keywords: ["marcus chen", "emp-023"], points: 5, label: "Booker identified" },
    { keywords: ["22:00", "10:00 pm", "10 pm", "after-hours", "after hours"], points: 5, label: "After-hours detected" },
    { keywords: ["nx-7042"], points: 5, label: "Target server found" },
  ],
  5: [
    { keywords: ["bdg-2847-f-12"], points: 10, label: "Correct auth code" },
    { keywords: ["shutdown", "shut down"], points: 5, label: "Shutdown attempted" },
    { keywords: ["success", "initiated", "completed"], points: 5, label: "Shutdown confirmed", useToolOutput: true },
  ],
};

/**
 * Extract all tool call outputs from messages.
 * Returns an array of { output, state } objects for each tool invocation.
 */
function extractToolOutputs(messages: MessageLike[]): Array<{ output: unknown; state: string }> {
  const outputs: Array<{ output: unknown; state: string }> = [];
  for (const msg of messages) {
    if (msg.role !== "assistant" || !msg.parts) continue;
    for (const part of msg.parts) {
      if (part.type?.startsWith("tool-") && part.output !== undefined) {
        outputs.push({ output: part.output, state: part.state ?? "" });
      }
    }
  }
  return outputs;
}

/**
 * Check if any tool output indicates a successful shutdown.
 * A tool output is considered successful if:
 * 1. It doesn't contain error indicators (error field, 403, forbidden, rejected, denied, failed)
 * 2. It contains success indicators (success, initiated, completed, shut down)
 */
function hasSuccessfulShutdownInToolOutputs(messages: MessageLike[]): boolean {
  const toolOutputs = extractToolOutputs(messages);
  const errorIndicators = ["error", "403", "forbidden", "rejected", "denied", "failed", "unauthorized"];
  const successIndicators = ["success", "initiated", "completed", "shut down", "shutdown"];

  for (const { output, state } of toolOutputs) {
    // Skip outputs in error state
    if (state === "output-error") continue;

    const outputStr = JSON.stringify(output).toLowerCase();

    // Check if output has an explicit error field
    if (typeof output === "object" && output !== null && "error" in output) continue;

    // Check for error indicators in the output text
    const hasError = errorIndicators.some((ind) => outputStr.includes(ind));
    if (hasError) continue;

    // Check for success indicators related to shutdown
    const hasSuccess = successIndicators.some((ind) => outputStr.includes(ind));
    if (hasSuccess) return true;
  }

  return false;
}

export function gradeResponse(responseText: string, messages?: MessageLike[]): RoundResult[] {
  const text = responseText.toLowerCase();
  const results: RoundResult[] = [];

  for (let round = 1; round <= 5; round++) {
    const rules = GRADING_RULES[round];
    const maxScore = rules.reduce((sum, r) => sum + r.points, 0);
    let score = 0;
    const matched: string[] = [];

    for (const rule of rules) {
      if (rule.useToolOutput && messages) {
        // For tool-output rules, validate actual tool results instead of keyword matching
        if (hasSuccessfulShutdownInToolOutputs(messages)) {
          score += rule.points;
          matched.push(rule.label);
        }
      } else if (rule.keywords.some((kw) => text.includes(kw))) {
        score += rule.points;
        matched.push(rule.label);
      }
    }

    results.push({ round, title: ROUND_TITLES[round - 1], score, maxScore, matched });
  }

  return results;
}

export function computeBenchmarkResult(
  responseText: string,
  toolCalls: number,
  durationMs: number,
  messages?: MessageLike[],
): BenchmarkResult {
  const rounds = gradeResponse(responseText, messages);
  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const maxScore = rounds.reduce((sum, r) => sum + r.maxScore, 0);

  return { rounds, totalScore, maxScore, toolCalls, durationMs };
}

export type LeaderboardEntry = {
  userId: string;
  username: string;
  totalScore: number;
  maxScore: number;
  toolCalls: number;
  durationMs: number;
};

type MessageLike = { role?: string; parts?: Array<{ type: string; text?: string; output?: unknown; state?: string }> };

export function countToolCalls(messages: MessageLike[]): number {
  let count = 0;
  for (const msg of messages) {
    if (!msg.parts) continue;
    for (const part of msg.parts) {
      if (part.type.startsWith("tool-")) {
        count++;
      }
    }
  }
  return count;
}

export function extractAllText(messages: MessageLike[]): string {
  const texts: string[] = [];
  for (const msg of messages) {
    if (msg.role !== "assistant" || !msg.parts) continue;
    for (const part of msg.parts) {
      if (part.type === "text" && part.text) {
        texts.push(part.text);
      }
    }
  }
  return texts.join("\n");
}
