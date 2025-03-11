import { ToolSet } from "ai";

// Type definitions
export type MessageType = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ModelType = {
  id: string;
  name: string;
  provider: "openai" | "anthropic";
};

export type ModelConfigType = {
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  headers: { key: string; value: string }[];
  outputFormat?: {
    // schema = enforced specific json, json_object = any json
    type: "json_object" | "json_schema" | "text";

    // will enforce on frontend to be valid JSON
    schema?: string;
  };

  tools?: ToolSet;
};

export type ChatType = {
  id: string;
  title: string;
  description?: string;
  messages: MessageType[];
  systemPrompt: string;

  // we save model as part of the chat as well (can select different ones)
  model: ModelType;
  modelConfig: ModelConfigType;

  apiKey: string;
};

export type ChatRequestType = Pick<
  ChatType,
  "messages" | "model" | "apiKey" | "systemPrompt"
> &
  ModelConfigType;
