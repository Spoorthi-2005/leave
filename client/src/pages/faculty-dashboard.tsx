import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, Users, Clock, CheckCircle, XCircle, FileText, Bell, LogOut, 
  TrendingUp, BarChart3, Activity, BookOpen, UserCheck, Plus,
  Calendar, Eye, MessageSquare, Award, Star
} from "lucide-react";
import { LeaveApplicationModal } from "@/components/leave-application-modal";
import { LeaveDetailsModal } from "@/components/leave-details-modal";
import { LeaveHistory } from "@/components/leave-history";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/stats-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LeaveApplication } from "@shared/schema";

export default function FacultyDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [reviewComments, setReviewComments] = useState("");

  const { data: myApplications = [], isLoading: myAppsLoading } = useQuery<LeaveApplication[]>({
    queryKey: ["/api/leave-applications/user"],
    enabled: !!user,
  });

  const { data: studentsToReview = [], isLoading: reviewLoading } = useQuery<LeaveApplication[]>({
    queryKey: ["/api/leave-applications/for-review"],
    enabled: !!user,
  });

  const { data: leaveBalance = { availableLeaves: 30, usedLeaves: 0 } } = useQuery<{ availableLeaves: number; usedLeaves: number }>({
    queryKey: ["/api/leave-balance"],
    enabled: !!user,
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const reviewApplication = useMutation({
    mutationFn: async ({ id, status, comments }: { id: number; status: string; comments: string }) => {
      const res = await apiRequest("PATCH", `/api/leave-applications/${id}/status`, {
        status,
        comments,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      toast({
        title: `Application ${variables.status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `The student's leave application has been ${variables.status}.`,
      });
      setReviewComments("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { class: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock, label: "Pending Review" },
      teacher_approved: { class: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle, label: "Teacher Approved" },
      hod_approved: { class: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: CheckCircle, label: "HOD Approved" },
      approved: { class: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, label: "Approved" },
      rejected: { class: "bg-red-100 text-red-800 border-red-200", icon: XCircle, label: "Rejected" },
      cancelled: { class: "bg-gray-100 text-gray-800 border-gray-200", icon: XCircle, label: "Cancelled" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.class} flex items-center gap-2 px-3 py-1 border`}>
        <IconComponent className="w-4 h-4" />
        {config.label}
      </Badge>
    );
  };

  const handleReview = (application: LeaveApplication, status: string) => {
    if (!reviewComments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide comments before reviewing the application.",
        variant: "destructive",
      });
      return;
    }
    reviewApplication.mutate({ id: application.id, status, comments: reviewComments });
  };

  const pendingMyApplications = myApplications.filter((app: LeaveApplication) => 
    ['pending', 'teacher_approved', 'hod_approved'].includes(app.status)
  );

  return (
    <div className="min-h-screen luxury-gradient">
      <Navigation 
        title="GVPCEW Faculty Portal"
        navItems={[
          { label: "Dashboard", href: "/", active: true },
          { label: "My Applications", href: "#my-apps", active: false },
          { label: "Student Reviews", href: "#reviews", active: false },
          { label: "History", href: "#history", active: false },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Faculty Header */}
        <div className="luxury-card p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Faculty Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                {user?.fullName} • Faculty • {user?.department}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200 px-4 py-2">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Faculty Member
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200 px-4 py-2">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Class Teacher
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

        {/* Faculty Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="My Leave Balance"
            value={`${leaveBalance.availableLeaves}/30`}
            icon={Calendar}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatsCard
            title="My Applications"
            value={myApplications.length}
            icon={FileText}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatsCard
            title="Students to Review"
            value={studentsToReview.length}
            icon={Users}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatsCard
            title="Pending My Approval"
            value={pendingMyApplications.length}
            icon={Clock}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
          />
        </div>

        {/* Faculty Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-900 luxury-card p-2 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="my-applications" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <FileText className="w-4 h-4" />
              My Applications
            </TabsTrigger>
            <TabsTrigger value="student-reviews" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <Users className="w-4 h-4" />
              Student Reviews ({studentsToReview.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <BarChart3 className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leave Balance Progress */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    My Leave Balance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Used Leaves</span>
                      <span>{leaveBalance.usedLeaves}/30</span>
                    </div>
                    <Progress 
                      value={(leaveBalance.usedLeaves / 30) * 100} 
                      className="h-3"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">{leaveBalance.availableLeaves}</div>
                      <div className="text-sm text-green-700 dark:text-green-400">Available</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{leaveBalance.usedLeaves}</div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">Used</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Faculty Responsibilities */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-purple-500" />
                    Faculty Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                      <div>
                        <p className="font-medium">Student Applications to Review</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending your approval</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                        {studentsToReview.length}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                      <div>
                        <p className="font-medium">Class Teaching Duties</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active classes assigned</p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Notifications */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-500" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification: any) => (
                      <div key={notification.id} className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">{format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Applications Tab */}
          <TabsContent value="my-applications" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Leave Applications</h2>
              <Button onClick={() => setShowApplyModal(true)} className="luxury-button">
                <Plus className="w-4 h-4 mr-2" />
                New Application
              </Button>
            </div>

            <div className="grid gap-6">
              {myAppsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : myApplications.length === 0 ? (
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
                myApplications.map((application: LeaveApplication) => (
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
                          <Badge className={application.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
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

          {/* Student Reviews Tab */}
          <TabsContent value="student-reviews" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-indigo-600">Student Applications for Review</h2>
              <Badge className="bg-indigo-100 text-indigo-800 px-4 py-2">
                {studentsToReview.length} Pending Review
              </Badge>
            </div>

            {reviewLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : studentsToReview.length === 0 ? (
              <Card className="luxury-card">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">All Caught Up!</h3>
                  <p className="text-gray-500">No student applications requiring your review.</p>
                </CardContent>
              </Card>
            ) : (
              studentsToReview.map((application: LeaveApplication) => (
                <Card key={application.id} className="luxury-card border-l-4 border-l-indigo-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          Student Application #{application.id}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          From: {format(new Date(application.fromDate), 'MMM dd, yyyy')} - 
                          To: {format(new Date(application.toDate), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Applied: {format(new Date(application.appliedAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      {getStatusBadge(application.status)}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Leave Type</p>
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
                        <Badge className={application.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
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

                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Review Comments (Required)
                      </label>
                      <Textarea
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        placeholder="Enter your review comments..."
                        className="w-full"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
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
                        {application.attachmentPath && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <FileText className="w-4 h-4" />
                            Document Attached
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReview(application, 'rejected')}
                          variant="destructive"
                          size="sm"
                          disabled={reviewApplication.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleReview(application, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                          disabled={reviewApplication.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <LeaveHistory userId={user?.id} />
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
        canReview={false}
      />
    </div>
  );
}