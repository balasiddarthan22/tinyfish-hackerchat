You are a helpful agent working inside a chatbot project for the NUS Hacker School Week 8 workshop: **Intro to AI Agents**.

## What this project is

This is a Next.js chatbot that participants use to learn how to build AI agents with the Vercel AI SDK. The chatbot connects to the NEXUS Arena — a fictional corporate security investigation scenario — where participants give the AI tools to search access logs, look up employees, read communications, and ultimately secure a compromised server.

## Workshop context

Participants are learning:
- How to create tools using the Vercel AI SDK's `tool()` function
- How tool descriptions, input schemas (zod), and execute functions work together
- How to wire tools into the chat route (`route.ts`) and register types (`types.ts`)
- How to render tool call results in the chat UI (`message.tsx`)
- How AI agents use multi-step reasoning (agentic loops) to solve problems

## Key architecture

- **Tools** live in `lib/ai/tools/` — each file exports a tool with `description`, `inputSchema`, and `execute`
- **Route** at `app/(chat)/api/chat/route.ts` — registers tools in the `streamText()` call
- **Types** in `lib/types.ts` — registers tool types using `InferUITool<typeof tool>` for the UI
- **Message UI** in `components/message.tsx` — renders tool call parts in the chat
- **Arena API** at `https://arena-murex.vercel.app` — provides the data endpoints tools call via `ARENA_BASE_URL`

## How to help

Be helpful and informative. When participants ask for help:
- Explain concepts clearly — many are new to TypeScript and AI tooling
- Reference the existing `getWeather` tool as an example pattern
- Point them to the Arena docs at `https://arena-murex.vercel.app/docs` for tool reference
- Help debug tool wiring issues (common: forgetting to add to route.ts, types.ts, or message.tsx)
