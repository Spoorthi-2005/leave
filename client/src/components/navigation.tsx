import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface NavigationProps {
  title: string;
  navItems?: Array<{
    label: string;
    href: string;
    active?: boolean;
  }>;
}

export function Navigation({ title, navItems = [] }: NavigationProps) {
  const { user, logoutMutation } = useAuth();

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications?unread=true"],
    enabled: !!user,
  });

  const unreadCount = notifications?.length || 0;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl font-bold text-primary">GVPCEW LMS</span>
            </div>
            {navItems.length > 0 && (
              <div className="ml-10 flex space-x-8">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`px-1 pb-4 text-sm font-medium border-b-2 ${
                      item.active
                        ? "text-primary border-primary"
                        : "text-gray-500 hover:text-gray-700 border-transparent"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-400" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Info */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{user?.fullName}</span>
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
