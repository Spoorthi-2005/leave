import { ReactNode } from "react";
import { Bell, LogOut, User, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface EnhancedDashboardLayoutProps {
  children: ReactNode;
  title: string;
  userRole: string;
}

export function EnhancedDashboardLayout({ children, title, userRole }: EnhancedDashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.read).length : 0;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-600";
      case "faculty": return "bg-indigo-600";
      case "student": return "bg-blue-600";
      default: return "bg-gray-600";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return "👨‍💼";
      case "faculty": return "👨‍🏫";
      case "student": return "👨‍🎓";
      default: return "👤";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left side - Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${getRoleColor(userRole)} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                  <span>{getRoleIcon(userRole)}</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">GVPCEW</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
                </div>
              </div>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center space-x-4">
              
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-3 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    <p className="text-sm text-gray-600">{unreadCount} unread</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {Array.isArray(notifications) && notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notification: any) => (
                        <DropdownMenuItem key={notification.id} className="p-3 border-b last:border-b-0">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-gray-600">{notification.message}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        <p className="text-sm text-gray-500 py-4">No notifications</p>
                      </DropdownMenuItem>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Avatar and Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.fullName}&background=6366f1&color=ffffff`} />
                      <AvatarFallback className={`${getRoleColor(userRole)} text-white`}>
                        {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.fullName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user?.role}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="p-3 border-b">
                    <p className="font-medium">{user?.fullName}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {user?.role}
                    </Badge>
                  </div>
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © 2024 Gayatri Vidya Parishad College of Engineering for Women
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Advanced Leave Management System
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs">
                Version 2.0
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                System Online
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}