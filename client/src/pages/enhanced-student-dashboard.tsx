import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, Calendar, Clock, CheckCircle, XCircle, FileText, Bell, User, LogOut, 
  TrendingUp, BarChart3, Download, Filter, Award, Target, Activity,
  Users, AlertCircle, Star, Shield, Zap, Heart, MapPin, Eye
} from "lucide-react";
import { LeaveApplicationModal } from "@/components/leave-application-modal";
import { LeaveDetailsModal } from "@/components/leave-details-modal";
import { LeaveHistory } from "@/components/leave-history";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/stats-card";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import type { LeaveApplication } from "@shared/schema";

export default function EnhancedStudentDashboard() {
  const { user, isLoading, logoutMutation } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [realtimeNotifications, setRealtimeNotifications] = useState<any[]>([]);

  // Real-time notification listener
  useEffect(() => {
    const handleRealtimeNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      setRealtimeNotifications(prev => [customEvent.detail, ...prev.slice(0, 4)]);
    };

    window.addEventListener('realtime-notification', handleRealtimeNotification);
    return () => window.removeEventListener('realtime-notification', handleRealtimeNotification);
  }, []);

  const { data: applications = [], isLoading: applicationsLoading } = useQuery<LeaveApplication[]>({
    queryKey: ["/api/leave-applications/user"],
    enabled: !!user,
  });

  const { data: leaveBalance = { availableLeaves: 30, usedLeaves: 0 } } = useQuery<{ availableLeaves: number; usedLeaves: number }>({
    queryKey: ["/api/leave-balance"],
    enabled: !!user,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard-stats"],
    enabled: !!user,
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen luxury-gradient flex items-center justify-center">
        <div className="luxury-card p-12 text-center">
          <div className="luxury-skeleton w-16 h-16 rounded-full mx-auto mb-6"></div>
          <div className="luxury-skeleton w-48 h-6 mx-auto mb-4"></div>
          <div className="luxury-skeleton w-32 h-4 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { class: "leave-status-pending", icon: Clock, label: "Pending Review" },
      teacher_approved: { class: "leave-status-teacher-approved", icon: CheckCircle, label: "Teacher Approved" },
      hod_approved: { class: "leave-status-hod-approved", icon: CheckCircle, label: "HOD Approved" },
      approved: { class: "leave-status-approved", icon: CheckCircle, label: "Fully Approved" },
      rejected: { class: "leave-status-rejected", icon: XCircle, label: "Rejected" },
      cancelled: { class: "leave-status-cancelled", icon: XCircle, label: "Cancelled" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.class} flex items-center gap-2 px-4 py-2 luxury-badge`}>
        <IconComponent className="w-4 h-4" />
        {config.label}
      </Badge>
    );
  };

  const recentApplications = applications.slice(0, 5);
  const pendingApplications = applications.filter((app: any) => 
    ['pending', 'teacher_approved', 'hod_approved'].includes(app.status)
  );

  return (
    <div className="min-h-screen luxury-gradient">
      {/* Enhanced Navigation */}
      <Navigation 
        title="GVPCEW Student Portal"
        navItems={[
          { label: "Dashboard", href: "/", active: true },
          { label: "Leave History", href: "#history", active: false },
          { label: "Reports", href: "#reports", active: false },
          { label: "Settings", href: "#settings", active: false },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="luxury-card p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, {user.fullName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                {user.studentId} • {user.department} • Year {user.year}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 px-4 py-2">
                  <Shield className="w-4 h-4 mr-2" />
                  Student Account
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 px-4 py-2">
                  <Star className="w-4 h-4 mr-2" />
                  Active Status
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowApplyModal(true)}
                className="luxury-button text-white px-8 py-4 text-lg"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Apply for Leave
              </Button>
              <Button
                onClick={() => logoutMutation.mutate()}
                variant="outline"
                className="px-6 py-4"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Real-time Notifications */}
        {realtimeNotifications.length > 0 && (
          <div className="mb-8">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Real-time Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {realtimeNotifications.map((notification, index) => (
                    <div key={index} className="notification-toast">
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Leave Balance"
            value={`${leaveBalance?.availableLeaves || 30}/30`}
            icon={Calendar}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatsCard
            title="Applications This Year"
            value={applications.length}
            icon={FileText}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatsCard
            title="Pending Reviews"
            value={pendingApplications.length}
            icon={Clock}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
          />
          <StatsCard
            title="Approval Rate"
            value={`${Math.round((applications.filter((app: any) => app.status === 'approved').length / Math.max(applications.length, 1)) * 100)}%`}
            icon={TrendingUp}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>

        {/* Enhanced Tabs Interface */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-900 luxury-card p-2 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <FileText className="w-4 h-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <BarChart3 className="w-4 h-4" />
              History & Reports
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leave Balance Progress */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Leave Balance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Used Leaves</span>
                      <span>{leaveBalance?.usedLeaves || 0}/30</span>
                    </div>
                    <Progress 
                      value={(leaveBalance?.usedLeaves || 0) / 30 * 100} 
                      className="h-3"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">{leaveBalance?.availableLeaves || 30}</div>
                      <div className="text-sm text-green-700 dark:text-green-400">Available</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{leaveBalance?.usedLeaves || 0}</div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">Used</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-500" />
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.slice(0, 5).map((notification: any) => (
                      <div key={notification.id} className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">{format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Recent Applications</h2>
              <Button onClick={() => setShowApplyModal(true)} className="luxury-button">
                <Plus className="w-4 h-4 mr-2" />
                New Application
              </Button>
            </div>

            <div className="grid gap-6">
              {applicationsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="luxury-skeleton h-32 rounded-xl"></div>
                  ))}
                </div>
              ) : recentApplications.length === 0 ? (
                <Card className="luxury-card border-dashed border-2">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No Applications Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Start by creating your first leave application.</p>
                    <Button onClick={() => setShowApplyModal(true)} className="luxury-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Apply for Leave
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                recentApplications.map((application: any) => (
                  <Card key={application.id} className="luxury-card hover:shadow-2xl transition-all duration-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">
                            {format(new Date(application.fromDate), 'MMM dd')} - {format(new Date(application.toDate), 'MMM dd, yyyy')}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Applied on {format(new Date(application.appliedAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        {getStatusBadge(application.status)}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</p>
                          <Badge variant="outline" className="capitalize">
                            {application.leaveType}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {Math.ceil((new Date(application.toDate).getTime() - new Date(application.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</p>
                          <Badge className={application.priority === 'urgent' ? 'priority-urgent' : 'priority-normal'}>
                            {application.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          {application.reason}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {application.attachmentPath && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <FileText className="w-4 h-4" />
                              Document Attached
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* History & Reports Tab */}
          <TabsContent value="history">
            <LeaveHistory userId={user.id} />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <p className="text-lg font-semibold">{user.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Student ID</label>
                    <p className="text-lg font-semibold">{user.studentId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                    <p className="text-lg font-semibold">{user.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
                    <p className="text-lg font-semibold">Year {user.year}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="text-lg font-semibold">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                    <p className="text-lg font-semibold">{user.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <LeaveApplicationModal
        open={showApplyModal}
        onOpenChange={setShowApplyModal}
      />

      <LeaveDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        application={selectedApplication}
      />
    </div>
  );
}