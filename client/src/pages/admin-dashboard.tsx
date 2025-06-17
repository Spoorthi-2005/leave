import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Clock, 
  CalendarCheck, 
  TrendingUp,
  FileText,
  UserPlus,
  Settings,
  Mail,
  CheckCircle,
  Circle
} from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const { data: recentApplications } = useQuery({
    queryKey: ["/api/leave-applications"],
    enabled: !!user,
  });

  const navItems = [
    { label: "Dashboard", href: "#", active: true },
    { label: "User Management", href: "#" },
    { label: "Leave Policies", href: "#" },
    { label: "Reports", href: "#" },
    { label: "Settings", href: "#" },
  ];

  const applications = recentApplications?.slice(0, 10) || [];

  const systemHealthItems = [
    { label: "Database", status: "online", color: "text-secondary" },
    { label: "Email Service", status: "active", color: "text-secondary" },
    { label: "File Storage", status: "85% used", color: "text-warning" },
    { label: "Backup Status", status: "up to date", color: "text-secondary" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="Admin Dashboard" navItems={navItems} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">System overview and administrative controls</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
          />
          <StatsCard
            title="Pending Approvals"
            value={stats?.pendingApprovals || 0}
            icon={Clock}
            iconColor="text-warning"
            iconBgColor="bg-warning/10"
          />
          <StatsCard
            title="Leaves This Month"
            value={stats?.leavesThisMonth || 0}
            icon={CalendarCheck}
            iconColor="text-secondary"
            iconBgColor="bg-secondary/10"
          />
          <StatsCard
            title="System Efficiency"
            value={`${stats?.efficiency || 94}%`}
            icon={TrendingUp}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent System Activity</CardTitle>
                <Button variant="link" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No recent activity found.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {applications.map((application: any, index: number) => (
                      <div key={application.id} className="flex items-start space-x-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          application.status === 'approved' ? 'bg-secondary' : 
                          application.status === 'rejected' ? 'bg-destructive' : 'bg-warning'
                        }`}>
                          <CheckCircle className={`h-4 w-4 text-white`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <p className="text-sm text-gray-500">
                                {application.userName || "Unknown"}'s {application.leaveType} leave{" "}
                                <span className="font-medium text-gray-900">
                                  {application.status === 'approved' ? 'approved' : 
                                   application.status === 'rejected' ? 'rejected' : 'submitted'}
                                </span>
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time>{format(new Date(application.appliedAt), "PPp")}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & System Health */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
                <Button className="w-full bg-secondary hover:bg-secondary/90">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New User
                </Button>
                <Button className="w-full bg-warning hover:bg-warning/90 text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </Button>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Notifications
                </Button>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemHealthItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className={`flex items-center text-sm ${item.color}`}>
                      <Circle className="h-2 w-2 mr-1 fill-current" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
