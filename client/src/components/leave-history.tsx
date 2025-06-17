import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Download, Filter, Search, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaveHistoryProps {
  userId?: number;
  showFilters?: boolean;
  compact?: boolean;
}

export function LeaveHistory({ userId, showFilters = true, compact = false }: LeaveHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<string>("all");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/leave-applications", { userId, status: statusFilter, type: typeFilter, search: searchTerm, dateRange }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId.toString());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (dateRange !== 'all') params.append('dateRange', dateRange);
      
      const response = await fetch(`/api/leave-applications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leave applications');
      return response.json();
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400", icon: Clock },
      teacher_approved: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400", icon: CheckCircle },
      hod_approved: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400", icon: CheckCircle },
      approved: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400", icon: XCircle },
      cancelled: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400", icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 font-medium`}>
        <IconComponent className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getLeaveTypeBadge = (type: string) => {
    const typeColors = {
      sick: "bg-red-50 text-red-700 border-red-200",
      casual: "bg-blue-50 text-blue-700 border-blue-200",
      personal: "bg-purple-50 text-purple-700 border-purple-200",
      emergency: "bg-orange-50 text-orange-700 border-orange-200",
      other: "bg-gray-50 text-gray-700 border-gray-200"
    };

    return (
      <Badge variant="outline" className={typeColors[type as keyof typeof typeColors] || typeColors.other}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date Applied', 'Leave Type', 'From Date', 'To Date', 'Days', 'Status', 'Reason'].join(','),
      ...applications.map((app: any) => [
        format(new Date(app.appliedAt), 'yyyy-MM-dd'),
        app.leaveType,
        format(new Date(app.fromDate), 'yyyy-MM-dd'),
        format(new Date(app.toDate), 'yyyy-MM-dd'),
        Math.ceil((new Date(app.toDate).getTime() - new Date(app.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
        app.status,
        `"${app.reason.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {applications.slice(0, 5).map((app: any) => (
          <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {getLeaveTypeBadge(app.leaveType)}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {format(new Date(app.fromDate), 'MMM dd')} - {format(new Date(app.toDate), 'MMM dd, yyyy')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{app.reason}</p>
              </div>
            </div>
            {getStatusBadge(app.status)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            Leave History & Reports
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Track and analyze your leave applications</p>
        </div>
        <Button onClick={exportToCSV} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {showFilters && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="teacher_approved">Teacher Approved</SelectItem>
                    <SelectItem value="hod_approved">HOD Approved</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Leave Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                    <SelectItem value="emergency">Emergency Leave</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Leave Applications Found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or create a new leave application.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app: any) => (
                <Card key={app.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getLeaveTypeBadge(app.leaveType)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            {format(new Date(app.fromDate), 'MMM dd')} - {format(new Date(app.toDate), 'MMM dd, yyyy')}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Applied on {format(new Date(app.appliedAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.ceil((new Date(app.toDate).getTime() - new Date(app.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                        </p>
                      </div>
                      {app.priority && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</p>
                          <Badge variant={app.priority === 'urgent' ? 'destructive' : 'secondary'}>
                            {app.priority.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                      {app.attachmentPath && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attachment</p>
                          <Button variant="outline" size="sm" className="h-8">
                            <FileText className="w-3 h-3 mr-1" />
                            View Document
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        {app.reason}
                      </p>
                    </div>

                    {(app.reviewComments || app.classTeacherComments || app.hodComments) && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Comments</p>
                        <div className="space-y-2">
                          {app.classTeacherComments && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Class Teacher</p>
                              <p className="text-sm text-blue-600 dark:text-blue-300">{app.classTeacherComments}</p>
                            </div>
                          )}
                          {app.hodComments && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md">
                              <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">HOD</p>
                              <p className="text-sm text-purple-600 dark:text-purple-300">{app.hodComments}</p>
                            </div>
                          )}
                          {app.reviewComments && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">Final Review</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{app.reviewComments}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">
                  {applications.length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {applications.filter((app: any) => app.status === 'approved').length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                  {applications.filter((app: any) => ['pending', 'teacher_approved', 'hod_approved'].includes(app.status)).length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}