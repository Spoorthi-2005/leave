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

        ws.onopen = () => {
          console.log("WebSocket connected");
          // Send user identification
          ws.send(JSON.stringify({
            type: "auth",
            userId: user.id,
            role: user.role
          }));
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

        ws.onclose = () => {
          console.log("WebSocket disconnected");
          wsRef.current = null;
          
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
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