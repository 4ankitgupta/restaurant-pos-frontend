import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Menu,
  Plus,
  Loader2,
  MessageSquare,
  ChevronLeft,
  User, // Added User icon
  Bot, // Added Bot icon
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { toast } from "@/hooks/use-toast";

// --- New Imports ---
import remarkGfm from "remark-gfm";
import { StreamingMessage } from "./StreamingMessage"; // Import the streaming component
import { API_BASE_URL } from "@/config/apiConfig"; // Import your API base URL
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Import Avatar
// ---

interface Message {
  role: "USER" | "AI";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
}

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatWindow: React.FC<AIChatWindowProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- New State for Streaming ---
  const [streamingContent, setStreamingContent] = useState("");
  // ---

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      if (!conversationId) {
        startNewConversation();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-scroll logic, now triggered by streaming content as well
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]); // Added streamingContent

  const fetchConversations = async () => {
    try {
      const data = await apiService.getAIConversations();
      setConversations(data.data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load past conversations.",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.getAIConversation(id);
      setMessages(data.data);
      setConversationId(id);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages for this conversation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setInputValue("");
  };

  // --- MODIFIED: sendMessage function to handle streaming ---
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: "USER",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setStreamingContent(""); // Clear any previous streaming content
    let fullAIResponse = ""; // Accumulator for the full response
    let currentConversationId = conversationId; // Use local var for stream

    try {
      // --- REPLACED: direct fetch with apiService.sendAIMessage ---
      const data = await apiService.sendAIMessage(
        userMessage.content,
        currentConversationId
      );
      const fullAIResponse = data.data.response;
      if (data.data.conversationId && !currentConversationId) {
        currentConversationId = data.data.conversationId;
        setConversationId(data.data.conversationId);
        fetchConversations();
      }
      if (fullAIResponse) {
        const aiMessage: Message = {
          role: "AI",
          content: fullAIResponse,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
      // --- End of replacement ---
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: `Failed to get response from AI: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
      // Remove the optimistic user message if the send failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false); // Set loading to false only after stream ends
      setStreamingContent(""); // Clear streaming content
    }
  };
  // --- End of modified function ---

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      sendMessage();
    }
  };

  // --- Main JSX Structure (Kept your original modal/drawer logic) ---
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-background text-foreground flex h-full md:h-[90dvh] w-full md:w-[80vw] md:max-w-6xl md:rounded-lg shadow-2xl transition-all duration-300",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Sidebar */}
        <div
          className={cn(
            "h-full bg-muted/50 transition-all duration-300",
            isSidebarOpen ? "w-64 border-r" : "w-0"
          )}
        >
          {isSidebarOpen && (
            <div className="flex h-full flex-col p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Conversations</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={startNewConversation}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
              <ScrollArea className="mt-4 flex-1">
                {conversations.map((convo) => (
                  <Button
                    key={convo.id}
                    variant={
                      conversationId === convo.id ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => fetchMessages(convo.id)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span className="truncate">{convo.title}</span>
                  </Button>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={cn(isSidebarOpen && "hidden")}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">AI Assistant</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 && !isLoading && !streamingContent ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="mx-auto h-12 w-12" />
                  <p className="mt-2">
                    Start a conversation to see your chat history.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-3",
                      message.role === "USER" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "AI" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-xs sm:max-w-md lg:max-w-lg rounded-2xl px-4 py-3 shadow-sm break-words",
                        message.role === "USER"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border"
                      )}
                    >
                      {/* --- MODIFIED: Use ReactMarkdown for AI messages --- */}
                      {message.role === "USER" ? (
                        <p className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </p>
                      ) : (
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
                                <td
                                  className="border border-border px-4 py-2"
                                  {...props}
                                />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul
                                  className="list-disc pl-6 space-y-1"
                                  {...props}
                                />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol
                                  className="list-decimal pl-6 space-y-1"
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      {/* --- End of modification --- */}
                    </div>
                    {message.role === "USER" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {/* --- MODIFIED: Render streaming message OR initial loader --- */}
                {isLoading && streamingContent && (
                  <StreamingMessage content={streamingContent} />
                )}

                {/* This shows the initial "thinking" spinner */}
                {isLoading && !streamingContent && (
                  <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-card border rounded-2xl px-4 py-3 shadow-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                {/* --- End of modification --- */}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Bar */}
          <div className="p-4 border-t bg-background shrink-0">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading} // Disables input during stream
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading} // Disables button during stream
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
