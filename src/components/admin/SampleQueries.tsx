import React from "react";
import {
  MessageSquare,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SampleQueriesProps {
  onQuerySelect: (query: string) => void;
}

const sampleQueries = [
  {
    icon: TrendingUp,
    title: "Sales Analysis",
    query: "Show me today's sales summary",
    color: "text-blue-500",
  },
  {
    icon: Users,
    title: "Customer Insights",
    query: "What are the most popular items this week?",
    color: "text-green-500",
  },
  {
    icon: DollarSign,
    title: "Revenue Report",
    query: "Generate revenue report for this month",
    color: "text-yellow-500",
  },
  {
    icon: Package,
    title: "Inventory Status",
    query: "Check low stock items",
    color: "text-purple-500",
  },
  {
    icon: Calendar,
    title: "Daily Report",
    query: "Summarize yesterday's performance",
    color: "text-orange-500",
  },
  {
    icon: MessageSquare,
    title: "Order Analysis",
    query: "Analyze recent order trends",
    color: "text-pink-500",
  },
];

export const SampleQueries: React.FC<SampleQueriesProps> = ({
  onQuerySelect,
}) => {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            Welcome to AI Assistant
          </h2>
          <p className="text-muted-foreground">
            Get instant insights about your restaurant operations. Try these
            sample queries:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleQueries.map((sample, index) => {
            const Icon = sample.icon;
            return (
              <Card
                key={index}
                className={cn(
                  "p-4 cursor-pointer transition-all duration-200",
                  "hover:shadow-lg hover:scale-105 hover:border-primary",
                  "active:scale-100"
                )}
                onClick={() => onQuerySelect(sample.query)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5", sample.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1">{sample.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {sample.query}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Or type your own question in the input box below
          </p>
        </div>
      </div>
    </div>
  );
};
