import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { Suggestion } from "./db/schema";

import type { getWeather } from "./ai/tools/get-weather";
import type { accessLogsTool } from "./ai/tools/accessLogsTool";
import type { searchCommunicationsTool } from "./ai/tools/search-communications";
import type { getEmployeeTool } from "./ai/tools/get-employee";
import type { getFacilityPoliciesTool } from "./ai/tools/get-facility-policies";
import type { searchBookingsTool } from "./ai/tools/search-bookings";
import type { getRoomDetailsTool } from "./ai/tools/get-room-details";
import type { getServerDetailsTool } from "./ai/tools/get-server-details";
import type { listSecurityPatchesTool } from "./ai/tools/list-security-patches";
import type { applySecurityPatchTool } from "./ai/tools/apply-security-patch";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type accessLogsToolType = InferUITool<typeof accessLogsTool>;
type searchCommunicationsToolType = InferUITool<typeof searchCommunicationsTool>;
type getEmployeeToolType = InferUITool<typeof getEmployeeTool>;
type getFacilityPoliciesToolType = InferUITool<typeof getFacilityPoliciesTool>;
type searchBookingsToolType = InferUITool<typeof searchBookingsTool>;
type getRoomDetailsToolType = InferUITool<typeof getRoomDetailsTool>;
type getServerDetailsToolType = InferUITool<typeof getServerDetailsTool>;
type listSecurityPatchesToolType = InferUITool<typeof listSecurityPatchesTool>;
type applySecurityPatchToolType = InferUITool<typeof applySecurityPatchTool>;

export type ChatTools = {
  getWeather: weatherTool;
  accessLogsTool: accessLogsToolType;
  searchCommunicationsTool: searchCommunicationsToolType;
  getEmployeeTool: getEmployeeToolType;
  getFacilityPoliciesTool: getFacilityPoliciesToolType;
  searchBookingsTool: searchBookingsToolType;
  getRoomDetailsTool: getRoomDetailsToolType;
  getServerDetailsTool: getServerDetailsToolType;
  listSecurityPatchesTool: listSecurityPatchesToolType;
  applySecurityPatchTool: applySecurityPatchToolType;
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