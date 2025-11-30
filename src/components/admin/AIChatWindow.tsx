import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Menu,
  Plus,
  Loader2,
  MessageSquare,
  ChevronLeft,
  User,
  Bot,
  Mic,
  MicOff,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import remarkGfm from "remark-gfm";
import { StreamingMessage } from "./StreamingMessage";
import { API_BASE_URL } from "@/config/apiConfig";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SampleQueries } from "./SampleQueries";
import { Textarea } from "@/components/ui/textarea";

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

  // --- Speech Recognition State ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastResultIndexRef = useRef<number>(0);
  // ---

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      if (!conversationId) {
        startNewConversation();
      }
    }
  }, [isOpen]);

  // --- Initialize Speech Recognition ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let finalTranscript = "";

          // Only process results from the last processed index onwards
          for (
            let i = lastResultIndexRef.current;
            i < event.results.length;
            i++
          ) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
              lastResultIndexRef.current = i + 1;
            }
          }

          if (finalTranscript) {
            setInputValue((prev) => prev + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);

          let errorMessage = "Failed to access microphone.";
          let errorTitle = "Error";

          switch (event.error) {
            case "not-allowed":
              errorTitle = "Microphone Access Denied";
              errorMessage =
                "Please allow microphone access in your browser settings to use voice input.";
              break;
            case "no-speech":
              errorTitle = "No Speech Detected";
              errorMessage = "No speech was detected. Please try again.";
              break;
            case "audio-capture":
              errorTitle = "Microphone Not Found";
              errorMessage =
                "No microphone was found. Please connect a microphone and try again.";
              break;
            case "network":
              errorTitle = "Network Error";
              errorMessage =
                "A network error occurred. Please check your connection.";
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }

          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
          });
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  // ---

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- Handle Sample Query Selection ---
  const handleSampleQuerySelect = (query: string) => {
    setInputValue(query);
    // Optionally auto-send the message
    // setTimeout(() => sendMessage(), 100);
  };
  // ---

  // --- Speech Recognition Toggle ---
  const toggleListening = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description:
          "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      lastResultIndexRef.current = 0;
    } else {
      try {
        // Check current permission state
        if (navigator.permissions) {
          try {
            const permissionStatus = await navigator.permissions.query({
              name: "microphone" as PermissionName,
            });

            if (permissionStatus.state === "denied") {
              toast({
                title: "Microphone Access Blocked",
                description:
                  "Microphone access is blocked. Click the lock icon (🔒) in your address bar and allow microphone access, then try again.",
                variant: "destructive",
                duration: 6000,
              });
              return;
            }
          } catch (e) {
            // Permission API might not support microphone query in some browsers
            console.log(
              "Permission query not supported, proceeding with request"
            );
          }
        }

        // Request microphone permission - this will trigger browser's permission popup
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Stop the stream immediately as we only needed it for permission
        stream.getTracks().forEach((track) => track.stop());

        // Reset the result index before starting
        lastResultIndexRef.current = 0;

        // Now start speech recognition
        recognitionRef.current.start();
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak now. Click the mic button again to stop.",
        });
      } catch (error: any) {
        console.error("Failed to start speech recognition:", error);

        let errorTitle = "Cannot Start Voice Input";
        let errorMessage = "Failed to start speech recognition.";
        let duration = 5000;

        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          errorTitle = "Microphone Permission Required";
          errorMessage =
            "Please allow microphone access when prompted, or click the lock icon (🔒) in your address bar to enable microphone access.";
          duration = 7000;
        } else if (error.name === "NotFoundError") {
          errorMessage =
            "No microphone found. Please connect a microphone and try again.";
        } else if (error.name === "NotReadableError") {
          errorMessage =
            "Your microphone is already in use by another application. Please close other apps using the microphone and try again.";
          duration = 7000;
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
          duration,
        });
      }
    }
  };
  // ---

  // --- Delete Conversation Handlers ---
  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the conversation selection
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    try {
      await apiService.deleteAIConversation(conversationToDelete);

      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });

      // If the deleted conversation was the active one, start a new conversation
      if (conversationId === conversationToDelete) {
        startNewConversation();
      }

      // Refresh the conversations list
      await fetchConversations();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };
  // ---

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
            "h-full bg-muted/30 border-r border-border/50 transition-all duration-300",
            isSidebarOpen ? "w-72" : "w-0"
          )}
        >
          {isSidebarOpen && (
            <div className="flex h-full flex-col p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-muted-foreground">
                  History
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 mb-2"
                onClick={startNewConversation}
              >
                <Plus className="h-3.5 w-3.5" />
                New Chat
              </Button>
              <ScrollArea className="flex-1 -mx-3 px-3">
                <div className="space-y-1">
                  {conversations.map((convo) => (
                    <div key={convo.id} className="group relative">
                      <Button
                        variant={
                          conversationId === convo.id ? "secondary" : "ghost"
                        }
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2 pr-9"
                        onClick={() => fetchMessages(convo.id)}
                      >
                        <MessageSquare className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate text-xs flex-1 max-w-[150px]">
                          {convo.title}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => handleDeleteClick(convo.id, e)}
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col bg-gradient-to-b from-background to-muted/20">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isSidebarOpen && "hidden")}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Rasoi AI</h2>
                  <p className="text-xs text-muted-foreground">
                    Always here to help
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-6">
            {messages.length === 0 && !isLoading && !streamingContent ? (
              <SampleQueries onQuerySelect={handleSampleQuerySelect} />
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-3 animate-fade-in",
                      message.role === "USER" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "AI" && (
                      <Avatar className="hidden sm:inline-flex h-7 w-7 border border-border/50">
                        <AvatarFallback className="bg-primary/5">
                          <Bot className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        // Increased mobile size by ~20% (75% -> 90%), retain original at sm+ breakpoints
                        "max-w-[90%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 break-words",
                        message.role === "USER"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-card border border-border/50 shadow-sm"
                      )}
                    >
                      {message.role === "USER" ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({ node, ...props }) => (
                                <div className="overflow-x-auto my-3">
                                  <table
                                    className="min-w-full border-collapse border border-border rounded-lg"
                                    {...props}
                                  />
                                </div>
                              ),
                              thead: ({ node, ...props }) => (
                                <thead className="bg-muted/50" {...props} />
                              ),
                              th: ({ node, ...props }) => (
                                <th
                                  className="border border-border px-3 py-1.5 text-left font-medium text-xs"
                                  {...props}
                                />
                              ),
                              td: ({ node, ...props }) => (
                                <td
                                  className="border border-border px-3 py-1.5 text-xs"
                                  {...props}
                                />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul
                                  className="list-disc pl-5 space-y-0.5"
                                  {...props}
                                />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol
                                  className="list-decimal pl-5 space-y-0.5"
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {message.role === "USER" && (
                      <Avatar className="hidden sm:inline-flex h-7 w-7 border border-border/50">
                        <AvatarFallback className="bg-muted">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isLoading && streamingContent && (
                  <StreamingMessage content={streamingContent} />
                )}

                {isLoading && !streamingContent && (
                  <div className="flex items-start gap-3 justify-start animate-fade-in">
                    <Avatar className="h-7 w-7 border border-border/50">
                      <AvatarFallback className="bg-primary/5">
                        <Bot className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-card border border-border/50 rounded-2xl px-4 py-2.5 shadow-sm max-w-[90%] sm:max-w-[75%]">
                      <div className="flex gap-1">
                        <div
                          className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Bar */}
          <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="min-h-[44px] max-h-32 resize-none pr-10 text-sm"
                    rows={1}
                  />
                  <Button
                    onClick={toggleListening}
                    disabled={isLoading}
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "absolute right-1 bottom-1 h-8 w-8",
                      isListening && "text-destructive animate-pulse"
                    )}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="h-11 w-11 shrink-0"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone and all messages in this conversation will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
