import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Users, Clock, CheckCircle, XCircle, Star, AlertCircle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isWeekend } from "date-fns";

interface LeaveCalendarProps {
  userId?: number;
  showAllUsers?: boolean;
}

export function LeaveCalendar({ userId, showAllUsers = false }: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: leaves = [] } = useQuery({
    queryKey: ["/api/leave-calendar", currentDate.getFullYear(), currentDate.getMonth() + 1, userId],
    enabled: true,
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ["/api/holidays", currentDate.getFullYear()],
    enabled: true,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const leavesByDate = useMemo(() => {
    const map = new Map();
    leaves.forEach((leave: any) => {
      const dateStr = format(new Date(leave.date), 'yyyy-MM-dd');
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr).push(leave);
    });
    return map;
  }, [leaves]);

  const holidaysByDate = useMemo(() => {
    const map = new Map();
    holidays.forEach((holiday: any) => {
      const dateStr = format(new Date(holiday.date), 'yyyy-MM-dd');
      map.set(dateStr, holiday);
    });
    return map;
  }, [holidays]);

  const getDayInfo = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLeaves = leavesByDate.get(dateStr) || [];
    const holiday = holidaysByDate.get(dateStr);
    
    return {
      leaves: dayLeaves,
      holiday,
      hasLeaves: dayLeaves.length > 0,
      isHoliday: !!holiday,
      isWeekend: isWeekend(date),
      isToday: isToday(date)
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <Card className="luxury-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            Leave Calendar - {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Legend */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm">Approved Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-sm">Pending Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm">Rejected Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3 text-orange-500" />
            <span className="text-sm">Holiday</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month start */}
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24"></div>
          ))}

          {/* Calendar Days */}
          {daysInMonth.map(date => {
            const dayInfo = getDayInfo(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);

            return (
              <div
                key={format(date, 'yyyy-MM-dd')}
                className={`
                  h-24 border border-gray-200 dark:border-gray-700 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md
                  ${dayInfo.isToday ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${isSelected ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}
                  ${dayInfo.isWeekend ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
                  ${dayInfo.isHoliday ? 'bg-orange-50 dark:bg-orange-900/20' : ''}
                `}
                onClick={() => setSelectedDate(date)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${dayInfo.isToday ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {format(date, 'd')}
                  </span>
                  {dayInfo.isHoliday && (
                    <Star className="w-3 h-3 text-orange-500" />
                  )}
                </div>

                <div className="space-y-1">
                  {dayInfo.leaves.slice(0, 3).map((leave: any, index: number) => (
                    <div
                      key={index}
                      className={`
                        w-full h-1.5 rounded ${getStatusColor(leave.status)}
                        ${leave.userId === userId ? 'opacity-100' : 'opacity-60'}
                      `}
                      title={`${leave.userName || 'User'} - ${leave.leaveType} (${leave.status})`}
                    />
                  ))}
                  {dayInfo.leaves.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayInfo.leaves.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold mb-3">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h4>
            
            {(() => {
              const dayInfo = getDayInfo(selectedDate);
              const holiday = dayInfo.holiday;
              const leaves = dayInfo.leaves;

              return (
                <div className="space-y-3">
                  {holiday && (
                    <div className="flex items-center gap-2 p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <Star className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="font-medium text-orange-800 dark:text-orange-200">{holiday.name}</p>
                        {holiday.description && (
                          <p className="text-sm text-orange-600 dark:text-orange-300">{holiday.description}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {leaves.length > 0 ? (
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-700 dark:text-gray-300">Leave Applications:</h5>
                      {leaves.map((leave: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border">
                          <div>
                            <p className="font-medium">{leave.userName || 'Unknown User'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {leave.leaveType} leave
                            </p>
                          </div>
                          <Badge className={`
                            ${leave.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                            ${leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${leave.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {leave.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : !holiday && (
                    <p className="text-gray-500 dark:text-gray-400">No leave applications for this day.</p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Calendar Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Approved Leaves</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {leaves.filter((leave: any) => leave.status === 'approved').length}
            </p>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending Leaves</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {leaves.filter((leave: any) => leave.status === 'pending').length}
            </p>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Holidays</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {holidays.filter((holiday: any) => {
                const holidayDate = new Date(holiday.date);
                return holidayDate.getMonth() === currentDate.getMonth() && 
                       holidayDate.getFullYear() === currentDate.getFullYear();
              }).length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}