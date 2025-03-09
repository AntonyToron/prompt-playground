"use client";
import { ChatInterface } from "./ChatInterface";
import { ChatList } from "./ChatList";

export function Layout() {
  return (
    <div className="flex flex-col p-4 border border-gray-200 rounded-lg bg-gray h-screen w-full">
      <div className="flex gap-4 h-full w-full">
        <ChatList />
        <ChatInterface />
      </div>
    </div>
  );
}
