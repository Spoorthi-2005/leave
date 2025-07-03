import { useState } from "react";
import { useAuth } from "@/hooks/simple-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, FileText, Clock, CheckCircle, XCircle, LogOut, Eye, Plus } from "lucide-react";
import { format } from "date-fns";

export default function TeacherDashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewComments, setReviewComments] = useState("");
  
  // Teacher's own leave application state
  const [leaveForm, setLeaveForm] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: ""
  });
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  const { data: pendingApplications = [] } = useQuery({
    queryKey: ["/api/leave-applications/pending"],
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ["/api/leave-applications/all"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ["/api/my-leave-applications"],
  });

  const submitLeaveMutation = useMutation({
    mutationFn: async (leaveData: any) => {
      const response = await apiRequest("POST", "/api/leave-applications", leaveData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-leave-applications"] });
      setLeaveForm({ type: "", startDate: "", endDate: "", reason: "" });
      setShowLeaveForm(false);
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
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

  const handleSubmitLeave = () => {
    if (!leaveForm.type || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      return;
    }

    submitLeaveMutation.mutate(leaveForm);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getDaysCount = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Teacher Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {user?.fullName}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApplications.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allApplications.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {allApplications.filter((app: any) => app.status === "approved").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {allApplications.filter((app: any) => app.status === "rejected").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="my-leaves" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-leaves">My Leave Applications ({myApplications.length})</TabsTrigger>
            <TabsTrigger value="pending">Student Reviews ({pendingApplications.length})</TabsTrigger>
            <TabsTrigger value="all">All Student Applications ({allApplications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="my-leaves">
            <div className="space-y-6">
              {/* Submit New Leave Application */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Submit Leave Application</CardTitle>
                    <Button onClick={() => setShowLeaveForm(!showLeaveForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {showLeaveForm ? "Cancel" : "New Application"}
                    </Button>
                  </div>
                </CardHeader>
                {showLeaveForm && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Leave Type</Label>
                        <Select value={leaveForm.type} onValueChange={(value) => setLeaveForm({...leaveForm, type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sick">Sick Leave</SelectItem>
                            <SelectItem value="personal">Personal Leave</SelectItem>
                            <SelectItem value="vacation">Vacation</SelectItem>
                            <SelectItem value="emergency">Emergency Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            type="date"
                            value={leaveForm.startDate}
                            onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate">End Date</Label>
                          <Input
                            type="date"
                            value={leaveForm.endDate}
                            onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reason">Reason</Label>
                      <Textarea
                        value={leaveForm.reason}
                        onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                        placeholder="Please provide a detailed reason for your leave..."
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={handleSubmitLeave}
                      disabled={submitLeaveMutation.isPending || !leaveForm.type || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()}
                      className="w-full"
                    >
                      {submitLeaveMutation.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* My Applications List */}
              <Card>
                <CardHeader>
                  <CardTitle>My Leave Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {myApplications.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No leave applications submitted yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {myApplications.map((application: any) => (
                        <div
                          key={application.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <Badge className="capitalize">{application.type}</Badge>
                                {getStatusBadge(application.status)}
                                <Badge variant="outline">
                                  {getDaysCount(application.startDate, application.endDate)} days
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {format(new Date(application.startDate), "MMM dd, yyyy")} - {" "}
                                {format(new Date(application.endDate), "MMM dd, yyyy")}
                              </p>
                              <p className="text-gray-700 mb-3">{application.reason}</p>
                              {application.comments && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm font-medium">Review Comments:</p>
                                  <p className="text-sm text-gray-700">{application.comments}</p>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Applied: {format(new Date(application.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                                {application.reviewedAt && (
                                  <> • Reviewed: {format(new Date(application.reviewedAt), "MMM dd, yyyy 'at' h:mm a")}</>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Applications Awaiting Review</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingApplications.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No pending applications to review.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingApplications.map((application: any) => (
                      <div
                        key={application.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-medium">{application.studentName}</h3>
                              <Badge className="capitalize">{application.type}</Badge>
                              <Badge variant="outline">
                                {getDaysCount(application.startDate, application.endDate)} days
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {format(new Date(application.startDate), "MMM dd, yyyy")} - {" "}
                              {format(new Date(application.endDate), "MMM dd, yyyy")}
                            </p>
                            <p className="text-gray-700 mb-3">{application.reason}</p>
                            <p className="text-xs text-gray-500">
                              Applied: {format(new Date(application.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
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
                                  <DialogTitle>Review Leave Application</DialogTitle>
                                </DialogHeader>
                                {selectedApplication && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <p><strong>Student:</strong> {selectedApplication.studentName}</p>
                                      <p><strong>Type:</strong> {selectedApplication.type}</p>
                                      <p><strong>Duration:</strong> {format(new Date(selectedApplication.startDate), "MMM dd")} - {format(new Date(selectedApplication.endDate), "MMM dd, yyyy")}</p>
                                      <p><strong>Days:</strong> {getDaysCount(selectedApplication.startDate, selectedApplication.endDate)}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium mb-2">Reason:</p>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                        {selectedApplication.reason}
                                      </p>
                                    </div>
                                    <div>
                                      <Label htmlFor="comments">Your Comments</Label>
                                      <Textarea
                                        id="comments"
                                        value={reviewComments}
                                        onChange={(e) => setReviewComments(e.target.value)}
                                        placeholder="Add your comments about this application..."
                                        className="mt-1"
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleReview("approved")}
                                        disabled={!reviewComments.trim() || reviewMutation.isPending}
                                        className="flex-1"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleReview("rejected")}
                                        disabled={!reviewComments.trim() || reviewMutation.isPending}
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

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Leave Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {allApplications.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No applications found.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {allApplications.map((application: any) => (
                      <div
                        key={application.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-medium">{application.studentName}</h3>
                              <Badge className="capitalize">{application.type}</Badge>
                              <Badge className={getStatusBadge(application.status)}>
                                {application.status}
                              </Badge>
                              <Badge variant="outline">
                                {getDaysCount(application.startDate, application.endDate)} days
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {format(new Date(application.startDate), "MMM dd, yyyy")} - {" "}
                              {format(new Date(application.endDate), "MMM dd, yyyy")}
                            </p>
                            <p className="text-gray-700 mb-2">{application.reason}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Applied: {format(new Date(application.createdAt), "MMM dd, yyyy")}</span>
                          {application.reviewedAt && (
                            <span>Reviewed: {format(new Date(application.reviewedAt), "MMM dd, yyyy")}</span>
                          )}
                        </div>
                        {application.comments && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                            <p className="text-sm font-medium text-blue-900">Review Comments:</p>
                            <p className="text-sm text-blue-800 mt-1">{application.comments}</p>
                          </div>
                        )}
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