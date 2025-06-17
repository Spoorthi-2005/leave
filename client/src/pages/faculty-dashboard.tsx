import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/stats-card";
import { LeaveDetailsModal } from "@/components/leave-details-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Clock, 
  CheckCircle, 
  Users, 
  UserCheck,
  Eye,
  Check,
  X,
  Filter,
  Download
} from "lucide-react";
import { format } from "date-fns";

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const { data: pendingApplications } = useQuery({
    queryKey: ["/api/leave-applications"],
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: number; status: string; comments?: string }) => {
      const res = await apiRequest("PATCH", `/api/leave-applications/${id}/status`, {
        status,
        comments,
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success!",
        description: `Leave application has been ${variables.status}.`,
        variant: variables.status === "approved" ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowDetailsModal(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const navItems = [
    { label: "Dashboard", href: "#", active: true },
    { label: "Pending Reviews", href: "#" },
    { label: "My Leaves", href: "#" },
    { label: "Substitute Assignment", href: "#" },
  ];

  const applications = pendingApplications || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="leave-status-approved">Approved</Badge>;
      case "rejected":
        return <Badge className="leave-status-rejected">Rejected</Badge>;
      case "pending":
        return <Badge className="leave-status-pending">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    return priority === "urgent" ? (
      <Badge className="priority-urgent">Urgent</Badge>
    ) : (
      <Badge className="priority-normal">Normal</Badge>
    );
  };

  const viewApplication = (application: any) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleApprove = () => {
    if (selectedApplication) {
      updateStatusMutation.mutate({
        id: (selectedApplication as any).id,
        status: "approved",
      });
    }
  };

  const handleReject = () => {
    if (selectedApplication) {
      updateStatusMutation.mutate({
        id: (selectedApplication as any).id,
        status: "rejected",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="Faculty Dashboard" navItems={navItems} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Manage student leave applications and review requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Pending Reviews"
            value={stats?.reviewStats?.pending || 0}
            icon={Clock}
            iconColor="text-warning"
            iconBgColor="bg-warning/10"
          />
          <StatsCard
            title="Approved Today"
            value={stats?.reviewStats?.approvedToday || 0}
            icon={CheckCircle}
            iconColor="text-secondary"
            iconBgColor="bg-secondary/10"
          />
          <StatsCard
            title="Students Assigned"
            value={stats?.facultyStats?.studentsAssigned || 0}
            icon={Users}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
          />
          <StatsCard
            title="Substitute Requests"
            value={stats?.facultyStats?.substituteRequests || 0}
            icon={UserCheck}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>

        {/* Pending Reviews Table */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Leave Reviews</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-1 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No pending leave applications.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leave Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((application: any) => (
                      <tr key={application.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {application.userName?.charAt(0) || "U"}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {application.userName || "Unknown"}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {application.studentId || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {application.leaveType} Leave
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(application.fromDate), "MMM dd")} - {format(new Date(application.toDate), "MMM dd, yyyy")}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {application.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPriorityBadge(application.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewApplication(application)}
                          >
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              updateStatusMutation.mutate({
                                id: application.id,
                                status: "approved",
                              });
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            <Check className="h-4 w-4 text-secondary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              updateStatusMutation.mutate({
                                id: application.id,
                                status: "rejected",
                              });
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leave Details Modal */}
      <LeaveDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        application={selectedApplication}
        onApprove={handleApprove}
        onReject={handleReject}
        canReview={true}
      />
    </div>
  );
}
