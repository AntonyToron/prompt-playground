"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useChatContext, MessageType } from "./ChatContext";
import { ConfigDialog } from "./ConfigDialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Square,
  Trash2,
  Sparkles,
  Bot,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChatInput } from "./ChatInput";

// MessageContent component for rendering message content with markdown formatting
const MessageContent = ({ content }: { content: string }) => {
  // Simple markdown parsing for code blocks
  const parts = content.split("```");

  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          return (
            <p
              key={index}
              className="whitespace-pre-wrap text-sm text-[0.85rem] leading-relaxed"
            >
              {part}
            </p>
          );
        } else {
          const [language, ...code] = part.split("\n");
          return (
            <pre
              key={index}
              className="bg-white dark:bg-gray-800 p-3 my-2 rounded-md overflow-x-auto"
            >
              <code className="text-xs font-mono">{code.join("\n")}</code>
            </pre>
          );
        }
      })}
    </>
  );
};

// Empty state component with animation
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4"
  >
    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
      <MessageSquare className="w-8 h-8 text-blue-500" />
    </div>
    <h3 className="text-xl font-medium">Start a new conversation</h3>
    <p className="text-center max-w-md">
      Select a model and start asking questions to test your prompts
    </p>
  </motion.div>
);

export function ChatInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { currentChat, clearCurrentChat } = useChatContext();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages, currentResponse]);

  // Model Badge Component
  const ModelBadge = ({
    model,
  }: {
    model: { name: string; provider: string };
  }) => (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
      )}
    >
      {model.provider === "OpenAI" ? <Sparkles size={14} /> : <Bot size={14} />}
      <span>{model.name}</span>
    </div>
  );

  if (!currentChat) {
    return (
      <Card className={cn("md:col-span-7 flex flex-col shadow-md h-full")}>
        <CardContent
          className={cn(
            "flex items-center justify-center h-full text-gray-500 pt-6"
          )}
        >
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col shadow-md h-full flex-1 pt-4 pb-0")}>
      <CardHeader className={cn("border-b pb-3")}>
        <div className={cn("flex items-center justify-between")}>
          <div>
            <CardTitle className={cn("text-xl")}>{currentChat.title}</CardTitle>
            <div className={cn("mt-1 flex items-center gap-2")}>
              <Badge variant="outline" className="w-fit">
                {currentChat.model.provider === "openai"
                  ? "OpenAI"
                  : "Anthropic"}
              </Badge>
              <ModelBadge model={currentChat.model} />
            </div>
          </div>
          <div className={cn("flex gap-2")}>
            <ConfigDialog />
            <Button
              variant="outline"
              onClick={clearCurrentChat}
              className={cn(
                "text-red-500 hover:text-red-600 hover:bg-red-50 shadow-sm hover:shadow"
              )}
            >
              <Trash2 className={cn("h-4 w-4")} />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn("flex-grow overflow-hidden flex flex-col p-0")}
      >
        <ScrollArea className={cn("flex-grow px-4 max-h-[calc(100vh-250px)]")}>
          {currentChat.messages.length === 0 ? (
            <div
              className={cn(
                "flex items-center justify-center h-full text-gray-500 py-10"
              )}
            >
              <EmptyState />
            </div>
          ) : (
            <div className={cn("space-y-4 py-4")}>
              <AnimatePresence initial={false} mode="sync">
                {/* Regular messages */}
                {currentChat.messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg p-3 border max-w-[80%]",
                        message.role === "user"
                          ? "bg-blue-100 text-blue-700 shadow-md border-blue-200"
                          : "bg-gray-100 dark:bg-gray-800 shadow-md border-gray-200"
                      )}
                    >
                      <MessageContent content={message.content} />
                    </div>
                  </div>
                ))}

                {/* Single assistant response element that handles both loading and streaming */}
                {(isLoading || currentResponse) && (
                  <motion.div
                    key="assistant-response"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      opacity: { duration: 0.3 },
                      y: { duration: 0.3 },
                    }}
                    className={cn("flex justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800 shadow-md"
                      )}
                      style={{
                        boxShadow:
                          "0 2px 5px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      {currentResponse ? (
                        <MessageContent content={currentResponse} />
                      ) : (
                        <div className={cn("flex space-x-2 items-center")}>
                          <div className={cn("flex space-x-1")}>
                            <motion.div
                              className={cn("w-2 h-2 bg-gray-400 rounded-full")}
                              animate={{ y: [0, -5, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.7,
                                delay: 0,
                              }}
                            />
                            <motion.div
                              className={cn("w-2 h-2 bg-gray-400 rounded-full")}
                              animate={{ y: [0, -5, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.7,
                                delay: 0.2,
                              }}
                            />
                            <motion.div
                              className={cn("w-2 h-2 bg-gray-400 rounded-full")}
                              animate={{ y: [0, -5, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.7,
                                delay: 0.4,
                              }}
                            />
                          </div>
                          <span className={cn("text-xs text-gray-500")}>
                            Generating response...
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        <ChatInput
          isLoading={isLoading}
          setCurrentResponse={setCurrentResponse}
          setIsLoading={setIsLoading}
        />
      </CardContent>
    </Card>
  );
}
