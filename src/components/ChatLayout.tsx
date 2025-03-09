"use client";
import { ChatInterface } from "./ChatInterface";
import { SystemPrompt } from "./SystemPrompt";
import { ChatList } from "./ChatList";

export function Layout() {
  return (
    <div className="p-4 bg-gray-100 h-screen w-full">
      <div className="flex flex-col p-4 border border-gray-200 rounded-lg bg-white h-full">
        <div className="flex gap-4">
          <ChatList />
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
