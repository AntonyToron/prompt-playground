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
  Trash2,
  PlusCircle,
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
import { Badge } from "@/components/ui/badge";

import { useChatContext } from "./ChatContext";
import { MODELS } from "@/constants/models";
import { useState, useCallback, useRef, useEffect } from "react";
import { EXAMPLE_JSON_SCHEMA } from "@/constants/models";
import debounce from "lodash/debounce";

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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Example tool template to help users get started
const EXAMPLE_TOOL = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Get the current weather in a given location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA",
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "The unit of temperature to use",
        },
      },
      required: ["location"],
    },
  },
};

// Parameter types for select options
const PARAMETER_TYPES = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "object", label: "Object" },
  { value: "array", label: "Array" },
  { value: "null", label: "Null" },
];

// Parameter field component to reduce re-renders
const ParameterField = ({
  toolId,
  paramName,
  paramConfig,
  onUpdate,
  onRemove,
  requiredParams,
}: {
  toolId: string;
  paramName: string;
  paramConfig: any;
  onUpdate: (
    toolId: string,
    paramName: string,
    field: string,
    value: any
  ) => void;
  onRemove: (toolId: string, paramName: string) => void;
  requiredParams: string[];
}) => {
  // Using useRef to maintain focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  // Debounced update handlers
  const updateName = useCallback(
    debounce((value: string) => {
      onUpdate(toolId, paramName, "name", value);
    }, 500),
    [toolId, paramName, onUpdate]
  );

  const updateType = useCallback(
    (value: string) => {
      onUpdate(toolId, paramName, "type", value);
    },
    [toolId, paramName, onUpdate]
  );

  const updateRequired = useCallback(
    (checked: boolean) => {
      onUpdate(toolId, paramName, "required", checked);
    },
    [toolId, paramName, onUpdate]
  );

  const updateDescription = useCallback(
    debounce((value: string) => {
      onUpdate(toolId, paramName, "description", value);
    }, 500),
    [toolId, paramName, onUpdate]
  );

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <Label
            htmlFor={`param-name-${toolId}-${paramName}`}
            className="text-xs text-gray-500"
          >
            Name
          </Label>
          <Input
            id={`param-name-${toolId}-${paramName}`}
            ref={nameInputRef}
            defaultValue={paramName}
            onChange={(e) => updateName(e.target.value)}
            placeholder="Parameter name"
            className="mt-1"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(toolId, paramName)}
          className="ml-2"
        >
          <Trash2 className="h-4 w-4 text-gray-500" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label
            htmlFor={`param-type-${toolId}-${paramName}`}
            className="text-xs text-gray-500"
          >
            Type
          </Label>
          <Select
            value={paramConfig.type || "string"}
            onValueChange={updateType}
          >
            <SelectTrigger
              id={`param-type-${toolId}-${paramName}`}
              className="mt-1"
            >
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {PARAMETER_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end pb-2">
          <div className="flex items-center space-x-2">
            <Switch
              id={`param-required-${toolId}-${paramName}`}
              checked={requiredParams.includes(paramName)}
              onCheckedChange={updateRequired}
            />
            <Label
              htmlFor={`param-required-${toolId}-${paramName}`}
              className="text-sm"
            >
              Required
            </Label>
          </div>
        </div>
      </div>

      <div>
        <Label
          htmlFor={`param-desc-${toolId}-${paramName}`}
          className="text-xs text-gray-500"
        >
          Description
        </Label>
        <Textarea
          id={`param-desc-${toolId}-${paramName}`}
          ref={descInputRef}
          defaultValue={paramConfig.description || ""}
          onChange={(e) => updateDescription(e.target.value)}
          placeholder="Parameter description"
          className="mt-1 min-h-[60px]"
        />
      </div>
    </div>
  );
};

// Tool component to reduce re-renders
const ToolComponent = ({
  toolId,
  tool,
  onRemove,
  onUpdate,
  onAddParameter,
  onUpdateParameter,
  onRemoveParameter,
}: {
  toolId: string;
  tool: any;
  onRemove: (toolId: string) => void;
  onUpdate: (toolId: string, field: string, value: string) => void;
  onAddParameter: (toolId: string) => void;
  onUpdateParameter: (
    toolId: string,
    paramName: string,
    field: string,
    value: any
  ) => void;
  onRemoveParameter: (toolId: string, paramName: string) => void;
}) => {
  // Using useRef to maintain focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  // Debounced update handlers
  const updateName = useCallback(
    debounce((value: string) => {
      onUpdate(toolId, "name", value);
    }, 500),
    [toolId, onUpdate]
  );

  const updateDescription = useCallback(
    debounce((value: string) => {
      onUpdate(toolId, "description", value);
    }, 500),
    [toolId, onUpdate]
  );

  return (
    <AccordionContent className="space-y-4 px-1">
      <div className="space-y-2">
        <Label htmlFor={`tool-name-${toolId}`}>Name</Label>
        <Input
          id={`tool-name-${toolId}`}
          ref={nameInputRef}
          defaultValue={tool.function.name}
          onChange={(e) => updateName(e.target.value)}
          placeholder="Tool name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`tool-desc-${toolId}`}>Description</Label>
        <Textarea
          id={`tool-desc-${toolId}`}
          ref={descInputRef}
          defaultValue={tool.function.description}
          onChange={(e) => updateDescription(e.target.value)}
          placeholder="What this tool does..."
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Parameters</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddParameter(toolId)}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Add Parameter
          </Button>
        </div>

        <div className="space-y-2">
          {Object.entries(tool.function.parameters.properties || {}).map(
            ([paramName, paramConfig]: [string, any], paramIndex) => (
              <ParameterField
                // dont include param name here or else defocuses each time
                key={`param-${toolId}-${paramIndex}`}
                toolId={toolId}
                paramName={paramName}
                paramConfig={paramConfig}
                onUpdate={onUpdateParameter}
                onRemove={onRemoveParameter}
                requiredParams={tool.function.parameters.required || []}
              />
            )
          )}

          {Object.keys(tool.function.parameters.properties || {}).length ===
            0 && (
            <div className="text-center text-gray-500 text-sm py-2">
              No parameters defined for this tool
            </div>
          )}
        </div>
      </div>
    </AccordionContent>
  );
};

export function ToolTab({
  updateModelConfig,
}: {
  updateModelConfig: (updates: Partial<ChatType["modelConfig"]>) => void;
}) {
  const { currentChat } = useChatContext();

  const [toolsEnabled, setToolsEnabled] = useState(false);
  const [tools, setTools] = useState<Record<string, any>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<string[]>([]);
  const [currentEditMode, setCurrentEditMode] = useState<"visual" | "json">(
    "visual"
  );

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && currentChat?.modelConfig?.tools) {
      initialized.current = true;
      setTools(currentChat.modelConfig.tools);
      if (Object.keys(currentChat.modelConfig.tools).length > 0) {
        setToolsEnabled(true);
      }
    }
  }, [currentChat]);

  const debouncedUpdateConfig = useCallback(
    debounce((updatedTools: Record<string, any>) => {
      updateModelConfig({ tools: updatedTools });
    }, 1000),
    [updateModelConfig]
  );

  const handleToolsToggle = useCallback(
    (enabled: boolean) => {
      setToolsEnabled(enabled);
      if (enabled) {
        debouncedUpdateConfig(tools);
      } else {
        updateModelConfig({ tools: {} });
      }
    },
    [tools, debouncedUpdateConfig, updateModelConfig]
  );

  const addTool = useCallback(() => {
    const toolId = `tool_${Object.keys(tools).length + 1}`;
    const newTool = {
      type: "function",
      function: {
        name: toolId,
        description: "",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    };

    const updatedTools = { ...tools, [toolId]: newTool };
    setTools(updatedTools);
    setExpandedTools((prev) => [...prev, toolId]);
    debouncedUpdateConfig(updatedTools);
  }, [tools, debouncedUpdateConfig, setExpandedTools]);

  const addParameterToTool = useCallback(
    (toolId: string) => {
      const updatedTools = { ...tools };
      const paramKey = `param_${
        Object.keys(updatedTools[toolId].function.parameters.properties)
          .length + 1
      }`;

      updatedTools[toolId].function.parameters.properties[paramKey] = {
        type: "string",
        description: "",
      };

      setTools(updatedTools);
      debouncedUpdateConfig(updatedTools);
    },
    [tools, debouncedUpdateConfig]
  );

  const updateToolField = useCallback(
    (toolId: string, field: string, value: string) => {
      const updatedTools = { ...tools };
      if (field === "name") {
        updatedTools[toolId].function.name = value;
      } else if (field === "description") {
        updatedTools[toolId].function.description = value;
      }

      setTools(updatedTools);
      debouncedUpdateConfig(updatedTools);
    },
    [tools, debouncedUpdateConfig]
  );

  const updateParameterField = useCallback(
    (
      toolId: string,
      paramName: string,
      field: string,
      value: string | boolean
    ) => {
      const updatedTools = { ...tools };

      if (field === "type") {
        updatedTools[toolId].function.parameters.properties[paramName].type =
          value;
      } else if (field === "description") {
        updatedTools[toolId].function.parameters.properties[
          paramName
        ].description = value;
      } else if (field === "required") {
        const requiredParams =
          updatedTools[toolId].function.parameters.required || [];

        if (value && !requiredParams.includes(paramName)) {
          updatedTools[toolId].function.parameters.required = [
            ...requiredParams,
            paramName,
          ];
        } else if (!value) {
          updatedTools[toolId].function.parameters.required =
            requiredParams.filter((p: string) => p !== paramName);
        }
      } else if (field === "name" && paramName !== value) {
        const paramProps = updatedTools[toolId].function.parameters.properties;
        const paramConfig = paramProps[paramName];

        paramProps[value as string] = paramConfig;
        delete paramProps[paramName];

        const requiredParams =
          updatedTools[toolId].function.parameters.required || [];
        const requiredIndex = requiredParams.indexOf(paramName);
        if (requiredIndex !== -1) {
          requiredParams[requiredIndex] = value as string;
        }
      }

      setTools(updatedTools);
      debouncedUpdateConfig(updatedTools);
    },
    [tools, debouncedUpdateConfig]
  );

  const removeParameter = useCallback(
    (toolId: string, paramName: string) => {
      const updatedTools = { ...tools };

      delete updatedTools[toolId].function.parameters.properties[paramName];

      const requiredParams =
        updatedTools[toolId].function.parameters.required || [];
      updatedTools[toolId].function.parameters.required = requiredParams.filter(
        (p: string) => p !== paramName
      );

      setTools(updatedTools);
      debouncedUpdateConfig(updatedTools);
    },
    [tools, debouncedUpdateConfig]
  );

  const removeTool = useCallback(
    (toolId: string) => {
      const updatedTools = { ...tools };
      delete updatedTools[toolId];
      setTools(updatedTools);
      debouncedUpdateConfig(updatedTools);
    },
    [tools, debouncedUpdateConfig]
  );

  const importToolsFromJson = useCallback(
    (jsonStr: string) => {
      try {
        const parsedTools = JSON.parse(jsonStr);

        // Validate that it's an object (Record)
        if (
          typeof parsedTools !== "object" ||
          parsedTools === null ||
          Array.isArray(parsedTools)
        ) {
          setJsonError("Tools must be a Record<string, Tool> object");
          return;
        }

        // Basic validation of tool structure
        const isValid = Object.values(parsedTools).every(
          (tool: any) =>
            tool.type === "function" &&
            tool.function &&
            typeof tool.function.name === "string" &&
            tool.function.parameters &&
            tool.function.parameters.type === "object"
        );

        if (!isValid) {
          setJsonError("Invalid tool format");
          return;
        }

        setTools(parsedTools);
        setJsonError(null);
        updateModelConfig({ tools: parsedTools });
        toast.success("Tools imported successfully");
      } catch (error) {
        setJsonError("Invalid JSON format");
      }
    },
    [updateModelConfig]
  );

  const handleJsonChange = useCallback((jsonStr: string) => {
    try {
      JSON.parse(jsonStr);
      setJsonError(null);
    } catch (error) {
      setJsonError("Invalid JSON format");
    }
  }, []);

  const formatTools = useCallback(() => {
    try {
      return JSON.stringify(tools, null, 2);
    } catch (error) {
      return "{}";
    }
  }, [tools]);

  const jsonTextareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center font-medium text-sm space-x-2">
          <div>Tool/function calls</div>
          <Badge variant={"secondary"}>Beta/non-functioning</Badge>
        </div>
        <div className="text-gray-400 text-xs mb-4">
          Define tools that the LLM can request to use. This helps the model
          understand what functions are available and their required parameters.
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enable-tools"
          checked={toolsEnabled}
          onCheckedChange={handleToolsToggle}
        />
        <Label htmlFor="enable-tools">Enable tool definitions</Label>
      </div>

      {toolsEnabled && (
        <>
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Button
                variant={currentEditMode === "visual" ? "outline" : "ghost"}
                onClick={() => setCurrentEditMode("visual")}
                className="flex-1"
              >
                Visual Editor
              </Button>
              <Button
                variant={currentEditMode === "json" ? "outline" : "ghost"}
                onClick={() => setCurrentEditMode("json")}
                className="flex-1"
              >
                JSON Editor
              </Button>
            </div>

            {currentEditMode === "visual" ? (
              <div className="space-y-4 px-2 py-1">
                <Accordion
                  type="multiple"
                  value={expandedTools}
                  onValueChange={setExpandedTools}
                  className="space-y-2"
                >
                  {Object.entries(tools).map(([toolId, tool], index) => (
                    <AccordionItem
                      key={`tool-${index}`}
                      value={toolId}
                      className="border rounded-md p-4"
                    >
                      <div className="flex justify-between items-center">
                        <AccordionTrigger className="hover:no-underline">
                          <span className="font-medium">
                            {tool.function.name || toolId}
                          </span>
                        </AccordionTrigger>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTool(toolId);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>

                      {/* Extract tool content to its own component to reduce re-renders */}
                      <ToolComponent
                        toolId={toolId}
                        tool={tool}
                        onRemove={removeTool}
                        onUpdate={updateToolField}
                        onAddParameter={addParameterToTool}
                        onUpdateParameter={updateParameterField}
                        onRemoveParameter={removeParameter}
                      />
                    </AccordionItem>
                  ))}
                </Accordion>

                {Object.keys(tools).length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No tools defined. Add a tool to get started.
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={addTool}
                    className="w-full"
                    variant="outline"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Tool
                  </Button>
                </div>

                <div className="text-xs text-gray-500">
                  Define the tools the model can use during the conversation.
                  Each tool should have a clear name, description, and
                  parameters.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  ref={jsonTextareaRef}
                  defaultValue={formatTools()}
                  onChange={(e) => {
                    handleJsonChange(e.target.value);
                    importToolsFromJson(e.target.value);
                  }}
                  placeholder={JSON.stringify(
                    { example: EXAMPLE_TOOL },
                    null,
                    2
                  )}
                  className="min-h-[300px] font-mono text-sm"
                />

                {jsonError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{jsonError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const formatted = formatTools();
                      importToolsFromJson(formatted);
                    }}
                  >
                    <CurlyBraces className="h-4 w-4 mr-2" />
                    Format JSON
                  </Button>
                </div>

                <div className="text-xs text-gray-500">
                  Edit tools directly in JSON format. The structure should
                  follow the format used by the OpenAI and Anthropic API for
                  function calling.
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="params">Parameters</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
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
                    max={30000}
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

            <TabsContent value="tools" className="py-4 space-y-2 px-2">
              <ToolTab updateModelConfig={updateModelConfig} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
