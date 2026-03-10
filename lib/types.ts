import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { Suggestion } from "./db/schema";

// ── Example tool type import (weather) ──
import type { getWeather } from "./ai/tools/get-weather";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// ============================================================================
// WORKSHOP: Register your tool types here
// ============================================================================
// Each tool you create needs a type so the UI knows how to render its results.
//
// Steps:
//   1. Import your tool:
//        import type { myTool } from "./ai/tools/my-tool";
//
//   2. Create a type alias:
//        type myToolType = InferUITool<typeof myTool>;
//      (If your tool is a factory function, use: InferUITool<ReturnType<typeof myTool>>)
//
//   3. Add it to ChatTools below:
//        myTool: myToolType;
// ============================================================================

// ── Example: weather tool type ──
type weatherTool = InferUITool<typeof getWeather>;

// ── ADD YOUR TOOL TYPES HERE ──
// type myToolType = InferUITool<typeof myTool>;

export type ChatTools = {
  // ── Example tool ──
  getWeather: weatherTool;

  // ── ADD YOUR TOOLS HERE ──
  // myTool: myToolType;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  "chat-title": string;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
