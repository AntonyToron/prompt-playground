"use client";

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

import { Alert, AlertDescription } from "@/components/ui/alert";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  SettingsIcon,
  AlertCircle,
  FileJson,
  Loader2,
  CurlyBraces,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ChatType } from "@/types/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

import { useChatContext } from "./ChatContext";
import { MODELS } from "@/constants/models";
import { useState } from "react";
import { EXAMPLE_JSON_SCHEMA } from "@/constants/models";

const SelectItemWithDescription = ({
  value,
  children,
  description,
}: {
  value: string;
  children: React.ReactNode;
  description: string;
}) => {
  return (
    <SelectItem value={value} className="py-2">
      <div>
        <div>{children}</div>
        <div className="text-xs text-gray-400 mt-0.5">{description}</div>
      </div>
    </SelectItem>
  );
};

const OUTPUT_FORMATS: {
  type: Required<ChatType["modelConfig"]>["outputFormat"]["type"];
  description: string;
  label: string;
}[] = [
  {
    type: "text",
    label: "Text",
    description: "Plain text",
  },
  {
    type: "json_object",
    label: "JSON object",
    description: "Guaranteed JSON output",
  },
  {
    type: "json_schema",
    label: "JSON schema",
    description: "Guaranteed JSON of a particular format",
  },
];

const OutputFormatTab = ({
  updateModelConfig,
}: {
  updateModelConfig: (updates: Partial<ChatType["modelConfig"]>) => void;
}) => {
  const { currentChat } = useChatContext();

  const { modelConfig } = currentChat;

  const [jsonSchemaError, setJsonSchemaError] = useState<string | null>(null);
  const [loadingTypescript, setLoadingTypescript] = useState(false);
  const [typescript, setTypescript] = useState("");
  const [typescriptOpen, setTypescriptOpen] = useState(false);

  const handleOutputFormatChange = (
    value: Required<ChatType["modelConfig"]>["outputFormat"]["type"]
  ) => {
    updateModelConfig({
      outputFormat: {
        ...currentChat.modelConfig.outputFormat,
        type: value || "text",
      },
    });
  };

  const handleJsonSchemaChange = (schemaText: string) => {
    updateModelConfig({
      outputFormat: {
        ...currentChat.modelConfig.outputFormat,
        type: currentChat.modelConfig.outputFormat?.type || "json_schema",
        schema: schemaText,
      },
    });

    try {
      JSON.parse(schemaText);
      setJsonSchemaError(null);
    } catch (error) {
      setJsonSchemaError("Invalid JSON schema");
    }
  };

  const supportsJsonFormat = currentChat?.model.provider === "openai";

  return (
    <>
      <div>
        <div className="flex justify-between items-center font-medium text-sm">
          Output format
        </div>
        <div className="text-gray-400 text-xs">
          Specify if output should be structured e.g. JSON (supported in OpenAI
          models)
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Select
            value={modelConfig.outputFormat?.type || "text"}
            onValueChange={handleOutputFormatChange}
            disabled={!supportsJsonFormat}
          >
            <SelectTrigger id="response-format">
              <div>
                {
                  OUTPUT_FORMATS.find(
                    (f) => f.type === modelConfig.outputFormat?.type
                  )?.label
                }
              </div>
            </SelectTrigger>
            <SelectContent>
              {OUTPUT_FORMATS.map((format) => {
                return (
                  <SelectItemWithDescription
                    key={format.type}
                    value={format.type}
                    description={format.description}
                  >
                    {format.label}
                  </SelectItemWithDescription>
                );
              })}
            </SelectContent>
          </Select>
          {modelConfig.outputFormat?.type === "json_schema" && (
            <>
              <Popover
                open={typescriptOpen}
                onOpenChange={setTypescriptOpen}
                // so that the scroll doesn't get intercepted incorrectly for
                // the content
                modal
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    onClick={async () => {
                      try {
                        setLoadingTypescript(true);
                        const response = await fetch(`/api/json`, {
                          method: "POST",
                          body: JSON.stringify({
                            schema: modelConfig.outputFormat?.schema,
                          }),
                          credentials: "include",
                        });
                        const json = await response.json();
                        const { typescript } = json;
                        setTypescript(typescript);
                        setTypescriptOpen(true);
                      } catch (err) {
                        setJsonSchemaError(`${err}`);
                      }
                      setLoadingTypescript(false);
                    }}
                  >
                    {loadingTypescript ? (
                      <Loader2 className="w-4 h-4 mr-2" />
                    ) : (
                      <FileJson className="w-4 h-4 mr-2" />
                    )}
                    Check typescript
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="max-w-2xl w-full p-0">
                  <ScrollArea className="h-64 sm:h-86 overflow-y-auto">
                    <div className="whitespace-pre text-gray-600 p-2 text-sm">
                      {typescript}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Button
                variant={"outline"}
                onClick={() => {
                  try {
                    const json = JSON.parse(
                      modelConfig.outputFormat?.schema || "{}"
                    );
                    handleJsonSchemaChange(JSON.stringify(json, null, 4));
                  } catch (err) {
                    toast("Invalid JSON format");
                  }
                }}
              >
                <CurlyBraces className="w-4 h-4 mr-2" />
                Auto-format
              </Button>
            </>
          )}
        </div>
        {!supportsJsonFormat && (
          <p className="text-xs text-gray-500">
            JSON response format is only available for OpenAI models
          </p>
        )}
      </div>

      {modelConfig.outputFormat?.type === "json_schema" && (
        <div className="space-y-2">
          <Textarea
            id="json-schema"
            placeholder={[
              ...EXAMPLE_JSON_SCHEMA.split("\n").slice(0, 5),
              "...",
            ].join("\n")}
            value={modelConfig.outputFormat.schema || ""}
            onChange={(e) => handleJsonSchemaChange(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
            disabled={!supportsJsonFormat}
          />
          {jsonSchemaError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{jsonSchemaError}</AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-gray-500">
            Define a JSON schema to structure the model's response format
          </p>
        </div>
      )}
    </>
  );
};

export function ConfigDialog() {
  const {
    currentChat,
    updateCurrentChat,
    streaming,
    setStreaming,
    configDialogOpen: open,
    setConfigDialogOpen: setOpen,
  } = useChatContext();

  const { modelConfig, apiKey } = currentChat;

  const setApiKey = (key: string) => {
    updateCurrentChat({ apiKey: key });
  };

  const handleModelChange = (modelId: string) => {
    const model = MODELS.find((m) => m.id === modelId);
    if (model && currentChat) {
      updateCurrentChat({ model });
    }
  };

  const addHeader = () => {
    const prevConfig = currentChat.modelConfig;
    updateCurrentChat({
      modelConfig: {
        ...prevConfig,
        headers: [...prevConfig.headers, { key: "", value: "" }],
      },
    });
  };

  const updateModelConfig = (updates: Partial<ChatType["modelConfig"]>) => {
    updateCurrentChat({
      modelConfig: {
        ...currentChat.modelConfig,
        ...updates,
      },
    });
  };

  const updateHeader = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const prevConfig = currentChat.modelConfig;
    const updatedHeaders = [...prevConfig.headers];
    updatedHeaders[index][field] = value;
    updateModelConfig({ headers: updatedHeaders });
  };

  const removeHeader = (index: number) => {
    const prevConfig = currentChat.modelConfig;
    const updatedHeaders = [...prevConfig.headers];
    updatedHeaders.splice(index, 1);
    updateModelConfig({ headers: updatedHeaders });
  };

  // Handle system prompt change in card
  const handleSystemPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    updateCurrentChat({ systemPrompt: e.target.value });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-sm hover:shadow">
          <SettingsIcon className="h-4 w-4" />
          Configuration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl shadow-lg w-full">
        <DialogHeader>
          <DialogTitle>Model Configuration</DialogTitle>
          <DialogDescription>
            Adjust model parameters and API settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="model">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="params">Parameters</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-64 sm:h-86 overflow-y-auto">
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
                    {MODELS.filter((model) => model.provider === "openai").map(
                      (model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      )
                    )}
                    <SelectItem value="header-anthropic" disabled>
                      --- Anthropic Models ---
                    </SelectItem>
                    {MODELS.filter(
                      (model) => model.provider === "anthropic"
                    ).map((model) => (
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
                      updateModelConfig({ temperature: value })
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
                      updateModelConfig({ topP: value })
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
                      updateModelConfig({ topK: value })
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
                      updateModelConfig({ maxTokens: value })
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
                      onChange={(e) =>
                        updateHeader(index, "key", e.target.value)
                      }
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
                <Button
                  variant="outline"
                  onClick={addHeader}
                  className="w-full"
                >
                  Add Header
                </Button>
                <p className="text-xs text-gray-500">
                  Custom HTTP headers to send with API requests
                </p>
              </div>
            </TabsContent>

            <TabsContent value="system" className="py-4 space-y-2 px-2">
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

            <TabsContent value="output" className="py-4 space-y-2 px-4">
              <OutputFormatTab updateModelConfig={updateModelConfig} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
