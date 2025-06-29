import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedDashboardLayout } from "@/components/enhanced-dashboard-layout";
import { LeaveDetailsModal } from "@/components/leave-details-modal";
import { UniversityAnalytics } from "@/components/university-analytics";
import { AdvancedLeaveCalendar } from "@/components/advanced-leave-calendar";
import { useAuth } from "@/hooks/use-auth";

interface LeaveApplication {
  id: number;
  applicantName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  priority: string;
  department: string;
  createdAt: string;
}

export default function EnhancedAdminDashboard() {
  const { user } = useAuth();
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: dashboardStats = {} } = useQuery({
    queryKey: ["/api/dashboard-stats"],
    enabled: !!user,
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ["/api/leave-applications"],
    enabled: !!user,
  });

  const { data: pendingApplications = [] } = useQuery({
    queryKey: ["/api/pending-applications"],
    enabled: !!user,
  });

  const { data: systemStats = {
    totalApplications: 0,
    activeUsers: 0,
    approvalRate: 85
  } } = useQuery({
    queryKey: ["/api/system-stats"],
    enabled: !!user,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    return priority === "urgent" ? (
      <Badge variant="destructive" className="text-xs">Urgent</Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">Normal</Badge>
    );
  };

  const handleViewDetails = (application: LeaveApplication) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const statCards = [
    {
      title: "Total Applications",
      value: (systemStats as any)?.totalApplications || 0,
      icon: FileText,
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Active Users",
      value: (systemStats as any)?.activeUsers || 0,
      icon: Users,
      change: "+5%",
      changeType: "positive" as const,
    },
    {
      title: "Pending Reviews",
      value: Array.isArray(pendingApplications) ? pendingApplications.length : 0,
      icon: Clock,
      change: "3 urgent",
      changeType: "neutral" as const,
    },
    {
      title: "Approval Rate",
      value: `${(systemStats as any)?.approvalRate || 85}%`,
      icon: TrendingUp,
      change: "+2%",
      changeType: "positive" as const,
    },
  ];

  return (
    <EnhancedDashboardLayout title="Admin Dashboard" userRole="admin">
      <div className="space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Control Center</h1>
              <p className="text-red-100 mb-4">
                Welcome back, {user?.fullName} • System Administrator
              </p>
              <div className="flex items-center space-x-6">
                <Badge className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 px-4 py-2">
                  <Users className="w-4 h-4 mr-2" />
                  Administrator
                </Badge>
                <Badge className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 px-4 py-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Full System Access
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{new Date().toLocaleDateString()}</div>
              <div className="text-red-100">System Status: Online</div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="luxury-card hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${
                  stat.changeType === "positive" 
                    ? "text-green-600" 
                    : stat.changeType === "negative" 
                    ? "text-red-600" 
                    : "text-gray-600"
                }`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">All Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Pending Applications */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Pending Approvals</span>
                    <Badge variant="secondary">{pendingApplications.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {Array.isArray(pendingApplications) && pendingApplications.slice(0, 5).map((app: LeaveApplication) => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{app.applicantName}</p>
                            {getPriorityBadge(app.priority)}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {app.leaveType} • {app.department}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(app.fromDate).toLocaleDateString()} - {new Date(app.toDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(app)}
                        >
                          Review
                        </Button>
                      </div>
                    ))}
                    {pendingApplications.length === 0 && (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No pending applications</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {allApplications.slice(0, 5).map((app: LeaveApplication) => (
                      <div key={app.id} className="flex items-center space-x-3">
                        {getStatusIcon(app.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{app.applicantName}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {app.leaveType} application {app.status}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(app.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {allApplications.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* All Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle>All Leave Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allApplications.map((app: LeaveApplication) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(app.status)}
                          <div>
                            <p className="font-medium">{app.applicantName}</p>
                            <p className="text-sm text-gray-600">
                              {app.leaveType} • {app.department}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(app.fromDate).toLocaleDateString()} - {new Date(app.toDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(app.priority)}
                        <Badge variant="outline" className="capitalize">
                          {app.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(app)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                  {allApplications.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No applications found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <UniversityAnalytics userRole="admin" />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <AdvancedLeaveCalendar userRole="admin" />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <LeaveDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          application={selectedApplication}
          canReview={true}
        />
      </div>
    </EnhancedDashboardLayout>
  );
}