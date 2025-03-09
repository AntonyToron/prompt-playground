"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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
  model: ModelType;
};

// Model options
export const models: ModelType[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai" },
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    provider: "anthropic",
  },
  {
    id: "claude-3-sonnet-20240229",
    name: "Claude 3 Sonnet",
    provider: "anthropic",
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "anthropic",
  },
];

// Default configuration
const defaultModelConfig: ModelConfigType = {
  temperature: 0.7,
  topP: 1,
  topK: 40,
  maxTokens: 1000,
  headers: [],
};

// Local storage keys
const STORAGE_KEYS = {
  API_KEY: "aiPlayground_apiKey",
  CONFIG: "aiPlayground_config",
  CHAT_IDS: "aiPlayground_chatIds",
  CURRENT_CHAT_ID: "aiPlayground_currentChatId",
  STREAMING: "aiPlayground_streaming",
  CHAT_PREFIX: "aiPlayground_chat_",
};

// Create context with default value
type ChatContextType = {
  chats: ChatType[];
  currentChatId: string | null;
  setCurrentChatId: (id: string) => void;
  createNewChat: () => void;
  deleteChat: (id: string) => void;
  updateChatTitle: (id: string, title: string) => void;
  addMessageToCurrentChat: (message: MessageType) => void;
  clearCurrentChat: () => void;
  currentChat: ChatType | null;
  apiKey: string;
  setApiKey: (key: string) => void;
  modelConfig: ModelConfigType;
  setModelConfig: React.Dispatch<React.SetStateAction<ModelConfigType>>;
  updateSystemPrompt: (prompt: string) => void;
  updateModel: (model: ModelType) => void;
  streaming: boolean;
  setStreaming: (streaming: boolean) => void;
  abortController: AbortController | null;
  setAbortController: (controller: AbortController | null) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [modelConfig, setModelConfig] =
    useState<ModelConfigType>(defaultModelConfig);
  const [streaming, setStreaming] = useState<boolean>(true);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // Generate a unique ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Helper to create a default chat
  const createDefaultChat = (): ChatType => {
    return {
      id: generateId(),
      title: "New Chat",
      messages: [],
      systemPrompt: "",
      model: models[0],
    };
  };

  // Save a single chat to localStorage
  const saveChatToStorage = (chat: ChatType) => {
    localStorage.setItem(
      `${STORAGE_KEYS.CHAT_PREFIX}${chat.id}`,
      JSON.stringify(chat)
    );
  };

  // Get a single chat from localStorage
  const getChatFromStorage = (chatId: string): ChatType | null => {
    const chatJson = localStorage.getItem(
      `${STORAGE_KEYS.CHAT_PREFIX}${chatId}`
    );
    if (chatJson) {
      try {
        return JSON.parse(chatJson);
      } catch (e) {
        console.error(`Error parsing chat ${chatId}:`, e);
        return null;
      }
    }
    return null;
  };

  // Save chat IDs list to localStorage
  const saveChatIdsToStorage = (chatIds: string[]) => {
    localStorage.setItem(STORAGE_KEYS.CHAT_IDS, JSON.stringify(chatIds));
  };

  // Load saved data from localStorage
  useEffect(() => {
    // Load general settings
    const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const savedChatIds = localStorage.getItem(STORAGE_KEYS.CHAT_IDS);
    const savedCurrentChatId = localStorage.getItem(
      STORAGE_KEYS.CURRENT_CHAT_ID
    );
    const savedStreaming = localStorage.getItem(STORAGE_KEYS.STREAMING);

    if (savedApiKey) setApiKey(savedApiKey);

    if (savedConfig) {
      try {
        setModelConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Error parsing saved config:", e);
      }
    }

    // Load chat IDs and then load each chat
    let chatsList: ChatType[] = [];
    let initialCurrentChatId = null;

    if (savedChatIds) {
      try {
        const chatIds: string[] = JSON.parse(savedChatIds);
        chatsList = chatIds
          .map((id) => getChatFromStorage(id))
          .filter((chat): chat is ChatType => chat !== null);
      } catch (e) {
        console.error("Error parsing saved chat IDs:", e);
      }
    }

    // Create a default chat if no chats loaded
    if (chatsList.length === 0) {
      const defaultChat = createDefaultChat();
      chatsList = [defaultChat];
      initialCurrentChatId = defaultChat.id;
      saveChatToStorage(defaultChat);
      saveChatIdsToStorage([defaultChat.id]);
    } else if (savedCurrentChatId) {
      initialCurrentChatId = savedCurrentChatId;
    } else {
      initialCurrentChatId = chatsList[0].id;
    }

    setChats(chatsList);
    setCurrentChatId(initialCurrentChatId);

    if (savedStreaming) {
      try {
        setStreaming(JSON.parse(savedStreaming));
      } catch (e) {
        console.error("Error parsing streaming setting:", e);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(modelConfig));
    localStorage.setItem(STORAGE_KEYS.STREAMING, JSON.stringify(streaming));

    // Save chat IDs list
    const chatIds = chats.map((chat) => chat.id);
    saveChatIdsToStorage(chatIds);

    if (currentChatId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, currentChatId);
    }
  }, [
    apiKey,
    modelConfig,
    streaming,
    chats.map((c) => c.id).join(","),
    currentChatId,
  ]);

  // Get current chat
  const currentChat = currentChatId
    ? chats.find((chat) => chat.id === currentChatId) || null
    : null;

  // Create a new chat
  const createNewChat = () => {
    const newChat = createDefaultChat();
    setChats((prevChats) => [...prevChats, newChat]);
    setCurrentChatId(newChat.id);
    saveChatToStorage(newChat);
  };

  // Delete a chat
  const deleteChat = (id: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== id));

    // Remove from localStorage
    localStorage.removeItem(`${STORAGE_KEYS.CHAT_PREFIX}${id}`);

    // If the deleted chat was the current one, select another chat
    if (currentChatId === id) {
      const remainingChats = chats.filter((chat) => chat.id !== id);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        // If no chats remain, create a new one
        createNewChat();
      }
    }
  };

  // Update chat title
  const updateChatTitle = (id: string, title: string) => {
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === id) {
          const updatedChat = { ...chat, title };
          saveChatToStorage(updatedChat);
          return updatedChat;
        }
        return chat;
      })
    );
  };

  // Add message to current chat
  const addMessageToCurrentChat = (message: MessageType) => {
    if (!currentChatId) return;

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === currentChatId) {
          const updatedChat = {
            ...chat,
            messages: [...chat.messages, message],
          };
          saveChatToStorage(updatedChat);
          return updatedChat;
        }
        return chat;
      })
    );

    // Update title if this is the first user message
    if (message.role === "user") {
      const chat = chats.find((c) => c.id === currentChatId);
      if (chat && chat.title === "New Chat" && chat.messages.length === 0) {
        const newTitle =
          message.content.substring(0, 30) +
          (message.content.length > 30 ? "..." : "");
        updateChatTitle(currentChatId, newTitle);
      }
    }
  };

  // Clear current chat
  const clearCurrentChat = () => {
    if (!currentChatId) return;

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === currentChatId) {
          const updatedChat = {
            ...chat,
            messages: [],
            title: "New Chat",
          };
          saveChatToStorage(updatedChat);
          return updatedChat;
        }
        return chat;
      })
    );
  };

  // Update system prompt for current chat
  const updateSystemPrompt = (prompt: string) => {
    if (!currentChatId) return;

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === currentChatId) {
          const updatedChat = {
            ...chat,
            systemPrompt: prompt,
          };
          saveChatToStorage(updatedChat);
          return updatedChat;
        }
        return chat;
      })
    );
  };

  // Update model for current chat
  const updateModel = (model: ModelType) => {
    if (!currentChatId) return;

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === currentChatId) {
          const updatedChat = {
            ...chat,
            model,
          };
          saveChatToStorage(updatedChat);
          return updatedChat;
        }
        return chat;
      })
    );
  };

  const contextValue: ChatContextType = {
    chats,
    currentChatId,
    setCurrentChatId,
    createNewChat,
    deleteChat,
    updateChatTitle,
    addMessageToCurrentChat,
    clearCurrentChat,
    currentChat,
    apiKey,
    setApiKey,
    modelConfig,
    setModelConfig,
    updateSystemPrompt,
    updateModel,
    streaming,
    setStreaming,
    abortController,
    setAbortController,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};

// Hook for using the context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
