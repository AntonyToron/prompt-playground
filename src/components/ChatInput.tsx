import { useChatContext } from "./ChatContext";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Square } from "lucide-react";
import { toast } from "sonner";
import { MessageType } from "@/types/chat";
import { ChatRequestType } from "@/types/chat";

export function ChatInput({
  setCurrentResponse,
  isLoading,
  setIsLoading,
}: {
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  setCurrentResponse: (response: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputMessage, setInputMessage] = useState("");

  const {
    currentChat,
    addMessageToCurrentChat,
    streaming,
    abortController,
    setAbortController,
    setConfigDialogOpen,
  } = useChatContext();

  const { apiKey, modelConfig } = currentChat;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [inputMessage]);

  // Send message to AI
  const sendMessage = async () => {
    if (!apiKey) {
      toast("No API key", {
        description: "Press to configure an API key first",
        action: {
          label: "Configure",
          onClick: () => setConfigDialogOpen(true),
        },
      });
      return;
    }

    if (!inputMessage.trim() || !currentChat) {
      return;
    }

    // Add user message to chat context
    const userMessage: MessageType = {
      role: "user",
      content: inputMessage,
    };

    addMessageToCurrentChat(userMessage);

    // Clear the input and set loading state
    setInputMessage("");
    setIsLoading(true);
    setCurrentResponse("");

    // Create AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Format the messages for the API
      const formattedMessages = currentChat.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the current user message
      formattedMessages.push({
        role: "user",
        content: inputMessage,
      });

      // Call our API endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: formattedMessages,
          model: currentChat.model,
          apiKey: apiKey,
          systemPrompt: currentChat.systemPrompt,
          temperature: modelConfig.temperature,
          topP: modelConfig.topP,
          topK: modelConfig.topK,
          maxTokens: modelConfig.maxTokens,
          headers: modelConfig.headers,
          outputFormat: modelConfig.outputFormat,
        } satisfies ChatRequestType),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response from API");
      }

      if (streaming) {
        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Response body is not readable");

        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          setCurrentResponse(fullResponse);
        }

        // Add assistant response to messages - no animation transition, just replace the current response
        const assistantMessage: MessageType = {
          role: "assistant",
          content: fullResponse,
        };

        // Add the message directly and clear the current response state immediately
        addMessageToCurrentChat(assistantMessage);
        setCurrentResponse("");
      } else {
        // Handle non-streaming response
        const result = await response.json();
        const assistantMessage: MessageType = {
          role: "assistant",
          content: result.text || "",
        };
        addMessageToCurrentChat(assistantMessage);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log("Request was aborted");
        } else {
          console.error("Error sending message:", error);
          // Add error message if it's not an abort
          const errorMessage: MessageType = {
            role: "assistant",
            content: `Error: ${error.message || "Failed to get response"}`,
          };
          addMessageToCurrentChat(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  // Abort current request
  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setCurrentResponse("");
    }
  };

  return (
    <div className={cn("px-4 py-3 border-t h-full flex flex-col w-full")}>
      <div className={cn("relative flex items-center")}>
        <div className={cn("flex-grow relative")}>
          <Textarea
            ref={textareaRef}
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className={cn(
              "resize-none py-3 px-4 focus-visible:ring-0 focus-visible:ring-offset-0",
              "min-h-[50px] max-h-[150px] pr-14 border border-gray-200 shadow-sm w-full bg-white"
            )}
            disabled={isLoading}
          />
          <div
            className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 z-10"
            )}
          >
            {isLoading ? (
              <Button
                type="button"
                onClick={handleStop}
                size="icon"
                variant="ghost"
                className={cn(
                  "rounded-full h-10 w-10 bg-gray-200 hover:bg-gray-300 transition-colors"
                )}
              >
                <Square size={18} className={cn("text-gray-700")} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={sendMessage}
                disabled={!inputMessage.trim() || !apiKey}
                size="icon"
                className={cn(
                  "rounded-full h-10 w-10 bg-gray-200 hover:bg-gray-300 transition-colors"
                )}
              >
                <Send size={18} className={cn("text-gray-700")} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
