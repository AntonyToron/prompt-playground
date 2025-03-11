"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatContext } from "./ChatContext";
import { ConfigDialog } from "./ConfigDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Sparkles, Bot, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChatInput } from "./ChatInput";
import { BorderBeam } from "./magicui/border-beam";
import { TextAnimate } from "./magicui/text-animate";
import { MessageType } from "@/types/chat";
import { MessageContent } from "./ui/message";
import { ModelBadge } from "./ModelBadge";

const MessageWrapper = ({
  role,
  children,
  className,
}: {
  role: MessageType["role"];
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex",
        role === "user" ? "justify-end" : "justify-start",
        className
      )}
    >
      <div
        className={cn(
          "rounded-lg p-4 border max-w-[80%] min-w-[40%]",
          role === "user"
            ? "text-gray-700 shadow-md border-gray-200"
            : "bg-gray-100 dark:bg-gray-800 shadow-md border-gray-200"
        )}
      >
        {children}
      </div>
    </div>
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
    <Card
      className={cn(
        "flex flex-col shadow-md h-full flex-1 pt-4 pb-0 gap-0 relative overflow-hidden"
      )}
    >
      <CardHeader className={cn("border-b pb-3 flex-shrink-0")}>
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
      <CardContent className={cn("flex-1 p-0 overflow-hidden relative")}>
        <div className={cn("px-4 h-full overflow-y-auto")}>
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
                  <MessageWrapper role={message.role} key={index}>
                    <MessageContent>{message.content}</MessageContent>
                  </MessageWrapper>
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
                    className={cn("flex justify-start max-w-[80%]")}
                  >
                    <MessageWrapper role={"assistant"}>
                      {currentResponse ? (
                        <MessageContent>{currentResponse}</MessageContent>
                      ) : (
                        <div
                          className={cn(
                            "flex space-x-2 items-center text-gray-500 relative whitespace-pre-wrap text-sm text-[0.85rem] leading-relaxed"
                          )}
                        >
                          <TextAnimate
                            animation="blurInUp"
                            by="character"
                            once
                            className="w-full min-w-md"
                          >
                            Generating response...
                          </TextAnimate>
                        </div>
                      )}
                    </MessageWrapper>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </CardContent>
      <div className="flex-shrink-0 relative overflow-hidden">
        <ChatInput
          isLoading={isLoading}
          setCurrentResponse={setCurrentResponse}
          setIsLoading={setIsLoading}
        />
        {(isLoading || currentResponse) && (
          <BorderBeam duration={8} size={100} />
        )}
      </div>
    </Card>
  );
}
