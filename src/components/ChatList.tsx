"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useChatContext } from "./ChatContext";
import { PlusIcon, MoreVertical, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatList() {
  const {
    chats,
    currentChatId,
    setCurrentChatId,
    createNewChat,
    deleteChat,
    updateChatTitle,
  } = useChatContext();

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  // Start editing a chat title
  const startEditing = (id: string, title: string) => {
    setEditingChatId(id);
    setEditTitle(title);
    setIsRenameModalOpen(true);
  };

  // Save edited chat title
  const saveTitle = () => {
    if (editTitle.trim() && editingChatId) {
      updateChatTitle(editingChatId, editTitle);
    }
    closeRenameModal();
  };

  // Close rename modal and reset state
  const closeRenameModal = () => {
    setIsRenameModalOpen(false);
    setEditingChatId(null);
  };

  return (
    <>
      <Card className="flex flex-col shadow-md gap-2 h-full">
        <CardHeader className="justify-start flex">
          <CardTitle className="text-lg flex justify-start items-center">
            <span>Your chats</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  `p-3 rounded-lg transition-colors flex items-center justify-between w-full`,
                  chat.id === currentChatId
                    ? "bg-gray-100 dark:bg-gray-800 shadow-sm"
                    : "hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
                onClick={() => setCurrentChatId(chat.id)}
              >
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-sm font-medium truncate">
                    {chat.title}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 opacity-70 hover:opacity-100 flex-shrink-0"
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(chat.id, chat.title);
                      }}
                    >
                      <Pencil size={16} className="mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
          <Button
            onClick={createNewChat}
            size="sm"
            variant="outline"
            className="h-8 mt-4"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </CardContent>
      </Card>

      {/* Rename Chat Modal */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Enter chat name"
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveTitle();
                } else if (e.key === "Escape") {
                  closeRenameModal();
                }
              }}
            />
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={closeRenameModal} size="sm">
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button onClick={saveTitle} size="sm">
              <Check size={16} className="mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
