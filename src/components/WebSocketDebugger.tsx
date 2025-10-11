// src/components/WebSocketDebugger.tsx
// Add this component temporarily to any page to see real-time WebSocket activity

import React, { useEffect, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
}

export const WebSocketDebugger: React.FC = () => {
  const { orders, isConnected } = useWebSocket();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  useEffect(() => {
    const addLog = (type: LogEntry["type"], message: string) => {
      setLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          type,
          message,
        },
        ...prev.slice(0, 49), // Keep last 50 logs
      ]);
    };

    // Log connection status changes
    addLog(
      isConnected ? "success" : "error",
      `WebSocket ${isConnected ? "connected" : "disconnected"}`
    );
  }, [isConnected]);

  useEffect(() => {
    const addLog = (type: LogEntry["type"], message: string) => {
      setLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          type,
          message,
        },
        ...prev.slice(0, 49),
      ]);
    };

    if (orders.length !== prevOrderCount) {
      const diff = orders.length - prevOrderCount;
      addLog(
        "info",
        `Orders changed: ${prevOrderCount} → ${orders.length} (${
          diff > 0 ? "+" : ""
        }${diff})`
      );
      setPrevOrderCount(orders.length);
    }
  }, [orders.length, prevOrderCount]);

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 shadow-lg z-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>WebSocket Debugger</span>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-3">
          <div className="text-xs">
            <span className="font-semibold">Total Orders:</span> {orders.length}
          </div>
          <div className="text-xs">
            <span className="font-semibold">Active Orders:</span>{" "}
            {
              orders.filter(
                (o) =>
                  o.status === "IN_PROGRESS" &&
                  o.orderItems?.some(
                    (i) => i.status === "ORDERED" || i.status === "PREPARING"
                  )
              ).length
            }
          </div>
        </div>
        <ScrollArea className="h-48 border rounded p-2 bg-gray-50">
          <div className="space-y-1">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-xs">
                  <span className="text-gray-500">[{log.timestamp}]</span>{" "}
                  <span className={getLogColor(log.type)}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
