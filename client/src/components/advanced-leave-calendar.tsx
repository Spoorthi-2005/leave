import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, Users, GraduationCap, UserCheck, Building } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface AdvancedLeaveCalendarProps {
  userRole?: string;
  department?: string;
}

export function AdvancedLeaveCalendar({ userRole = "student", department }: AdvancedLeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<"personal" | "department" | "university">("personal");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");

  const { data: calendarData = [], isLoading } = useQuery({
    queryKey: ["/api/calendar-data", viewType, filterDepartment, format(currentDate, 'yyyy-MM')],
    enabled: true,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
    enabled: userRole === "admin",
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayLeaves = (date: Date) => {
    return calendarData.filter((leave: any) => {
      const fromDate = new Date(leave.fromDate);
      const toDate = new Date(leave.toDate);
      return date >= fromDate && date <= toDate;
    });
  };

  const getLeaveTypeColor = (leaveType: string) => {
    const colors = {
      sick: "bg-red-100 text-red-800 border-red-200",
      casual: "bg-blue-100 text-blue-800 border-blue-200",
      personal: "bg-purple-100 text-purple-800 border-purple-200",
      emergency: "bg-orange-100 text-orange-800 border-orange-200",
      other: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[leaveType as keyof typeof colors] || colors.other;
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <Card className="luxury-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Advanced Leave Calendar
          </div>
          <div className="flex items-center gap-4">
            {/* View Type Selector */}
            <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Personal View
                  </div>
                </SelectItem>
                <SelectItem value="department">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Department View
                  </div>
                </SelectItem>
                {userRole === "admin" && (
                  <SelectItem value="university">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      University View
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Department Filter */}
            {(viewType === "department" || viewType === "university") && (
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.code} value={dept.code}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium min-w-[120px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-2 text-center font-medium text-gray-600 dark:text-gray-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2">{day}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map(day => {
                const dayLeaves = getDayLeaves(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      min-h-[80px] p-2 border rounded-lg transition-all duration-200 hover:shadow-md
                      ${isSameMonth(day, currentDate) ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
                      ${isToday ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
                    `}
                  >
                    <div className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-1 mt-1">
                      {dayLeaves.slice(0, 2).map((leave: any, index: number) => (
                        <div
                          key={index}
                          className={`text-xs px-1 py-0.5 rounded border truncate ${getLeaveTypeColor(leave.leaveType)}`}
                          title={`${leave.applicantName} - ${leave.leaveType}`}
                        >
                          {viewType === "personal" ? leave.leaveType : leave.applicantName}
                        </div>
                      ))}
                      
                      {dayLeaves.length > 2 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{dayLeaves.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-sm">Sick Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                <span className="text-sm">Casual Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
                <span className="text-sm">Personal Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
                <span className="text-sm">Emergency Leave</span>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {calendarData.filter((l: any) => l.status === 'pending').length}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-400">Pending</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {calendarData.filter((l: any) => l.status === 'approved').length}
                </div>
                <div className="text-sm text-green-700 dark:text-green-400">Approved</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {calendarData.filter((l: any) => l.status === 'rejected').length}
                </div>
                <div className="text-sm text-red-700 dark:text-red-400">Rejected</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(calendarData.map((l: any) => l.userId)).size}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-400">
                  {viewType === "personal" ? "My Applications" : "Applicants"}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}