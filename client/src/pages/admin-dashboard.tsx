import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, CheckCircle, XCircle, User, Building2, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/simple-auth";

interface LeaveApplication {
  id: number;
  userId: number;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  reviewedBy?: number;
  reviewedAt?: string;
  comments?: string;
  createdAt: string;
  studentName?: string;
  reviewerName?: string;
}

export default function AdminDashboard() {
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending faculty applications
  const { data: pendingApplications = [], isLoading: loadingPending } = useQuery({
    queryKey: ["/api/admin/pending-applications"],
    refetchInterval: 5000,
  });

  // Fetch all faculty applications
  const { data: allFacultyApplications = [], isLoading: loadingAll } = useQuery({
    queryKey: ["/api/admin/faculty-applications"],
    refetchInterval: 5000,
  });

  // Review application mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, comments }: { id: number; action: string; comments: string }) => {
      const response = await apiRequest("POST", `/api/admin/review-application/${id}`, {
        action,
        comments,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Application Reviewed",
        description: `Leave application has been ${data.status.includes('approved') ? 'approved' : 'rejected'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faculty-applications"] });
      setSelectedApplication(null);
      setReviewComments("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to review application",
        variant: "destructive",
      });
    },
  });

  const handleReview = async (action: "approve" | "reject") => {
    if (!selectedApplication) return;
    
    if (!reviewComments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide comments for your decision",
        variant: "destructive",
      });
      return;
    }

    await reviewMutation.mutateAsync({
      id: selectedApplication.id,
      action,
      comments: reviewComments,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "admin_pending":
        return "bg-yellow-100 text-yellow-800";
      case "admin_approved":
        return "bg-green-100 text-green-800";
      case "admin_rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "admin_pending":
        return "Pending Admin Review";
      case "admin_approved":
        return "Approved by Admin";
      case "admin_rejected":
        return "Rejected by Admin";
      default:
        return status.replace("_", " ").toUpperCase();
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const ApplicationCard = ({ application }: { application: LeaveApplication }) => {
    const days = calculateDays(application.startDate, application.endDate);
    
    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {application.studentName || `User ${application.userId}`}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {application.type.toUpperCase()}
                </Badge>
                <Badge className={getStatusColor(application.status)}>
                  {getStatusText(application.status)}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {days} day{days > 1 ? 's' : ''}
              </div>
              <div className="text-xs text-gray-400">
                Applied: {formatDate(application.createdAt)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {formatDate(application.startDate)} - {formatDate(application.endDate)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Reason:</strong> {application.reason}
              </p>
            </div>
            
            {application.comments && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Comments:</strong> {application.comments}
                </p>
              </div>
            )}
            
            {application.status === "admin_pending" && (
              <div className="flex gap-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedApplication(application)}
                      className="flex-1"
                    >
                      Review Application
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Review Faculty Leave Application</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold">{application.studentName}</p>
                        <p className="text-sm text-gray-600">
                          {application.type.toUpperCase()} • {days} days
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(application.startDate)} - {formatDate(application.endDate)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Reason:</p>
                        <p className="text-sm text-gray-700">{application.reason}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Comments (Required)
                        </label>
                        <Textarea
                          value={reviewComments}
                          onChange={(e) => setReviewComments(e.target.value)}
                          placeholder="Provide comments for your decision..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => handleReview("approve")}
                          disabled={reviewMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleReview("reject")}
                          disabled={reviewMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const pendingCount = pendingApplications.length;
  const approvedCount = allFacultyApplications.filter(app => app.status === "admin_approved").length;
  const rejectedCount = allFacultyApplications.filter(app => app.status === "admin_rejected").length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Review and manage faculty leave applications requiring admin approval
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Welcome, {user?.fullName || 'Admin'}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => logoutMutation.mutate()}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Faculty</p>
                <p className="text-2xl font-bold text-blue-600">{allFacultyApplications.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending Reviews ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Faculty Applications ({allFacultyApplications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Faculty Leave Applications Pending Admin Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading applications...</p>
                </div>
              ) : pendingApplications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No faculty applications pending review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApplications.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                All Faculty Leave Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAll ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading applications...</p>
                </div>
              ) : allFacultyApplications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No faculty applications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allFacultyApplications.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}