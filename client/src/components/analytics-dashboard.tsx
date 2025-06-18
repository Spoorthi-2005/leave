import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Calendar, Clock, 
  Target, PieChart, Download, Filter, Award, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

interface AnalyticsDashboardProps {
  userRole: string;
  department?: string;
}

export function AnalyticsDashboard({ userRole, department }: AnalyticsDashboardProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState(department || "all");
  const [selectedMetric, setSelectedMetric] = useState("applications");

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics", selectedYear, selectedDepartment],
    enabled: true,
  });

  const { data: trends } = useQuery({
    queryKey: ["/api/analytics/trends", selectedYear],
    enabled: true,
  });

  const { data: departmentStats } = useQuery({
    queryKey: ["/api/analytics/departments", selectedYear],
    enabled: userRole === 'admin',
  });

  const { data: leaveTypeDistribution } = useQuery({
    queryKey: ["/api/analytics/leave-types", selectedYear, selectedDepartment],
    enabled: true,
  });

  const mockAnalytics = analytics || {
    totalApplications: 245,
    approvedApplications: 198,
    rejectedApplications: 32,
    pendingApplications: 15,
    averageProcessingTime: 2.3,
    totalLeaveDays: 1840,
    peakMonth: "December",
    mostCommonLeaveType: "casual",
    approvalRate: 80.8
  };

  const mockTrends = trends || [
    { month: "Jan", applications: 18, approvals: 15, rejections: 3 },
    { month: "Feb", applications: 22, approvals: 19, rejections: 3 },
    { month: "Mar", applications: 25, approvals: 20, rejections: 5 },
    { month: "Apr", applications: 28, approvals: 23, rejections: 5 },
    { month: "May", applications: 31, approvals: 26, rejections: 5 },
    { month: "Jun", applications: 35, approvals: 29, rejections: 6 },
    { month: "Jul", applications: 42, approvals: 35, rejections: 7 },
    { month: "Aug", applications: 38, approvals: 32, rejections: 6 },
    { month: "Sep", applications: 33, approvals: 28, rejections: 5 },
    { month: "Oct", applications: 29, approvals: 24, rejections: 5 },
    { month: "Nov", applications: 32, approvals: 27, rejections: 5 },
    { month: "Dec", applications: 45, approvals: 38, rejections: 7 }
  ];

  const mockDepartmentStats = departmentStats || [
    { department: "Computer Science", totalApplications: 89, approvalRate: 85.4, avgProcessingTime: 2.1 },
    { department: "Electronics", totalApplications: 67, approvalRate: 79.1, avgProcessingTime: 2.5 },
    { department: "Mechanical", totalApplications: 52, approvalRate: 78.8, avgProcessingTime: 2.8 },
    { department: "Civil", totalApplications: 37, approvalRate: 81.1, avgProcessingTime: 2.2 }
  ];

  const mockLeaveTypes = leaveTypeDistribution || [
    { type: "casual", count: 98, percentage: 40 },
    { type: "sick", count: 73, percentage: 30 },
    { type: "personal", count: 49, percentage: 20 },
    { type: "emergency", count: 25, percentage: 10 }
  ];

  const getPerformanceIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      trend: change >= 0 ? 'up' : 'down',
      color: change >= 0 ? 'text-green-600' : 'text-red-600',
      icon: change >= 0 ? TrendingUp : TrendingDown
    };
  };

  const generateReport = () => {
    const reportData = {
      period: `${selectedYear}${selectedDepartment !== 'all' ? ` - ${selectedDepartment}` : ''}`,
      analytics: mockAnalytics,
      trends: mockTrends,
      departments: mockDepartmentStats,
      leaveTypes: mockLeaveTypes,
      generatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leave-analytics-${selectedYear}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive insights into leave management patterns
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          
          {userRole === 'admin' && (
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
                <SelectItem value="Civil">Civil</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Button onClick={generateReport} className="luxury-button">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{mockAnalytics.totalApplications}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+12.5% from last year</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approval Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{mockAnalytics.approvalRate}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+3.2% from last year</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Processing Time</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{mockAnalytics.averageProcessingTime} days</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">-0.8 days faster</span>
                </div>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Leave Days</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{mockAnalytics.totalLeaveDays}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600">+8.7% from last year</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-900 luxury-card p-2 h-auto">
          <TabsTrigger value="trends" className="flex items-center gap-2 py-4 px-6 rounded-xl">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2 py-4 px-6 rounded-xl">
            <PieChart className="w-4 h-4" />
            Distribution
          </TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger value="departments" className="flex items-center gap-2 py-4 px-6 rounded-xl">
              <Users className="w-4 h-4" />
              Departments
            </TabsTrigger>
          )}
          <TabsTrigger value="insights" className="flex items-center gap-2 py-4 px-6 rounded-xl">
            <Award className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle>Monthly Leave Application Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-end justify-between gap-2 p-4">
                {mockTrends.map((month, index) => (
                  <div key={month.month} className="flex flex-col items-center gap-2 flex-1">
                    <div className="flex flex-col items-center gap-1 w-full">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg flex items-end justify-center text-white text-xs font-medium"
                        style={{ height: `${(month.applications / 50) * 100}%`, minHeight: '20px' }}
                      >
                        {month.applications}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-b-lg flex items-end justify-center text-white text-xs font-medium"
                        style={{ height: `${(month.approvals / 50) * 80}%`, minHeight: '15px' }}
                      >
                        {month.approvals}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{month.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm">Applications</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">Approvals</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle>Leave Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLeaveTypes.map((type, index) => (
                    <div key={type.type} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{type.type}</span>
                        <span className="text-gray-600 dark:text-gray-400">{type.count} ({type.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-blue-500' : 
                            index === 1 ? 'bg-green-500' : 
                            index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${type.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardHeader>
                <CardTitle>Application Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Approved</span>
                      <span className="text-gray-600 dark:text-gray-400">{mockAnalytics.approvedApplications}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${(mockAnalytics.approvedApplications / mockAnalytics.totalApplications) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Rejected</span>
                      <span className="text-gray-600 dark:text-gray-400">{mockAnalytics.rejectedApplications}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-red-500"
                        style={{ width: `${(mockAnalytics.rejectedApplications / mockAnalytics.totalApplications) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Pending</span>
                      <span className="text-gray-600 dark:text-gray-400">{mockAnalytics.pendingApplications}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-yellow-500"
                        style={{ width: `${(mockAnalytics.pendingApplications / mockAnalytics.totalApplications) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Departments Tab */}
        {userRole === 'admin' && (
          <TabsContent value="departments" className="space-y-6">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDepartmentStats.map((dept) => (
                    <div key={dept.department} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{dept.department}</h4>
                        <Badge variant="outline">{dept.totalApplications} applications</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Approval Rate</p>
                          <p className="text-lg font-semibold text-green-600">{dept.approvalRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Processing</p>
                          <p className="text-lg font-semibold text-blue-600">{dept.avgProcessingTime} days</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-500" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-green-800 dark:text-green-200">Peak Leave Period</p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    {mockAnalytics.peakMonth} shows highest leave applications (45 requests)
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Most Common Leave Type</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    {mockAnalytics.mostCommonLeaveType} leave accounts for 40% of all applications
                  </p>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="font-medium text-purple-800 dark:text-purple-200">Processing Efficiency</p>
                  <p className="text-sm text-purple-600 dark:text-purple-300">
                    Average processing time improved by 25% compared to last year
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Resource Planning</p>
                  <p className="text-sm text-amber-600 dark:text-amber-300">
                    Consider increasing staffing during December peak period
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Process Optimization</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Automate casual leave approvals for requests under 3 days
                  </p>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-green-800 dark:text-green-200">Policy Review</p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Review emergency leave policies - 10% increase in usage
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}