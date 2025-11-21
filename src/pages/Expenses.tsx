import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExpenseDashboard,
  RecurringExpenses,
  ExpenseCategories,
} from "@/components/expenses";
import { DollarSign, RepeatIcon, FolderOpen } from "lucide-react";

const Expenses: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Expense Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your operational expenses
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="recurring" className="flex items-center gap-2">
            <RepeatIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Recurring</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ExpenseDashboard />
        </TabsContent>

        <TabsContent value="recurring" className="space-y-6">
          <RecurringExpenses />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <ExpenseCategories />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Expenses;
