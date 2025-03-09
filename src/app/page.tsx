"use client";

import { Layout } from "@/components/ChatLayout";
import { ChatProvider } from "@/components/ChatContext";

export default function Playground() {
  return (
    <ChatProvider>
      <Layout />
    </ChatProvider>
  );
}
