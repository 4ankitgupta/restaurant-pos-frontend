import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { AIChatFAB } from '@/components/admin/AIChatFAB';
import { AIChatWindow } from '@/components/admin/AIChatWindow';

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
      
      {/* AI Chat - Only visible to admins */}
      <AIChatFAB onClick={() => setIsChatOpen(true)} />
      <AIChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};