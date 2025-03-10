"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  SetStateAction,
} from "react";
import {
  ModelType,
  ChatType,
  MessageType,
  ModelConfigType,
} from "@/types/chat";
import { MODELS } from "@/constants/models";
import { v4 as uuid } from "uuid";
import { setLocalStorage, getLocalStorage } from "@/utils/localStorage";

// Default configuration
const DEFAULT_MODEL_CONFIG: ModelConfigType = {
  temperature: 0.7,
  topP: 1,
  topK: 40,
  maxTokens: 1000,
  headers: [],
};

const STORAGE_KEY = "playground_chats";

// Create context with default value
type ChatContextType = {
  chats: ChatType[];

  currentChatId: string | null;
  setCurrentChatId: (id: string) => void;
  updateCurrentChat: (updates: Partial<ChatType>) => void;
  addMessageToCurrentChat: (message: MessageType) => void;

  updateChatTitle: (id: string, title: string) => void;

  createNewChat: (init?: Partial<ChatType>) => void;
  deleteChat: (id: string) => void;
  clearCurrentChat: () => void;
  currentChat: ChatType;

  streaming: boolean;
  setStreaming: (streaming: boolean) => void;

  abortController: AbortController | null;
  setAbortController: (controller: AbortController | null) => void;

  configDialogOpen: boolean;
  setConfigDialogOpen: (open: boolean) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [chats, _setChats] = useState<ChatType[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState<boolean>(true);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const createDefaultChat = (): ChatType => {
    return {
      id: uuid(),
      title: "New Chat",
      messages: [],
      systemPrompt: "",
      model: MODELS[0],
      apiKey: "",
      modelConfig: { ...DEFAULT_MODEL_CONFIG },
    };
  };

  const setChats = (update: SetStateAction<ChatType[]>) => {
    if (typeof update === "function") {
      _setChats((prev) => {
        const newChats = update(prev);
        setLocalStorage(STORAGE_KEY, JSON.stringify(newChats));
        return newChats;
      });
    } else {
      _setChats(update);
      setLocalStorage(STORAGE_KEY, JSON.stringify(update));
    }
  };

  // Load saved data from localStorage
  useEffect(() => {
    const savedChatsValue = getLocalStorage(STORAGE_KEY);
    let savedChats: ChatType[] | undefined;
    let initialCurrentChatId: string | undefined;

    if (savedChatsValue) {
      try {
        savedChats = JSON.parse(savedChatsValue);
      } catch (e) {
        console.error("Error parsing saved chat IDs:", e);
      }
    }

    // Create a default chat if no chats loaded
    if (!savedChats || savedChats.length === 0) {
      const defaultChat = createDefaultChat();
      savedChats = [defaultChat];
    }

    initialCurrentChatId = savedChats[0].id;

    setChats(savedChats);
    setCurrentChatId(initialCurrentChatId);
  }, []);

  // Get current chat
  const currentChat = currentChatId
    ? chats.find((chat) => chat.id === currentChatId) || null
    : null;

  // Create a new chat
  const createNewChat = (init?: Partial<ChatType>) => {
    const newChat = createDefaultChat();
    setChats((prevChats) => {
      const lastChat = prevChats.at(-1);
      if (lastChat && !init) {
        const { id, messages, title, ...propsToInherit } = lastChat;
        return [...prevChats, { ...newChat, ...propsToInherit }];
      }

      return [...prevChats, { ...newChat, ...init }];
    });
    setCurrentChatId(newChat.id);
  };

  // Delete a chat
  const deleteChat = (id: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== id));

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
          return updatedChat;
        }
        return chat;
      })
    );
  };

  const updateCurrentChat = (updates: Partial<ChatType>): void => {
    if (!currentChatId) return;

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === currentChatId) {
          const updatedChat = {
            ...chat,
            ...updates,
          };
          return updatedChat;
        }
        return chat;
      })
    );
  };

  if (!currentChat) {
    // shouldnt show anything until we've loaded in
    return null;
  }

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
    updateCurrentChat,
    streaming,
    setStreaming,
    abortController,
    setAbortController,
    configDialogOpen,
    setConfigDialogOpen,
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
