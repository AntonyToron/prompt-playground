export const MessageContent = ({ content }: { content: string }) => {
  // Simple markdown parsing for code blocks
  const parts = content.split("```");

  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          return (
            <p
              key={index}
              className="whitespace-pre-wrap text-sm text-[0.85rem] leading-relaxed"
            >
              {part}
            </p>
          );
        } else {
          const [language, ...code] = part.split("\n");
          return (
            <pre
              key={index}
              className="bg-white dark:bg-gray-800 p-3 my-2 rounded-md overflow-x-auto"
            >
              <code className="text-xs font-mono">{code.join("\n")}</code>
            </pre>
          );
        }
      })}
    </>
  );
};
