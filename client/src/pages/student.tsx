import { useState } from "react";
import { useAuth } from "@/hooks/simple-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, User, LogOut, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const leaveSchema = z.object({
  type: z.enum(["sick", "personal", "emergency", "vacation"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)"),
});

type LeaveFormData = z.infer<typeof leaveSchema>;

export default function StudentDashboard() {
  const { user, logoutMutation } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      type: undefined,
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["/api/leave-applications"],
  });

  const { data: leaveBalance } = useQuery({
    queryKey: ["/api/leave-balance"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: LeaveFormData) => {
      const response = await apiRequest("POST", "/api/leave-applications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-balance"] });
      setShowForm(false);
      form.reset();
    },
  });

  const onSubmit = (data: LeaveFormData) => {
    submitMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Student Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaveBalance?.available || 20} days</div>
              <p className="text-xs text-muted-foreground">
                Used: {leaveBalance?.used || 0} days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter((app: any) => app.status === "pending").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Section */}
        <div className="mb-8">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Leave Application
          </Button>
        </div>

        {/* Leave Application Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Submit Leave Application</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Leave Type</Label>
                    <Select
                      value={form.watch("type") || ""}
                      onValueChange={(value) => form.setValue("type", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="vacation">Vacation</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.type && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.type.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...form.register("startDate")}
                      className="mt-1"
                    />
                    {form.formState.errors.startDate && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.startDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...form.register("endDate")}
                      className="mt-1"
                    />
                    {form.formState.errors.endDate && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.endDate.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    {...form.register("reason")}
                    placeholder="Please provide a detailed reason for your leave request..."
                    className="mt-1"
                    rows={4}
                  />
                  {form.formState.errors.reason && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.reason.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>My Leave Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No leave applications found. Create your first application above.
              </p>
            ) : (
              <div className="space-y-4">
                {applications.map((application: any) => (
                  <div
                    key={application.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium capitalize">
                          {application.type} Leave
                        </h3>
                        <p className="text-sm text-gray-600">
                          {format(new Date(application.startDate), "MMM dd, yyyy")} - {" "}
                          {format(new Date(application.endDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge className={getStatusBadge(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{application.reason}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Applied: {format(new Date(application.createdAt), "MMM dd, yyyy")}</span>
                      {application.reviewedBy && (
                        <span>Reviewed by: {application.reviewerName}</span>
                      )}
                    </div>
                    {application.comments && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <p className="text-sm font-medium text-blue-900">Teacher's Comments:</p>
                        <p className="text-sm text-blue-800 mt-1">{application.comments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}