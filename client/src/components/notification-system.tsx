import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function NotificationSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Poll for new notifications every 30 seconds
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications?unread=true"],
    refetchInterval: 30000, // 30 seconds
    enabled: !!user,
  });

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      // Show toast for latest notification
      const latestNotification = notifications[0];
      
      // Only show toast if notification is very recent (within last minute)
      const notificationTime = new Date(latestNotification.createdAt).getTime();
      const now = new Date().getTime();
      const oneMinute = 60 * 1000;
      
      if (now - notificationTime < oneMinute) {
        toast({
          title: latestNotification.title,
          description: latestNotification.message,
          variant: latestNotification.type === "error" ? "destructive" : "default",
        });
      }
    }
  }, [notifications, toast]);

  // Real-time updates would typically use WebSocket/Socket.io here
  // For now, we rely on periodic polling

  return null; // This component doesn't render anything visible
}
