import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface AIChatFABProps {
  onClick: () => void;
}

export const AIChatFAB: React.FC<AIChatFABProps> = ({ onClick }) => {
  const { user } = useAuth();

  // Only show for admin users
  if (user?.role !== "admin") {
    return null;
  }

  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      aria-label="Open AI Assistant"
    >
      <Sparkles className="h-6 w-6" />
    </Button>
  );
};
