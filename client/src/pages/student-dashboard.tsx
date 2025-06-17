import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/stats-card";
import { LeaveApplicationModal } from "@/components/leave-application-modal";
import { LeaveDetailsModal } from "@/components/leave-details-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Redirect } from "wouter";
import { 
  CalendarDays, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Plus, 
  History, 
  Download,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import AdminDashboard from "./admin-dashboard";
import FacultyDashboard from "./faculty-dashboard";

export default function StudentDashboard() {
  const { user, isLoading } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const { data: applications } = useQuery({
    queryKey: ["/api/leave-applications"],
    enabled: !!user,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Route to appropriate dashboard based on role
  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  if (user.role === "faculty") {
    return <FacultyDashboard />;
  }

  const navItems = [
    { label: "Dashboard", href: "#", active: true },
    { label: "My Leaves", href: "#" },
    { label: "Apply Leave", href: "#" },
  ];

  const recentApplications = applications?.slice(0, 5) || [];

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

  const viewApplication = (application: any) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="Student Dashboard" navItems={navItems} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Welcome back, {user.fullName}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Available Leave"
            value={stats?.leaveBalance?.availableLeaves || 30}
            icon={CalendarDays}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
          />
          <StatsCard
            title="Approved"
            value={stats?.leaveStats?.approved || 0}
            icon={CheckCircle}
            iconColor="text-secondary"
            iconBgColor="bg-secondary/10"
          />
          <StatsCard
            title="Pending"
            value={stats?.leaveStats?.pending || 0}
            icon={Clock}
            iconColor="text-warning"
            iconBgColor="bg-warning/10"
          />
          <StatsCard
            title="Rejected"
            value={stats?.leaveStats?.rejected || 0}
            icon={XCircle}
            iconColor="text-destructive"
            iconBgColor="bg-destructive/10"
          />
        </div>

        {/* Quick Actions & Recent Leaves */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Apply for Leave
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <History className="mr-2 h-4 w-4" />
                  View Leave History
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Leave Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Leave Applications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Leave Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {recentApplications.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No leave applications found.</p>
                    <Button
                      onClick={() => setShowApplyModal(true)}
                      className="mt-4"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Apply for Your First Leave
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentApplications.map((application: any) => (
                          <tr key={application.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {application.leaveType} Leave
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(application.fromDate), "MMM dd")} - {format(new Date(application.toDate), "MMM dd, yyyy")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(application.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewApplication(application)}
                              >
                                <Eye className="h-4 w-4" />
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
        </div>
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
