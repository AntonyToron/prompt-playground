// components/ConfigDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SettingsIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

import { useChatContext, models } from "./ChatContext";

export function ConfigDialog() {
  const {
    apiKey,
    setApiKey,
    currentChat,
    updateModel,
    modelConfig,
    setModelConfig,
    streaming,
    setStreaming,
    updateSystemPrompt,
    configDialogOpen: open,
    setConfigDialogOpen: setOpen,
  } = useChatContext();

  // Handle model selection
  const handleModelChange = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    if (model && currentChat) {
      updateModel(model);
    }
  };

  // Add a header to the model config
  const addHeader = () => {
    setModelConfig((prevConfig) => ({
      ...prevConfig,
      headers: [...prevConfig.headers, { key: "", value: "" }],
    }));
  };

  // Update a header in the model config
  const updateHeader = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    setModelConfig((prevConfig) => {
      const updatedHeaders = [...prevConfig.headers];
      updatedHeaders[index][field] = value;
      return {
        ...prevConfig,
        headers: updatedHeaders,
      };
    });
  };

  // Remove a header from the model config
  const removeHeader = (index: number) => {
    setModelConfig((prevConfig) => {
      const updatedHeaders = [...prevConfig.headers];
      updatedHeaders.splice(index, 1);
      return {
        ...prevConfig,
        headers: updatedHeaders,
      };
    });
  };

  // Handle system prompt change in card
  const handleSystemPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    updateSystemPrompt(e.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-sm hover:shadow">
          <SettingsIcon className="h-4 w-4" />
          Configuration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>Model Configuration</DialogTitle>
          <DialogDescription>
            Adjust model parameters and API settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="model">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="params">Parameters</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="model-select">Model</Label>
              <Select
                value={currentChat?.model.id || ""}
                onValueChange={handleModelChange}
                disabled={!currentChat}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header-openai" disabled>
                    --- OpenAI Models ---
                  </SelectItem>
                  {models
                    .filter((model) => model.provider === "openai")
                    .map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  <SelectItem value="header-anthropic" disabled>
                    --- Anthropic Models ---
                  </SelectItem>
                  {models
                    .filter((model) => model.provider === "anthropic")
                    .map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">
                API Key (
                {currentChat?.model.provider === "openai"
                  ? "OpenAI"
                  : "Anthropic"}
                )
              </Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${
                  currentChat?.model.provider === "openai"
                    ? "OpenAI"
                    : "Anthropic"
                } API key`}
              />
              <p className="text-xs text-gray-500">
                Your API key is sent to our servers but never stored (only
                locally on your browser).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="streaming"
                checked={streaming}
                onCheckedChange={setStreaming}
              />
              <Label htmlFor="streaming">Enable streaming responses</Label>
            </div>
          </TabsContent>

          <TabsContent value="params" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="temperature">
                    Temperature: {modelConfig.temperature}
                  </Label>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[modelConfig.temperature]}
                  onValueChange={([value]) =>
                    setModelConfig({ ...modelConfig, temperature: value })
                  }
                />
                <p className="text-xs text-gray-500">
                  Controls randomness (0 = deterministic, 1 = maximum
                  creativity)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="top-p">Top P: {modelConfig.topP}</Label>
                </div>
                <Slider
                  id="top-p"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[modelConfig.topP]}
                  onValueChange={([value]) =>
                    setModelConfig({ ...modelConfig, topP: value })
                  }
                />
                <p className="text-xs text-gray-500">
                  Nucleus sampling parameter
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="top-k">Top K: {modelConfig.topK}</Label>
                </div>
                <Slider
                  id="top-k"
                  min={1}
                  max={100}
                  step={1}
                  value={[modelConfig.topK]}
                  onValueChange={([value]) =>
                    setModelConfig({ ...modelConfig, topK: value })
                  }
                  disabled={currentChat?.model.provider === "openai"}
                />
                <p className="text-xs text-gray-500">
                  {currentChat?.model.provider === "openai"
                    ? "Top K is only available for Anthropic models"
                    : "Limits vocabulary to top K tokens"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="max-tokens">
                    Max Tokens: {modelConfig.maxTokens}
                  </Label>
                </div>
                <Slider
                  id="max-tokens"
                  min={10}
                  max={4000}
                  step={10}
                  value={[modelConfig.maxTokens]}
                  onValueChange={([value]) =>
                    setModelConfig({ ...modelConfig, maxTokens: value })
                  }
                />
                <p className="text-xs text-gray-500">
                  Maximum number of tokens to generate in the response
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="headers" className="space-y-4 py-4">
            <div className="space-y-4">
              {modelConfig.headers.map((header, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => updateHeader(index, "key", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) =>
                      updateHeader(index, "value", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeHeader(index)}
                    className="shrink-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addHeader} className="w-full">
                Add Header
              </Button>
              <p className="text-xs text-gray-500">
                Custom HTTP headers to send with API requests
              </p>
            </div>
          </TabsContent>

          <TabsContent value="system" className="py-4 space-y-2">
            <div>
              <div className="flex justify-between items-center font-medium text-sm">
                System prompt
              </div>
              <div className="text-gray-400 text-xs">
                Set context for the conversation
              </div>
            </div>
            <Textarea
              placeholder="Enter a system prompt to guide the AI's behavior..."
              value={currentChat?.systemPrompt || ""}
              onChange={handleSystemPromptChange}
              className="min-h-[200px] resize-none"
              disabled={!currentChat}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
