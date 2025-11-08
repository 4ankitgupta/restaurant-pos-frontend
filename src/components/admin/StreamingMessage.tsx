import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils"; // This path should be correct based on your new project

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-full sm:max-w-[90%] md:max-w-lg lg:max-w-[70vw] w-fit rounded-2xl border bg-card px-4 py-3 shadow-sm break-words overflow-x-auto">
        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-4">
                  <table
                    className="min-w-full border-collapse border border-border rounded-lg"
                    {...props}
                  />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className="bg-muted" {...props} />
              ),
              th: ({ node, ...props }) => (
                <th
                  className="border border-border px-4 py-2 text-left font-medium"
                  {...props}
                />
              ),
              td: ({ node, ...props }) => (
                <td className="border border-border px-4 py-2" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-6 space-y-1" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-6 space-y-1" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-semibold text-foreground" {...props} />
              ),
              pre: ({ node, ...props }) => (
                <pre
                  className="overflow-x-auto my-3 rounded-md bg-muted p-3"
                  {...props}
                />
              ),
              code: ({ node, className, children, ...props }) => {
                const isBlock =
                  typeof className === "string" && /language-/.test(className);
                return (
                  <code
                    className={
                      isBlock
                        ? "block whitespace-pre rounded px-1.5 py-0.5"
                        : "rounded bg-muted/60 px-1.5 py-0.5"
                    }
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-75" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
}
