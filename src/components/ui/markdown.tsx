import { cn } from "@/lib/utils";
import { marked } from "marked";
import { memo, useId, useMemo } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock, CodeBlockCode } from "./code-block";

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Partial<Components>;
};

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

function extractLanguage(className?: string): string {
  if (!className) return "plaintext";
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : "plaintext";
}

const INITIAL_COMPONENTS: Partial<Components> = {
  code: function CodeComponent({ className, children, ...props }) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line;
    if (isInline) {
      return (
        <span
          className={cn(
            "bg-primary-foreground rounded-sm px-1 font-mono text-sm",
            className
          )}
          {...props}
        >
          {children}
        </span>
      );
    }
    const language = extractLanguage(className);
    return (
      <CodeBlock className={cn("my-6", className)}>
        <CodeBlockCode code={children as string} language={language} />
      </CodeBlock>
    );
  },
  pre: function PreComponent({ children }) {
    return <>{children}</>;
  },
  // Add spacing for paragraphs
  p: function ParagraphComponent({ children, ...props }) {
    return (
      <p className="my-4" {...props}>
        {children}
      </p>
    );
  },
  // Add spacing for headings
  h1: ({ children, ...props }) => (
    <h1 className="mt-8 mb-4" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-8 mb-4" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-6 mb-3" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mt-6 mb-3" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="mt-4 mb-2" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="mt-4 mb-2" {...props}>
      {children}
    </h6>
  ),
  // Add spacing for lists
  ul: ({ children, ...props }) => (
    <ul className="my-4 ml-6 list-disc" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-4 ml-6 list-decimal" {...props}>
      {children}
    </ol>
  ),
  // Add spacing for blockquotes
  blockquote: ({ children, ...props }) => (
    <blockquote className="my-4 pl-4 border-l-4 border-gray-300" {...props}>
      {children}
    </blockquote>
  ),
};

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string;
    components?: Partial<Components>;
  }) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    );
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.content === nextProps.content;
  }
);
MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          key={`${blockId}-block-${index}`}
          content={block}
          components={components}
        />
      ))}
    </div>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = "Markdown";

export { Markdown };
