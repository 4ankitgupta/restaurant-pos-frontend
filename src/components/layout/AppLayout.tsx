import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { AIChatFAB } from "@/components/admin/AIChatFAB";
import { AIChatWindow } from "@/components/admin/AIChatWindow";
import { useFeature } from "@/hooks/useFeature";

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Check if the AI Chat feature is enabled
  const hasAIChat = useFeature("ai_chat");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>

      {/* Only render AI Chat if the feature is enabled */}
      {hasAIChat && (
        <>
          <AIChatFAB onClick={() => setIsChatOpen(true)} />
          <AIChatWindow
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </>
      )}
    </div>
  );
};
