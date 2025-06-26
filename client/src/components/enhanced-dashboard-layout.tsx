import { ReactNode } from "react";
import { Bell, User, Settings, LogOut, Home, FileText, Calendar, Users, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface EnhancedDashboardLayoutProps {
  children: ReactNode;
  title: string;
  userRole: string;
}

export function EnhancedDashboardLayout({ children, title, userRole }: EnhancedDashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const roleColors = {
    student: "from-blue-600 to-purple-600",
    faculty: "from-indigo-600 to-purple-600", 
    admin: "from-red-600 to-orange-600"
  };

  const roleIcons = {
    student: Home,
    faculty: Users,
    admin: Shield
  };

  const RoleIcon = roleIcons[userRole as keyof typeof roleIcons] || Home;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced Header */}
      <header className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl bg-gradient-to-r ${roleColors[userRole as keyof typeof roleColors]} text-white`}>
                <RoleIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  GVPCEW Leave Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {userRole} Dashboard
                </p>
              </div>
            </div>

            {/* Center Section - Quick Stats */}
            <div className="hidden md:flex items-center space-x-6">
              <Card className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </Card>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {user?.role} • {user?.department}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${roleColors[userRole as keyof typeof roleColors]} flex items-center justify-center text-white font-medium`}>
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-red-600 hover:text-red-700"
                      onClick={() => logoutMutation.mutate()}
                    >
                      <LogOut className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Breadcrumb */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">Dashboard</span>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-gray-900 dark:text-white">{title}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  Academic Year 2024-25
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Semester II
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                © 2024 GVPCEW - Government Vishweshwaraya Polytechnic College for Engineering Women
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <button className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Help & Support
              </button>
              <button className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Privacy Policy
              </button>
              <button className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Terms of Service
              </button>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
              Leave Management System v2.0 - Developed with advanced multi-level approval workflows
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}