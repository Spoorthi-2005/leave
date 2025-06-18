import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, Users, Clock, CheckCircle, XCircle, FileText, Bell, LogOut, 
  TrendingUp, BarChart3, Activity, Settings, UserCheck, AlertTriangle,
  Calendar, Search, Filter, Download, Eye, MessageSquare
} from "lucide-react";
import { LeaveDetailsModal } from "@/components/leave-details-modal";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/stats-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LeaveApplication } from "@shared/schema";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: pendingApplications = [], isLoading: pendingLoading } = useQuery<LeaveApplication[]>({
    queryKey: ["/api/leave-applications/pending"],
    enabled: !!user,
  });

  const { data: allApplications = [], isLoading: allLoading } = useQuery<LeaveApplication[]>({
    queryKey: ["/api/leave-applications/all"],
    enabled: !!user,
  });

  const { data: systemStats } = useQuery({
    queryKey: ["/api/dashboard/system-stats"],
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users/all"],
    enabled: !!user,
  });

  const approveApplication = useMutation({
    mutationFn: async ({ id, comments }: { id: number; comments: string }) => {
      const res = await apiRequest("PATCH", `/api/leave-applications/${id}/status`, {
        status: "approved",
        comments,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      toast({
        title: "Application Approved",
        description: "The leave application has been approved successfully.",
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

  const rejectApplication = useMutation({
    mutationFn: async ({ id, comments }: { id: number; comments: string }) => {
      const res = await apiRequest("PATCH", `/api/leave-applications/${id}/status`, {
        status: "rejected",
        comments,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      toast({
        title: "Application Rejected",
        description: "The leave application has been rejected.",
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

  const filteredApplications = allApplications.filter((app: any) => {
    const matchesSearch = app.userId?.toString().includes(searchTerm) || 
                         app.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (application: LeaveApplication) => {
    if (!reviewComments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide comments before approving the application.",
        variant: "destructive",
      });
      return;
    }
    approveApplication.mutate({ id: application.id, comments: reviewComments });
  };

  const handleReject = (application: LeaveApplication) => {
    if (!reviewComments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide comments before rejecting the application.",
        variant: "destructive",
      });
      return;
    }
    rejectApplication.mutate({ id: application.id, comments: reviewComments });
  };

  return (
    <div className="min-h-screen luxury-gradient">
      <Navigation 
        title="GVPCEW Admin Portal - HOD Dashboard"
        navItems={[
          { label: "Dashboard", href: "/", active: true },
          { label: "Pending Approvals", href: "#pending", active: false },
          { label: "All Applications", href: "#all", active: false },
          { label: "Users", href: "#users", active: false },
          { label: "System Stats", href: "#stats", active: false },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <div className="luxury-card p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Admin Dashboard - HOD Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                {user?.fullName} • Head of Department • {user?.department}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge className="bg-gradient-to-r from-red-100 to-orange-100 text-red-800 border border-red-200 px-4 py-2">
                  <Shield className="w-4 h-4 mr-2" />
                  Administrator
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200 px-4 py-2">
                  <UserCheck className="w-4 h-4 mr-2" />
                  HOD Access
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
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

        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Pending Approvals"
            value={pendingApplications.length}
            icon={Clock}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
          />
          <StatsCard
            title="Total Applications"
            value={allApplications.length}
            icon={FileText}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatsCard
            title="Total Users"
            value={users.length}
            icon={Users}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatsCard
            title="Approved This Month"
            value={allApplications.filter((app: any) => 
              app.status === 'approved' && 
              new Date(app.updatedAt).getMonth() === new Date().getMonth()
            ).length}
            icon={CheckCircle}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="pending" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-900 luxury-card p-2 h-auto">
            <TabsTrigger value="pending" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
              Pending Approvals ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <FileText className="w-4 h-4" />
              All Applications
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <Users className="w-4 h-4" />
              Users Management
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <BarChart3 className="w-4 h-4" />
              System Statistics
            </TabsTrigger>
          </TabsList>

          {/* Pending Approvals Tab */}
          <TabsContent value="pending" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-red-600">Applications Requiring Your Approval</h2>
              <Badge className="bg-red-100 text-red-800 px-4 py-2">
                {pendingApplications.length} Pending
              </Badge>
            </div>

            {pendingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : pendingApplications.length === 0 ? (
              <Card className="luxury-card">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">All Caught Up!</h3>
                  <p className="text-gray-500">No pending leave applications requiring your approval.</p>
                </CardContent>
              </Card>
            ) : (
              pendingApplications.map((application: LeaveApplication) => (
                <Card key={application.id} className="luxury-card border-l-4 border-l-amber-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          Leave Application #{application.id}
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
                          onClick={() => handleReject(application)}
                          variant="destructive"
                          size="sm"
                          disabled={rejectApplication.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleApprove(application)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                          disabled={approveApplication.isPending}
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

          {/* All Applications Tab */}
          <TabsContent value="all" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">All Leave Applications</h2>
              <div className="flex gap-4">
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredApplications.map((application: any) => (
                <Card key={application.id} className="luxury-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Application #{application.id}</h4>
                        <p className="text-sm text-gray-500">
                          {format(new Date(application.fromDate), 'MMM dd')} - {format(new Date(application.toDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="capitalize">
                          {application.leaveType}
                        </Badge>
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <h2 className="text-2xl font-bold">Users Management</h2>
            <div className="grid gap-4">
              {users.map((user: any) => (
                <Card key={user.id} className="luxury-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{user.fullName}</h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                        <Badge variant="outline">
                          {user.department}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* System Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <h2 className="text-2xl font-bold">System Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle>Applications by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span>{allApplications.filter((app: any) => app.status === 'pending').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved:</span>
                      <span>{allApplications.filter((app: any) => app.status === 'approved').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rejected:</span>
                      <span>{allApplications.filter((app: any) => app.status === 'rejected').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Details Modal */}
      <LeaveDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        application={selectedApplication}
        canReview={true}
        onApprove={() => selectedApplication && handleApprove(selectedApplication)}
        onReject={() => selectedApplication && handleReject(selectedApplication)}
      />
    </div>
  );
}