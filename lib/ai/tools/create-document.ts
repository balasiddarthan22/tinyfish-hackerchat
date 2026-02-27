// ============================================================================
// EXAMPLE TOOL: Create Document (Artifact)
// ============================================================================
// This is an advanced tool that creates artifacts (documents, code, sheets).
// It demonstrates writing custom data events to the stream to update the UI.
//
// Key concepts:
//   - Factory pattern: function that takes session/dataStream, returns tool
//   - Custom data events via dataStream.write() to control the artifact panel
//   - Delegates to artifact handlers (lib/artifacts/) for content generation
//
// To wire this up:
//   1. Import in route.ts
//   2. Add to tools: { createDocument: createDocument({ session, dataStream }) }
//   3. Include artifactsPrompt in your system prompt (lib/ai/prompts.ts)
// ============================================================================

import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "@/lib/auth";
import { z } from "zod";
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from "@/lib/artifacts/server";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";

type CreateDocumentProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description:
      "Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.",
    inputSchema: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }) => {
      const id = generateUUID();

      dataStream.write({
        type: "data-kind",
        data: kind,
        transient: true,
      });

      dataStream.write({
        type: "data-id",
        data: id,
        transient: true,
      });

      dataStream.write({
        type: "data-title",
        data: title,
        transient: true,
      });

      dataStream.write({
        type: "data-clear",
        data: null,
        transient: true,
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === kind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      await documentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        session,
      });

      dataStream.write({ type: "data-finish", data: null, transient: true });

      return {
        id,
        title,
        kind,
        content: "A document was created and is now visible to the user.",
      };
    },
  });
