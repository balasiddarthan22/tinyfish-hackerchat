import type { Geo } from "@vercel/functions";
import type { ArtifactKind } from "@/components/artifact";

// ============================================================================
// WORKSHOP: System Prompt
// ============================================================================
// This is the base personality/behavior for your AI assistant.
// Customize this to change how your agent responds.
//
// When you add tools, update this prompt to tell the AI about its
// capabilities — e.g. "You can search the web and look up weather."
// ============================================================================

export const regularPrompt = `You are a friendly assistant! Keep your responses concise and helpful.

When asked to write, create, or help with something, just do it directly. Don't ask clarifying questions unless absolutely necessary - make reasonable assumptions and proceed with the task.`;

export type RequestHints = {
  latitude: Geo["latitude"];
  longitude: Geo["longitude"];
  city: Geo["city"];
  country: Geo["country"];
};

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}
`;

export const systemPrompt = ({
  selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);

  // ================================================================
  // WORKSHOP: Customize your system prompt here
  // ================================================================
  // Tell the AI what tools it has and how to use them. Example:
  //   return `${regularPrompt}\n\nYou have access to a weather tool
  //   and a web search tool. Use them when relevant.\n\n${requestPrompt}`;
  // ================================================================

  return `${regularPrompt}\n\n${requestPrompt}`;
};

// ── Internal: used by the artifacts system (you can ignore these) ──

export const codePrompt = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:
1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
`;

export const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind
) => {
  const mediaType = type === "code" ? "code snippet" : type === "sheet" ? "spreadsheet" : "document";
  return `Improve the following contents of the ${mediaType} based on the given prompt.\n\n${currentContent}`;
};

// Used to auto-generate chat titles
export const titlePrompt = `Generate a short chat title (2-5 words) summarizing the user's message.

Output ONLY the title text. No prefixes, no formatting.

Examples:
- "what's the weather in nyc" → Weather in NYC
- "help me write an essay about space" → Space Essay Help
- "hi" → New Conversation
- "debug my python code" → Python Debugging

Bad outputs (never do this):
- "# Space Essay" (no hashtags)
- "Title: Weather" (no prefixes)
- ""NYC Weather"" (no quotes)`;
