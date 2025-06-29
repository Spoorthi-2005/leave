import { useEffect, useRef } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { queryClient } from "@/lib/queryClient";

export function useWebSocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Add connection timeout
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            console.warn("WebSocket connection timeout, closing...");
            ws.close();
          }
        }, 10000);

        ws.onopen = () => {
          console.log("WebSocket connected successfully");
          clearTimeout(connectionTimeout);
          
          // Send user identification
          try {
            ws.send(JSON.stringify({
              type: "auth",
              userId: user.id,
              role: user.role,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            console.error("Error sending WebSocket auth:", error);
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case "leave_application_notification":
                toast({
                  title: "New Leave Application",
                  description: `${data.applicantName} has submitted a ${data.leaveType} leave application`,
                });
                // Invalidate relevant queries
                queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
                queryClient.invalidateQueries({ queryKey: ["/api/pending-applications"] });
                break;

              case "leave_status_update":
                toast({
                  title: "Leave Status Updated",
                  description: `Your ${data.leaveType} leave application has been ${data.status}`,
                  variant: data.status === "approved" ? "default" : data.status === "rejected" ? "destructive" : "default"
                });
                // Invalidate user's applications
                queryClient.invalidateQueries({ queryKey: ["/api/my-applications"] });
                queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
                break;

              case "substitute_assignment":
                toast({
                  title: "Substitute Assignment",
                  description: `You have been assigned as a substitute for ${data.originalFaculty}`,
                });
                queryClient.invalidateQueries({ queryKey: ["/api/substitute-assignments"] });
                break;

              case "system_notification":
                toast({
                  title: data.title || "System Notification",
                  description: data.message,
                  variant: data.variant || "default"
                });
                break;

              default:
                console.log("Unknown WebSocket message type:", data.type);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onclose = (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason);
          wsRef.current = null;
          
          // Only attempt reconnection if not a manual close
          if (event.code !== 1000) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log("Attempting WebSocket reconnection...");
              connect();
            }, 3000);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket connection error:", error);
          // Handle DOMException and other WebSocket errors gracefully
          if (error instanceof Event && error.type === 'error') {
            console.warn("WebSocket connection failed, will retry...");
          }
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        // Handle DOMException and other connection errors
        if (error instanceof DOMException || error instanceof Error) {
          console.warn("WebSocket creation failed, will retry in 5 seconds...");
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, toast]);

  return wsRef.current;
}