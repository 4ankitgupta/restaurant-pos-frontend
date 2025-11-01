import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Menu,
  Plus,
  Loader2,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { toast } from "@/hooks/use-toast";

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
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await apiService.getAIConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await apiService.getAIConversation(id);
      setMessages(response.data || []);
      setConversationId(id);
      // On mobile, close sidebar after selection
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setInputValue("");
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: "USER",
      content: inputValue.trim(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await apiService.sendAIMessage(
        inputValue.trim(),
        conversationId
      );

      const aiMessage: Message = {
        role: "AI",
        content: response.data.response,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setConversationId(response.data.conversationId);

      // Refresh conversations list
      fetchConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-background rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200",
          "w-full h-full md:w-[80vw] md:h-[80vh] md:max-w-7xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">AI Assistant</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar - History */}
          <div
            className={cn(
              "border-r bg-background transition-all duration-300",
              "fixed md:relative inset-y-0 left-0 z-50 md:z-0 h-full",
              isSidebarOpen
                ? "w-4/5 md:w-64 translate-x-0"
                : "-translate-x-full md:w-0 md:translate-x-0"
            )}
          >
            <div className="flex flex-col h-full">
              {/* New Chat Button */}
              <div className="p-4 border-b">
                <Button
                  onClick={startNewChat}
                  className="w-full"
                  variant="default"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1 p-2">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-xs mt-1">Start a new chat to begin</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => loadConversation(conv.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-md hover:bg-muted transition-colors",
                          conversationId === conv.id &&
                            "bg-muted font-medium"
                        )}
                      >
                        <p className="text-sm truncate">{conv.title}</p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Collapse Button (Mobile) */}
              {isSidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden m-2"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Close
                </Button>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    How can I help you today?
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Ask me about sales reports, inventory, orders, or any
                    other restaurant management questions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex",
                        msg.role === "USER" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] md:max-w-[70%] rounded-lg p-3 shadow-sm",
                          msg.role === "USER"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.role === "AI" ? (
                          <div className="prose dark:prose-invert prose-sm max-w-none">
                            <ReactMarkdown>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 shadow-sm">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Bar */}
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
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
    </div>
  );
};
