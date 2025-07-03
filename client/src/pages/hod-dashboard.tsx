import { useState } from "react";
import { useAuth } from "@/hooks/simple-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, FileText, Clock, CheckCircle, XCircle, LogOut, Eye, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function HODDashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewComments, setReviewComments] = useState("");

  const { data: pendingFacultyApplications = [] } = useQuery({
    queryKey: ["/api/leave-applications/pending-faculty"],
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ["/api/leave-applications/all"],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: number; status: string; comments: string }) => {
      const response = await apiRequest("PATCH", `/api/leave-applications/${id}/review`, {
        status,
        comments,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications/pending-faculty"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications/all"] });
      setSelectedApplication(null);
      setReviewComments("");
    },
  });

  const handleReview = (status: "approved" | "rejected") => {
    if (!selectedApplication || !reviewComments.trim()) return;
    
    reviewMutation.mutate({
      id: selectedApplication.id,
      status,
      comments: reviewComments,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case "forwarded_to_admin":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Forwarded to Admin</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateLeaveDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">HOD Dashboard</h1>
                  <p className="text-sm text-gray-500">Gayatri Vidya Parishad College of Engineering for Women</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.department} Department • HOD</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <FileText className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{allApplications.length}</p>
                <p className="text-sm text-gray-500">Total Applications</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-yellow-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingFacultyApplications.length}</p>
                <p className="text-sm text-gray-500">Pending Faculty Reviews</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {allApplications.filter(app => app.status === "approved").length}
                </p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <XCircle className="h-8 w-8 text-red-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {allApplications.filter(app => app.status === "rejected").length}
                </p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending Faculty Reviews ({pendingFacultyApplications.length})</TabsTrigger>
            <TabsTrigger value="all">All Applications ({allApplications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Faculty Leave Applications Requiring Review</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingFacultyApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No faculty applications pending review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingFacultyApplications.map((application: any) => (
                      <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <h3 className="font-medium text-gray-900">{application.studentName}</h3>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(application.startDate), "MMM dd, yyyy")} - {format(new Date(application.endDate), "MMM dd, yyyy")}
                                  <span className="ml-2 text-blue-600">({calculateLeaveDays(application.startDate, application.endDate)} days)</span>
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {application.type}
                              </Badge>
                              {getStatusBadge(application.status)}
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{application.reason}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedApplication(application)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Review Faculty Leave Application</DialogTitle>
                                </DialogHeader>
                                {selectedApplication && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <p><strong>Faculty:</strong> {selectedApplication.studentName}</p>
                                      <p><strong>Type:</strong> {selectedApplication.type}</p>
                                      <p><strong>Duration:</strong> {calculateLeaveDays(selectedApplication.startDate, selectedApplication.endDate)} days</p>
                                      <p><strong>Dates:</strong> {format(new Date(selectedApplication.startDate), "MMM dd, yyyy")} - {format(new Date(selectedApplication.endDate), "MMM dd, yyyy")}</p>
                                      <p><strong>Reason:</strong> {selectedApplication.reason}</p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="comments">Review Comments *</Label>
                                      <Textarea
                                        id="comments"
                                        placeholder="Enter your review comments..."
                                        value={reviewComments}
                                        onChange={(e) => setReviewComments(e.target.value)}
                                        rows={3}
                                      />
                                    </div>
                                    
                                    <div className="flex space-x-2">
                                      <Button
                                        onClick={() => handleReview("approved")}
                                        disabled={!reviewComments.trim() || reviewMutation.isPending}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button
                                        onClick={() => handleReview("rejected")}
                                        disabled={!reviewComments.trim() || reviewMutation.isPending}
                                        variant="destructive"
                                        className="flex-1"
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Leave Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {allApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No applications found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allApplications.map((application: any) => (
                      <div key={application.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <h3 className="font-medium text-gray-900">{application.studentName}</h3>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(application.startDate), "MMM dd, yyyy")} - {format(new Date(application.endDate), "MMM dd, yyyy")}
                                  <span className="ml-2 text-blue-600">({calculateLeaveDays(application.startDate, application.endDate)} days)</span>
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {application.type}
                              </Badge>
                              {getStatusBadge(application.status)}
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{application.reason}</p>
                            {application.comments && (
                              <p className="text-sm text-gray-500 mt-1 italic">Review: {application.comments}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}