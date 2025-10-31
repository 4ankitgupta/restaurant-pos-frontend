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
    // Force a refresh by reconnecting WebSocket
    if (ws) {
      ws.close(1000, "User requested refresh"); // Use a standard close code
    }
  }, [ws]);

  // Helper to normalize orders received from backend / websocket
  const normalizeOrder = (raw: any) => {
    if (!raw) return raw;
    const order = { ...raw } as any;
    if (Array.isArray(order.orderItems)) {
      order.orderItems = order.orderItems.map((oi: any) => {
        const cloned = { ...oi };
        // Ensure price is a number
        cloned.price = Number(cloned.price ?? 0);

        if (cloned.menuItemVariant) {
          cloned.menuItemVariant = { ...cloned.menuItemVariant };
          cloned.menuItemVariant.price = Number(
            cloned.menuItemVariant.price ?? 0
          );

          // Normalize nested menuItem (some backends may omit fields)
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
      // incoming message parsed into `message` - we use normalizeOrder helper above

      setOrders((prevOrders) => {
        switch (message.type) {
          case "NEW_ORDER": {
            const normalized = normalizeOrder(message.payload);
            // Avoid adding duplicates
            if (prevOrders.some((order) => order.id === normalized.id)) {
              return prevOrders;
            }
            return [...prevOrders, normalized];
          }

          case "ORDER_STATUS_UPDATE":
          case "ORDER_ITEMS_UPDATED":
          case "PAYMENT_STATUS_UPDATE": {
            const normalized = normalizeOrder(message.payload);
            return prevOrders.map((order) =>
              order.id === normalized.id ? normalized : order
            );
          }

          case "ORDER_ITEM_STATUS_UPDATE": {
            // Payload may be the updated order item or contain orderId + item id
            const payload = message.payload;
            return prevOrders.map((order) => {
              if (
                order.id === payload.orderId ||
                order.id === payload.order?.id
              ) {
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
              }
              return order;
            });
          }

          default:
            console.warn("Unknown WebSocket message type:", message.type);
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
    // This will use wss:// on secure (https) connections and ws:// on insecure (http) connections.
    const connect = () => {
      const isSecure = window.location.protocol === "https:";
      const wsProtocol = isSecure ? "wss:" : "ws:";

      // Use the host of the current page, which will be your ngrok URL in production/tunneling
      // Or localhost during local development
      const wsHost = window.location.host;

      // const websocketUrl = `${wsProtocol}//${wsHost}/?token=${token}`;
      // console.log(`Connecting to WebSocket at: ${websocketUrl}`);
      // const newWs = new WebSocket(websocketUrl);
      //  http://192.168.1.37:8000/
      const websocket = new WebSocket(
        `ws://192.168.29.213:8000?token=${token}`
      );
      console.log(`Connecting to WebSocket at: ${websocket}`);
      const newWs = websocket;

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
