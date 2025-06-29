import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { 
  TrendingUp, Users, GraduationCap, Building, Clock, CheckCircle, 
  XCircle, Calendar, Award, AlertTriangle, Target 
} from "lucide-react";
import { useState } from "react";

interface UniversityAnalyticsProps {
  userRole: string;
  department?: string;
}

export function UniversityAnalytics({ userRole, department }: UniversityAnalyticsProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("current_month");

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/university-analytics", selectedDepartment, timeRange],
    enabled: userRole === "admin" || userRole === "faculty",
  });

  const { data: departmentStats = [] } = useQuery({
    queryKey: ["/api/department-statistics", timeRange],
    enabled: userRole === "admin",
  });

  const { data: yearWiseData = [] } = useQuery({
    queryKey: ["/api/year-wise-analytics", selectedDepartment],
    enabled: userRole === "admin",
  });

  const { data: attendanceTrends = [] } = useQuery({
    queryKey: ["/api/attendance-trends", timeRange],
    enabled: userRole === "admin",
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              University Analytics Dashboard
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="CSE">Computer Science Engineering</SelectItem>
                  <SelectItem value="ECE">Electronics & Communication</SelectItem>
                  <SelectItem value="EEE">Electrical & Electronics</SelectItem>
                  <SelectItem value="MECH">Mechanical Engineering</SelectItem>
                  <SelectItem value="CIVIL">Civil Engineering</SelectItem>
                  <SelectItem value="IT">Information Technology</SelectItem>
                  <SelectItem value="AIDS">AI & Data Science</SelectItem>
                  <SelectItem value="AIML">AI & Machine Learning</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="current_semester">Current Semester</SelectItem>
                  <SelectItem value="academic_year">Academic Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">{analyticsData?.totalStudents || 2800}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +5.2% from last year
                </p>
              </div>
              <GraduationCap className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Faculty Members</p>
                <p className="text-3xl font-bold text-green-600">{analyticsData?.totalFaculty || 180}</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3" />
                  Across 8 departments
                </p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Applications</p>
                <p className="text-3xl font-bold text-orange-600">{analyticsData?.pendingApplications || 23}</p>
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Requires attention
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approval Rate</p>
                <p className="text-3xl font-bold text-purple-600">{analyticsData?.approvalRate || 89}%</p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  This month
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department-wise Leave Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-500" />
              Department-wise Leave Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" fill="#10B981" name="Approved" />
                <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              Leave Types Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.leaveTypeDistribution || [
                    { name: 'Sick Leave', value: 35, color: '#EF4444' },
                    { name: 'Casual Leave', value: 28, color: '#3B82F6' },
                    { name: 'Personal Leave', value: 22, color: '#8B5CF6' },
                    { name: 'Emergency Leave', value: 10, color: '#F59E0B' },
                    { name: 'Other', value: 5, color: '#6B7280' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {(analyticsData?.leaveTypeDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Year-wise and Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-green-500" />
              Year-wise Leave Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(yearWiseData || [
                { year: "1st Year", total: 45, approved: 38, pending: 4, rejected: 3 },
                { year: "2nd Year", total: 52, approved: 44, pending: 5, rejected: 3 },
                { year: "3rd Year", total: 67, approved: 58, pending: 6, rejected: 3 },
                { year: "4th Year", total: 89, approved: 78, pending: 8, rejected: 3 }
              ]).map((yearData: any) => (
                <div key={yearData.year} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{yearData.year}</span>
                    <span className="text-sm text-gray-500">{yearData.total} applications</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Progress 
                        value={(yearData.approved / yearData.total) * 100} 
                        className="h-2 bg-green-100"
                      />
                      <span className="text-xs text-green-600">{yearData.approved} approved</span>
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={(yearData.pending / yearData.total) * 100} 
                        className="h-2 bg-orange-100"
                      />
                      <span className="text-xs text-orange-600">{yearData.pending} pending</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceTrends || [
                { month: 'Jan', applications: 65, approval_rate: 85 },
                { month: 'Feb', applications: 59, approval_rate: 88 },
                { month: 'Mar', applications: 80, approval_rate: 82 },
                { month: 'Apr', applications: 81, approval_rate: 89 },
                { month: 'May', applications: 56, approval_rate: 91 },
                { month: 'Jun', applications: 55, approval_rate: 87 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="applications" stroke="#3B82F6" name="Applications" />
                <Line type="monotone" dataKey="approval_rate" stroke="#10B981" name="Approval Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts and Insights */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            System Insights & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-700">Peak Application Period</span>
              </div>
              <p className="text-sm text-blue-600">
                April-May shows highest leave applications. Plan accordingly for semester end activities.
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-700">High Approval Rate</span>
              </div>
              <p className="text-sm text-green-600">
                89% approval rate indicates good student-faculty communication and valid applications.
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-orange-700">Pending Review</span>
              </div>
              <p className="text-sm text-orange-600">
                {analyticsData?.pendingApplications || 23} applications pending. Average review time: 2.3 days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}