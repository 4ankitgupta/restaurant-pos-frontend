// src/contexts/WebSocketContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { APIOrder } from "@/types/restaurant";
import { useAuth } from "./AuthContext";

// New message type to handle individual item status updates
interface WebSocketMessage {
  type:
    | "NEW_ORDER"
    | "ORDER_STATUS_UPDATE"
    | "ORDER_ITEMS_UPDATED"
    | "PAYMENT_STATUS_UPDATE"
    | "ORDER_ITEM_STATUS_UPDATE";
  payload: any;
}

interface WebSocketContextType {
  orders: APIOrder[];
  isConnected: boolean;
  refreshOrders: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<APIOrder[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const refreshOrders = useCallback(() => {
    // Force a refresh by reconnecting WebSocket or fetching fresh data
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  }, [ws]);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case "NEW_ORDER":
          setOrders((prev) => [...prev, message.payload]);
          break;

        case "ORDER_STATUS_UPDATE":
        case "ORDER_ITEMS_UPDATED":
          setOrders((prev) =>
            prev.map((order) =>
              order.id === message.payload.id ||
              order.id === message.payload.orderId
                ? { ...order, ...message.payload }
                : order
            )
          );
          break;

        case "ORDER_ITEM_STATUS_UPDATE":
          // Update a single item's status within an existing order
          setOrders((prevOrders) =>
            prevOrders.map((order) => {
              if (order.id === message.payload.orderId) {
                return {
                  ...order,
                  orderItems: order.orderItems.map((item) =>
                    item.id === message.payload.id
                      ? { ...item, status: message.payload.status }
                      : item
                  ),
                };
              }
              return order;
            })
          );
          break;

        case "PAYMENT_STATUS_UPDATE":
          setOrders((prev) =>
            prev.map((order) =>
              order.id === message.payload.orderId
                ? { ...order, paymentStatus: message.payload.paymentStatus }
                : order
            )
          );
          break;

        default:
          console.log("Unknown WebSocket message type:", message.type);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      // Clean up connection if user is not authenticated
      if (ws) {
        ws.close();
        setWs(null);
      }
      setIsConnected(false);
      setOrders([]);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Create WebSocket connection
    const websocket = new WebSocket(`ws://192.168.29.213:8000?token=${token}`);

    websocket.onopen = async () => {
      console.log("WebSocket connected");
      setIsConnected(true);

      // Initial data load - fetch all existing orders
      try {
        const { apiService } = await import("@/services/apiService");
        const response = await apiService.getAllOrders();
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching initial orders:", error);
      }
    };

    websocket.onmessage = handleWebSocketMessage;

    websocket.onclose = (event) => {
      console.log("WebSocket disconnected", event.code, event.reason);
      setIsConnected(false);

      // Attempt to reconnect after 3 seconds if it wasn't a manual close
      if (event.code !== 1000 && user) {
        setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
        }, 3000);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    setWs(websocket);

    // Cleanup on unmount
    return () => {
      websocket.close();
    };
  }, [user, handleWebSocketMessage]);

  const contextValue: WebSocketContextType = {
    orders,
    isConnected,
    refreshOrders,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
