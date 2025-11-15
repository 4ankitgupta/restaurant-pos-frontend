// src/contexts/WebSocketContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { APIOrder, APITable } from "@/types/restaurant";
import { useAuth } from "./AuthContext";
import { WEBSOCKET_URL } from "@/config/apiConfig";

// Updated message type to include TABLE_UPDATE
const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);
type WebSocketMessage = {
  type:
    | "NEW_ORDER"
    | "ORDER_STATUS_UPDATE"
    | "ORDER_ITEMS_UPDATED"
    | "PAYMENT_STATUS_UPDATE"
    | "ORDER_ITEM_STATUS_UPDATE"
    | "TABLE_UPDATE";
  payload: any;
};

type WebSocketContextType = {
  orders: APIOrder[];
  lastTableUpdate: APITable | null;
  isConnected: boolean;
  refreshOrders: () => void;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<APIOrder[]>([]);
  const [lastTableUpdate, setLastTableUpdate] = useState<APITable | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const refreshOrders = useCallback(() => {
    if (ws) {
      ws.close(1000, "User requested refresh");
    }
  }, [ws]);

  const normalizeOrder = (raw: any) => {
    if (!raw) return raw;
    const order = { ...raw } as any;
    if (Array.isArray(order.orderItems)) {
      order.orderItems = order.orderItems.map((oi: any) => {
        const cloned = { ...oi };
        cloned.price = Number(cloned.price ?? 0);
        if (cloned.menuItemVariant) {
          cloned.menuItemVariant = { ...cloned.menuItemVariant };
          cloned.menuItemVariant.price = Number(
            cloned.menuItemVariant.price ?? 0
          );
          cloned.menuItemVariant.menuItem = {
            ...(cloned.menuItemVariant.menuItem || {}),
          };
        }
        return cloned;
      });
    }
    return order as APIOrder;
  };

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Handle TABLE_UPDATE separately
      if (message.type === "TABLE_UPDATE") {
        setLastTableUpdate(message.payload as APITable);
        return;
      }

      setOrders((prevOrders) => {
        switch (message.type) {
          case "NEW_ORDER": {
            const normalized = normalizeOrder(message.payload);
            if (prevOrders.some((order) => order.id === normalized.id)) {
              return prevOrders;
            }
            return [...prevOrders, normalized];
          }
          case "ORDER_STATUS_UPDATE":
          case "ORDER_ITEMS_UPDATED":
          case "PAYMENT_STATUS_UPDATE": {
            const normalized = normalizeOrder(message.payload);
            const exists = prevOrders.some((o) => o.id === normalized.id);
            if (!exists) {
              return [...prevOrders, normalized];
            }
            return prevOrders.map((order) => {
              if (order.id !== normalized.id) return order;
              return {
                ...order,
                ...normalized,
                table: normalized.table ?? order.table,
                orderItems: normalized.orderItems ?? order.orderItems,
              } as APIOrder;
            });
          }
          case "ORDER_ITEM_STATUS_UPDATE": {
            const payload = message.payload;
            if (payload?.order) {
              const normalizedOrder = normalizeOrder(payload.order);
              const exists = prevOrders.some(
                (o) => o.id === normalizedOrder.id
              );
              if (!exists) {
                return [...prevOrders, normalizedOrder];
              }
              return prevOrders.map((o) =>
                o.id === normalizedOrder.id ? normalizedOrder : o
              );
            }
            return prevOrders.map((order) => {
              if (order.id !== payload.orderId) return order;
              const updatedItem = { ...payload };
              updatedItem.price = Number(updatedItem.price ?? 0);
              if (updatedItem.menuItemVariant) {
                updatedItem.menuItemVariant = {
                  ...updatedItem.menuItemVariant,
                  price: Number(updatedItem.menuItemVariant.price ?? 0),
                };
                updatedItem.menuItemVariant.menuItem = {
                  ...(updatedItem.menuItemVariant.menuItem || {}),
                };
              }
              const updatedOrderItems = order.orderItems.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
              );
              return { ...order, orderItems: updatedOrderItems };
            });
          }
          default:
            return prevOrders;
        }
      });
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
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

    // --- FIX: Dynamic WebSocket URL ---
    // Use WebSocket URL from .env file, fallback to dynamic detection
    const connect = () => {
      let websocketUrl: string;

      if (WEBSOCKET_URL) {
        // Use the configured WebSocket URL from .env
        websocketUrl = `${WEBSOCKET_URL}?token=${token}`;
      } else {
        // Fallback: dynamically detect based on current page protocol
        const isSecure = window.location.protocol === "https:";
        const wsProtocol = isSecure ? "wss:" : "ws:";
        const wsHost = window.location.host;
        websocketUrl = `${wsProtocol}//${wsHost}?token=${token}`;
      }

      console.log(`Connecting to WebSocket at: ${websocketUrl}`);
      const newWs = new WebSocket(websocketUrl);

      newWs.onopen = async () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        try {
          const { apiService } = await import("@/services/apiService");
          const response = await apiService.getAllOrders();
          setOrders(response.data.map((o: any) => normalizeOrder(o)));
        } catch (error) {
          console.error("Error fetching initial orders:", error);
        }
      };

      newWs.onmessage = handleWebSocketMessage;

      newWs.onclose = (event) => {
        console.log("WebSocket disconnected", event.code, event.reason);
        setIsConnected(false);

        // Check localStorage directly for the token.
        // This is the source of truth for auth status, not the closure.
        const currentToken = localStorage.getItem("accessToken");

        // Only attempt to reconnect if the disconnection was unexpected
        // AND we still have an auth token.
        if (event.code !== 1000 && currentToken) {
          setTimeout(connect, 3000); // Re-run the connect function
        }
      };

      newWs.onerror = (error) => {
        console.error("WebSocket error:", error);
        newWs.close(); // Ensure connection is closed on error before reconnecting
      };

      setWs(newWs);
    };

    connect(); // Initial connection attempt

    // Cleanup on component unmount or when user changes
    return () => {
      if (ws) {
        ws.close(1000, "Component unmounting");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, handleWebSocketMessage]); // Note: We don't include 'ws' in deps to avoid re-creating the connection on every ws state change.

  const contextValue: WebSocketContextType = {
    orders,
    lastTableUpdate,
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
