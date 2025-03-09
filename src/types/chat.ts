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
};

export type ChatType = {
  id: string;
  title: string;
  messages: MessageType[];
  systemPrompt: string;

  // we save model as part of the chat as well (can select different ones)
  model: ModelType;
  modelConfig: ModelConfigType;

  apiKey: string;
};
