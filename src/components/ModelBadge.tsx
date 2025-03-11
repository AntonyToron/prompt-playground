import { Sparkles, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export const ModelBadge = ({
  model,
  className,
}: {
  model: { name: string; provider: string };
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full",
      className
    )}
  >
    {model.provider === "OpenAI" ? (
      <Sparkles size={14} className="flex-shrink-0" />
    ) : (
      <Bot size={14} className="flex-shrink-0" />
    )}
    <span>{model.name}</span>
  </div>
);
